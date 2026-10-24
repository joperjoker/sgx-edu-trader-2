"use server";

import { revalidatePath } from "next/cache";
import type {
  HoldingDoc,
  LimitOrderDoc,
  OrderType,
  TradeAction,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  readLocalDb,
  writeLocalDb,
} from "@/lib/firebase/store";
import { getAdminDb, isLiveFirestoreReady } from "@/lib/firebase/admin";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  getSgxSessionStatus,
  getSgxTickSize,
  roundToSgxTick,
  type SgxFeeBreakdown,
} from "@/utils/sgx-market";
import { TICKER_META, VALID_TICKERS } from "@/utils/tickers";

export interface ExecuteTradeResponse {
  success: boolean;
  error?: string;
  data?: {
    status: "filled" | "queued_limit";
    contractNoteNo: string;
    ticker: string;
    companyName: string;
    action: TradeAction;
    orderType: OrderType;
    shares: number;
    executionPrice: number;
    fees: SgxFeeBreakdown;
    cashBalance: number;
    netValue: number;
    holdingShares: number;
    holdingAvgPrice: number;
    realizedPnl: number | null;
    achievementUnlocked: string | null;
  };
}

function generateContractNoteNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SGX-CN-${ymd}-${rand}`;
}

export async function executeSgxTradeAction(args: {
  ticker: string;
  shares: number | string;
  action: TradeAction;
  orderType?: OrderType;
  limitPrice?: number | string | null;
}): Promise<ExecuteTradeResponse> {
  const ticker = String(args.ticker ?? "").trim().toUpperCase();
  if (!VALID_TICKERS.includes(ticker)) {
    return {
      success: false,
      error: "Invalid SGX stock ticker. Only the 20 approved SGX counters are tradeable.",
    };
  }

  const sharesNum = Number(args.shares);
  if (!Number.isInteger(sharesNum) || sharesNum <= 0) {
    return {
      success: false,
      error: "Quantity must be a positive whole number of shares.",
    };
  }

  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    return {
      success: false,
      error: "You must be signed in with your Google account to place an SGX order.",
    };
  }

  const [settings, snapshot] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
  ]);

  // Check Board Lot Rule (100 shares standard on SGX unless teacher enables Odd Lots)
  if (!settings.allowOddLots && sharesNum % 100 !== 0) {
    return {
      success: false,
      error:
        "SGX Standard Board Lot Rule: Orders must be placed in multiples of 100 shares (e.g., 100, 200, 500). Your teacher can enable Odd-Lot (1-share) mode in the Teacher Console.",
    };
  }

  // Check Strict SGX Exchange Hours if enabled by teacher
  const marketSession = getSgxSessionStatus(new Date());
  if (settings.strictExchangeHours && !marketSession.isOpen) {
    return {
      success: false,
      error: `${marketSession.label}. Strict SGX Exchange Hours mode is enabled by your teacher.`,
    };
  }

  const db = readLocalDb();
  const user: UserProfileDoc | undefined = db.users[sessionUser.uid];
  if (!user) {
    return { success: false, error: "User profile not found." };
  }

  if (user.tradingLocked) {
    return {
      success: false,
      error: "Trading is currently locked for your class by your teacher.",
    };
  }

  if (
    user.coolingOffUntil &&
    new Date(user.coolingOffUntil).getTime() > Date.now()
  ) {
    const formatted = new Date(user.coolingOffUntil).toLocaleTimeString(
      "en-SG",
      {
        timeZone: "Asia/Singapore",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    return {
      success: false,
      error: `Cooling-off circuit breaker active until ${formatted} SGT. Take a moment to review your risk strategy.`,
    };
  }

  // 30-second rate limit on same stock counter
  const thirtySecAgo = Date.now() - 30_000;
  const recentSameTicker = db.tradeHistory.find(
    (t) =>
      t.userId === user.uid &&
      t.ticker === ticker &&
      new Date(t.timestamp).getTime() > thirtySecAgo,
  );
  if (recentSameTicker) {
    return {
      success: false,
      error:
        "SGX Anti-Churning Rule: Please wait 30 seconds before submitting another order on the same counter.",
    };
  }

  // Always read price from server-side snapshot — NEVER trust browser price
  const meta = TICKER_META[ticker];
  const quote = snapshot.quotes[ticker];
  const refLastPrice = quote?.price ?? meta.refPrice;
  const tickSize = getSgxTickSize(refLastPrice);
  const spread = calculateAdminBidAsk(refLastPrice, tickSize);
  const currentBid = quote?.bid ?? spread.bid;
  const currentAsk = quote?.ask ?? spread.ask;

  const isBuy = args.action === "buy";
  const orderType: OrderType = args.orderType === "limit" ? "limit" : "market";

  let executionPrice = isBuy ? currentAsk : currentBid;
  let parsedLimitPrice: number | null = null;

  if (orderType === "limit") {
    const rawLimit = Number(args.limitPrice);
    if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
      return {
        success: false,
        error: "Please enter a valid positive Limit Price.",
      };
    }
    parsedLimitPrice = roundToSgxTick(rawLimit);

    // Check if limit order is immediately marketable
    const isMarketable = isBuy
      ? parsedLimitPrice >= currentAsk
      : parsedLimitPrice <= currentBid;

    if (!isMarketable) {
      // Queue open limit order in order book
      const existingHolding = db.holdings[user.uid]?.[ticker];
      if (!isBuy && (!existingHolding || existingHolding.shares < sharesNum)) {
        return {
          success: false,
          error: `Insufficient holdings: You own ${existingHolding?.shares ?? 0} shares of ${ticker}.`,
        };
      }

      const estFees = calculateSgxTradeFees(
        sharesNum,
        parsedLimitPrice,
        isBuy,
        settings.feeMode,
      );
      if (isBuy && user.cashBalance < estFees.netTotal) {
        return {
          success: false,
          error: `Insufficient cash for Limit Buy: Requires S$${estFees.netTotal.toFixed(2)} (incl. S$${estFees.totalFee.toFixed(2)} fees), available S$${user.cashBalance.toFixed(2)}.`,
        };
      }

      const limitOrder: LimitOrderDoc = {
        id: `lmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.uid,
        userEmail: user.email,
        userNickname: user.nickname,
        ticker,
        companyName: meta.name,
        action: args.action,
        shares: sharesNum,
        limitPrice: parsedLimitPrice,
        status: "open",
        createdAt: new Date().toISOString(),
        filledAt: null,
      };
      db.limitOrders.unshift(limitOrder);
      writeLocalDb(db);

      revalidatePath(`/company/${ticker}`);
      revalidatePath("/portfolio");

      return {
        success: true,
        data: {
          status: "queued_limit",
          contractNoteNo: limitOrder.id.toUpperCase(),
          ticker,
          companyName: meta.name,
          action: args.action,
          orderType: "limit",
          shares: sharesNum,
          executionPrice: parsedLimitPrice,
          fees: estFees,
          cashBalance: user.cashBalance,
          netValue: user.netValue,
          holdingShares: existingHolding?.shares ?? 0,
          holdingAvgPrice: existingHolding?.avgPrice ?? 0,
          realizedPnl: null,
          achievementUnlocked: null,
        },
      };
    }

    // Marketable limit order executes at best available market price (price improvement)
    executionPrice = isBuy
      ? Math.min(parsedLimitPrice, currentAsk)
      : Math.max(parsedLimitPrice, currentBid);
  }

  const fees = calculateSgxTradeFees(
    sharesNum,
    executionPrice,
    isBuy,
    settings.feeMode,
  );

  if (!db.holdings[user.uid]) {
    db.holdings[user.uid] = {};
  }
  const existingHolding: HoldingDoc | undefined =
    db.holdings[user.uid][ticker];

  let nextCash = user.cashBalance;
  let nextShares = existingHolding?.shares ?? 0;
  let nextAvgPrice = existingHolding?.avgPrice ?? executionPrice;
  let realizedPnl: number | null = null;

  if (isBuy) {
    if (user.cashBalance < fees.netTotal) {
      return {
        success: false,
        error: `Insufficient buying power: Order requires S$${fees.netTotal.toFixed(2)} (incl. S$${fees.totalFee.toFixed(2)} SGX/CDP fees), but your cash balance is S$${user.cashBalance.toFixed(2)}.`,
      };
    }
    nextCash = Number((user.cashBalance - fees.netTotal).toFixed(2));
    const totalPrevCost = nextShares * (existingHolding?.avgPrice ?? 0);
    const newTotalShares = nextShares + sharesNum;
    nextAvgPrice = Number(
      ((totalPrevCost + sharesNum * executionPrice) / newTotalShares).toFixed(4),
    );
    nextShares = newTotalShares;
  } else {
    if (!existingHolding || existingHolding.shares < sharesNum) {
      return {
        success: false,
        error: `You only own ${existingHolding?.shares ?? 0} shares of ${ticker}. Cannot sell ${sharesNum} shares.`,
      };
    }
    nextCash = Number((user.cashBalance + fees.netTotal).toFixed(2));
    realizedPnl = Number(
      (
        (executionPrice - existingHolding.avgPrice) * sharesNum -
        fees.totalFee
      ).toFixed(2),
    );
    nextShares = existingHolding.shares - sharesNum;
    nextAvgPrice = existingHolding.avgPrice;
  }

  const nowIso = new Date().toISOString();
  if (nextShares > 0) {
    db.holdings[user.uid][ticker] = {
      ticker,
      shares: nextShares,
      avgPrice: nextAvgPrice,
      updatedAt: nowIso,
    };
  } else {
    delete db.holdings[user.uid][ticker];
  }

  // Recalculate total holdings value & HHI diversification index
  const activeHoldings = Object.values(db.holdings[user.uid]).filter(
    (h) => h.shares > 0,
  );
  const positionValues: number[] = [];
  let holdingsValueSum = 0;

  for (const h of activeHoldings) {
    const livePx =
      h.ticker === ticker
        ? executionPrice
        : snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
    const val = Number((h.shares * livePx).toFixed(2));
    positionValues.push(val);
    holdingsValueSum += val;
  }

  const nextHoldingsValue = Number(holdingsValueSum.toFixed(2));
  const nextNetValue = Number((nextCash + nextHoldingsValue).toFixed(2));
  const nextHhi = calculatePortfolioHhi(positionValues);
  const nextFeesPaid = Number((user.totalFeesPaid + fees.totalFee).toFixed(2));

  // Cooling-off circuit breaker check: if selling and netValue dropped >= 15% below startingCapital
  let nextCoolingOff = user.coolingOffUntil;
  const startingCap = user.startingCapital > 0 ? user.startingCapital : 10000;
  const totalDrawdownRatio = (startingCap - nextNetValue) / startingCap;
  if (!isBuy && totalDrawdownRatio >= 0.15) {
    nextCoolingOff = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  }

  const contractNoteNo = generateContractNoteNumber();
  const tradeDoc: TradeHistoryDoc = {
    id: `trd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.uid,
    userEmail: user.email,
    userNickname: user.nickname,
    ticker,
    companyName: meta.name,
    action: args.action,
    orderType,
    shares: sharesNum,
    executionPrice,
    limitPrice: parsedLimitPrice,
    grossAmount: fees.grossAmount,
    brokerageFee: fees.brokerageFee,
    clearingFee: fees.clearingFee,
    sgxTradingFee: fees.sgxTradingFee,
    gstAmount: fees.gstAmount,
    totalFee: fees.totalFee,
    netTotal: fees.netTotal,
    realizedPnl,
    contractNoteNo,
    semester: settings.currentSemester || "2026-S2",
    timestamp: nowIso,
  };

  db.tradeHistory.unshift(tradeDoc);

  // Evaluate Achievements
  const updatedAchievements = { ...(user.achievements ?? {}) };
  let newlyUnlocked: string | null = null;

  const grantIfMissing = (key: string) => {
    if (!updatedAchievements[key]) {
      updatedAchievements[key] = nowIso;
      if (!newlyUnlocked) newlyUnlocked = key;
    }
  };

  const userTradesCount = db.tradeHistory.filter(
    (t) => t.userId === user.uid,
  ).length;

  if (isBuy && userTradesCount >= 1) {
    grantIfMissing("first_trade");
  }
  if (!isBuy && realizedPnl !== null && realizedPnl > 0) {
    grantIfMissing("first_profit");
  }

  const distinctTiers = new Set<string>();
  activeHoldings.forEach((h) => {
    const t = TICKER_META[h.ticker]?.tier;
    if (t) distinctTiers.add(t);
  });
  if (distinctTiers.size >= 3) {
    grantIfMissing("diversified");
  }
  if (userTradesCount >= 5) {
    grantIfMissing("fee_aware");
  }

  // Fast mover: trade during 09:00-10:00 SGT
  const sgtHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Singapore",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  if (sgtHour === 9) {
    grantIfMissing("fast_mover");
  }

  const updatedUser: UserProfileDoc = {
    ...user,
    cashBalance: nextCash,
    holdingsValue: nextHoldingsValue,
    netValue: nextNetValue,
    totalFeesPaid: nextFeesPaid,
    hhi: nextHhi,
    coolingOffUntil: nextCoolingOff,
    achievements: updatedAchievements,
    achievementCount: Object.keys(updatedAchievements).length,
  };

  db.users[user.uid] = updatedUser;
  writeLocalDb(db);

  // Also mirror atomic transaction to Google Cloud Firestore when live credentials are active
  if (isLiveFirestoreReady()) {
    try {
      const adminDb = getAdminDb();
      await adminDb.runTransaction(async (tx) => {
        const userRef = adminDb.collection("users").doc(user.uid);
        const holdingRef = userRef.collection("holdings").doc(ticker);
        const tradeRef = adminDb.collection("trade_history").doc(tradeDoc.id);

        tx.set(userRef, updatedUser, { merge: true });
        if (nextShares > 0) {
          tx.set(holdingRef, {
            ticker,
            shares: nextShares,
            avgPrice: nextAvgPrice,
            updatedAt: nowIso,
          });
        } else {
          tx.delete(holdingRef);
        }
        tx.set(tradeRef, tradeDoc);
      });
    } catch (err) {
      console.error("Firestore transaction mirror error:", err);
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath(`/company/${ticker}`);
  revalidatePath("/portfolio");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");

  return {
    success: true,
    data: {
      status: "filled",
      contractNoteNo,
      ticker,
      companyName: meta.name,
      action: args.action,
      orderType,
      shares: sharesNum,
      executionPrice,
      fees,
      cashBalance: nextCash,
      netValue: nextNetValue,
      holdingShares: nextShares,
      holdingAvgPrice: nextAvgPrice,
      realizedPnl,
      achievementUnlocked: newlyUnlocked,
    },
  };
}

export async function cancelLimitOrderAction(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) return { success: false, error: "Not signed in." };

  const db = readLocalDb();
  const idx = db.limitOrders.findIndex(
    (o) => o.id === orderId && o.userId === sessionUser.uid,
  );
  if (idx < 0) return { success: false, error: "Order not found." };

  db.limitOrders[idx].status = "cancelled";
  writeLocalDb(db);

  revalidatePath("/portfolio");
  return { success: true };
}
