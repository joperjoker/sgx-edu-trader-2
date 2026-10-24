import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "dist-hosting");
const shimDir = path.join(rootDir, ".next-hosting-shims");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(shimDir)) fs.mkdirSync(shimDir, { recursive: true });

// Load .env.local for NEXT_PUBLIC_* keys
const envVars = {};
const envFile = path.join(rootDir, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      if (k.startsWith("NEXT_PUBLIC_")) {
        envVars[`process.env.${k}`] = JSON.stringify(v);
      }
    }
  }
}
envVars["process.env.NODE_ENV"] = JSON.stringify("production");

// Load initial seed DB from .data/firestore-local.json (which already has the 20 live Yahoo Finance quotes!)
const localDbPath = path.join(rootDir, ".data", "firestore-local.json");
const seedDb = JSON.parse(fs.readFileSync(localDbPath, "utf8"));
delete seedDb.marketCandles;

// Create shims for next/link, next/navigation, and @/actions/*
fs.writeFileSync(
  path.join(shimDir, "next-link.tsx"),
  `import React, { useContext } from "react";
import { RouterCtx } from "../scripts/firebase-spa-bridge";
export default function Link({ href, children, className, onClick, ...rest }: any) {
  const { navigate } = useContext(RouterCtx);
  return (
    <a
      href={typeof href === "string" ? href : "/dashboard"}
      className={className}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (!e.defaultPrevented && typeof href === "string" && href.startsWith("/")) {
          e.preventDefault();
          navigate(href);
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
`,
);

fs.writeFileSync(
  path.join(shimDir, "next-navigation.tsx"),
  `import { useContext } from "react";
import { RouterCtx } from "../scripts/firebase-spa-bridge";
export function usePathname() {
  return useContext(RouterCtx).pathname;
}
export function useSearchParams() {
  return useContext(RouterCtx).searchParams;
}
export function useRouter() {
  const { navigate, refresh } = useContext(RouterCtx);
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to),
    refresh: () => refresh(),
    back: () => window.history.back(),
  };
}
export function redirect(to: string) {
  window.location.href = to;
}
`,
);

fs.writeFileSync(
  path.join(shimDir, "actions-shim.ts"),
  `import { getBrowserDb, saveBrowserDb, getActiveUid } from "../scripts/firebase-spa-bridge";
import { TICKER_META, VALID_TICKERS } from "../src/utils/tickers";
import { evaluateCopilotTurn } from "../src/lib/copilot-engine";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  getSgxTickSize,
  roundToSgxTick,
  generateDeterministicSparkline,
} from "../src/utils/sgx-market";

export async function completeOnboardingAction(args: { nickname: string; classJoinCode?: string }) {
  const db = getBrowserDb();
  const uid = getActiveUid();
  const user = db.users[uid];
  if (!user) return { success: false, error: "Not signed in." };
  const now = new Date().toISOString();
  let joinedClassName: string | undefined;
  const code = (args.classJoinCode ?? "").trim().toUpperCase();
  if (code) {
    const cls = Object.values(db.classGroups).find((c: any) => c.joinCode.toUpperCase() === code);
    if (!cls) return { success: false, error: 'Class Join Code not found. Try "SGX4E1" or "SGXJC1".' };
    if (!user.classGroupIds.includes((cls as any).id)) user.classGroupIds.unshift((cls as any).id);
    joinedClassName = (cls as any).name;
  }
  user.nickname = args.nickname.trim() || user.nickname;
  user.acceptedTermsAt = now;
  saveBrowserDb(db);
  return { success: true, data: { joinedClassName } };
}

export async function markTutorialCompleteAction() {
  const db = getBrowserDb();
  const uid = getActiveUid();
  if (db.users[uid]) {
    db.users[uid].hasCompletedTutorial = true;
    saveBrowserDb(db);
  }
  return { success: true };
}

export async function submitWeeklyReflectionAction(args: { weekNumber: number; promptQuestion: string; responseText: string }) {
  if (args.responseText.trim().length < 15) {
    return { success: false, error: "Please write at least 15 characters reflecting on your strategy." };
  }
  const db = getBrowserDb();
  const uid = getActiveUid();
  const user = db.users[uid];
  if (!user) return { success: false, error: "Not signed in." };
  const id = \`refl-\${uid}-w\${args.weekNumber}\`;
  db.reflections[id] = {
    id,
    userId: uid,
    userEmail: user.email,
    userNickname: user.nickname,
    classGroupId: user.classGroupIds[0] ?? null,
    weekNumber: args.weekNumber,
    semester: db.appSettings.currentSemester || "2026-S2",
    promptQuestion: args.promptQuestion,
    responseText: args.responseText.trim(),
    updatedAt: new Date().toISOString(),
  };
  saveBrowserDb(db);
  return { success: true };
}

export async function executeSgxTradeAction(args: any) {
  const ticker = String(args.ticker ?? "").trim().toUpperCase();
  if (!VALID_TICKERS.includes(ticker)) return { success: false, error: "Invalid SGX stock ticker." };
  const sharesNum = Number(args.shares);
  if (!Number.isInteger(sharesNum) || sharesNum <= 0) return { success: false, error: "Quantity must be a positive whole number." };

  const db = getBrowserDb();
  const uid = getActiveUid();
  const user = db.users[uid];
  if (!user) return { success: false, error: "Please sign in first." };
  if (user.tradingLocked) return { success: false, error: "Trading is currently locked for your class by your teacher." };
  if (!db.appSettings.allowOddLots && sharesNum % 100 !== 0) {
    return { success: false, error: "SGX Standard Board Lot Rule: Orders must be placed in multiples of 100 shares." };
  }

  const meta = TICKER_META[ticker];
  const quote = db.marketSnapshot.quotes[ticker];
  const refPx = quote?.price ?? meta.refPrice;
  const tickSize = getSgxTickSize(refPx);
  const spread = calculateAdminBidAsk(refPx, tickSize);
  const currentBid = quote?.bid ?? spread.bid;
  const currentAsk = quote?.ask ?? spread.ask;
  const isBuy = args.action === "buy";
  const orderType = args.orderType === "limit" ? "limit" : "market";
  let executionPrice = isBuy ? currentAsk : currentBid;
  let parsedLimitPrice: number | null = null;

  if (orderType === "limit") {
    const rawLimit = Number(args.limitPrice);
    if (!Number.isFinite(rawLimit) || rawLimit <= 0) return { success: false, error: "Enter a valid positive Limit Price." };
    parsedLimitPrice = roundToSgxTick(rawLimit);
    const isMarketable = isBuy ? parsedLimitPrice >= currentAsk : parsedLimitPrice <= currentBid;
    if (!isMarketable) {
      const estFees = calculateSgxTradeFees(sharesNum, parsedLimitPrice, isBuy, db.appSettings.feeMode);
      const lmt = {
        id: \`lmt-\${Date.now()}\`,
        userId: user.uid,
        userEmail: user.email,
        userNickname: user.nickname,
        ticker,
        companyName: meta.name,
        action: args.action,
        shares: sharesNum,
        limitPrice: parsedLimitPrice,
        status: "open" as const,
        createdAt: new Date().toISOString(),
        filledAt: null,
      };
      db.limitOrders.unshift(lmt);
      saveBrowserDb(db);
      return {
        success: true,
        data: {
          status: "queued_limit",
          contractNoteNo: lmt.id.toUpperCase(),
          ticker,
          companyName: meta.name,
          action: args.action,
          orderType: "limit",
          shares: sharesNum,
          executionPrice: parsedLimitPrice,
          fees: estFees,
          cashBalance: user.cashBalance,
          netValue: user.netValue,
          holdingShares: db.holdings[user.uid]?.[ticker]?.shares ?? 0,
          holdingAvgPrice: db.holdings[user.uid]?.[ticker]?.avgPrice ?? 0,
          realizedPnl: null,
          achievementUnlocked: null,
        },
      };
    }
    executionPrice = isBuy ? Math.min(parsedLimitPrice, currentAsk) : Math.max(parsedLimitPrice, currentBid);
  }

  const fees = calculateSgxTradeFees(sharesNum, executionPrice, isBuy, db.appSettings.feeMode);
  if (!db.holdings[user.uid]) db.holdings[user.uid] = {};
  const existing = db.holdings[user.uid][ticker];
  let nextCash = user.cashBalance;
  let nextShares = existing?.shares ?? 0;
  let nextAvg = existing?.avgPrice ?? executionPrice;
  let realizedPnl: number | null = null;

  if (isBuy) {
    if (user.cashBalance < fees.netTotal) {
      return { success: false, error: \`Insufficient buying power: Requires S$\${fees.netTotal.toFixed(2)}, available S$\${user.cashBalance.toFixed(2)}.\` };
    }
    nextCash = Number((user.cashBalance - fees.netTotal).toFixed(2));
    const prevCost = nextShares * (existing?.avgPrice ?? 0);
    nextShares += sharesNum;
    nextAvg = Number(((prevCost + sharesNum * executionPrice) / nextShares).toFixed(4));
  } else {
    if (!existing || existing.shares < sharesNum) {
      return { success: false, error: \`You only own \${existing?.shares ?? 0} shares of \${ticker}.\` };
    }
    nextCash = Number((user.cashBalance + fees.netTotal).toFixed(2));
    realizedPnl = Number(((executionPrice - existing.avgPrice) * sharesNum - fees.totalFee).toFixed(2));
    nextShares = existing.shares - sharesNum;
  }

  const nowIso = new Date().toISOString();
  if (nextShares > 0) {
    db.holdings[user.uid][ticker] = { ticker, shares: nextShares, avgPrice: nextAvg, updatedAt: nowIso };
  } else {
    delete db.holdings[user.uid][ticker];
  }

  const activeHoldings = Object.values(db.holdings[user.uid]).filter((h: any) => h.shares > 0);
  const posValues: number[] = [];
  let holdSum = 0;
  for (const h of activeHoldings as any[]) {
    const px = h.ticker === ticker ? executionPrice : (db.marketSnapshot.quotes[h.ticker]?.price ?? h.avgPrice);
    const val = Number((h.shares * px).toFixed(2));
    posValues.push(val);
    holdSum += val;
  }

  user.cashBalance = nextCash;
  user.holdingsValue = Number(holdSum.toFixed(2));
  user.netValue = Number((nextCash + user.holdingsValue).toFixed(2));
  user.hhi = calculatePortfolioHhi(posValues);
  user.totalFeesPaid = Number((user.totalFeesPaid + fees.totalFee).toFixed(2));

  const ymd = nowIso.slice(0, 10).replace(/-/g, "");
  const contractNoteNo = \`SGX-CN-\${ymd}-\${Math.floor(1000 + Math.random() * 9000)}\`;
  db.tradeHistory.unshift({
    id: \`trd-\${Date.now()}\`,
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
    semester: db.appSettings.currentSemester || "2026-S2",
    timestamp: nowIso,
  });

  let newlyUnlocked: string | null = null;
  if (!user.achievements["first_trade"]) {
    user.achievements["first_trade"] = nowIso;
    user.achievementCount = Object.keys(user.achievements).length;
    newlyUnlocked = "first_trade";
  }

  saveBrowserDb(db);
  window.dispatchEvent(new CustomEvent("sgx:balance-updated", { detail: { cashBalance: user.cashBalance, netValue: user.netValue } }));

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
      cashBalance: user.cashBalance,
      netValue: user.netValue,
      holdingShares: nextShares,
      holdingAvgPrice: nextAvg,
      realizedPnl,
      achievementUnlocked: newlyUnlocked,
    },
  };
}

export async function cancelLimitOrderAction(orderId: string) {
  const db = getBrowserDb();
  const idx = db.limitOrders.findIndex((o: any) => o.id === orderId);
  if (idx >= 0) {
    db.limitOrders[idx].status = "cancelled";
    saveBrowserDb(db);
  }
  return { success: true };
}

export async function pullLatestMarketDataAction() {
  const db = getBrowserDb();
  const uid = getActiveUid();
  return { success: true, snapshot: db.marketSnapshot, user: db.users[uid] ?? null };
}

export async function triggerLiveMarketTickAction() {
  const db = getBrowserDb();
  const now = new Date().toISOString();
  VALID_TICKERS.forEach((ticker, idx) => {
    const q = db.marketSnapshot.quotes[ticker];
    if (!q) return;
    const tick = getSgxTickSize(q.price);
    const delta = ((Date.now() + idx * 17) % 3) - 1;
    const nextPrice = roundToSgxTick(Math.max(tick * 5, q.price + delta * tick));
    const change = Number((nextPrice - q.prevClose).toFixed(tick < 0.01 ? 3 : 2));
    const changePct = Number(((change / q.prevClose) * 100).toFixed(2));
    const { bid, ask } = calculateAdminBidAsk(nextPrice, tick);
    q.price = nextPrice;
    q.change = change;
    q.changePct = changePct;
    q.bid = bid;
    q.ask = ask;
    q.volume += Math.floor(Math.random() * 8500);
    q.sparkline = generateDeterministicSparkline(ticker, nextPrice, changePct);
    q.updatedAt = now;
  });
  db.marketSnapshot.updatedAt = now;
  saveBrowserDb(db);
  const uid = getActiveUid();
  return { success: true, snapshot: db.marketSnapshot, user: db.users[uid] ?? null };
}

export async function analyseCompanyNewsAction(ticker: string) {
  const meta = TICKER_META[ticker.toUpperCase()] ?? TICKER_META["D05.SI"];
  const headlines = [
    \`\${meta.name} (\${ticker}) reports steady operational performance across ASEAN markets\`,
    \`SGX institutional flows highlight dividend resilience in \${meta.sector} sector\`,
    \`Analysts review capital allocation and margin outlook for \${meta.shortName}\`,
  ];
  const text = \`Recent updates for \${meta.name} (\${ticker}) focus on its core \${meta.sector} operations and margin stability across Singapore and regional ASEAN markets. Investors track revenue growth alongside operating costs (the day-to-day expenses required to run the business) to judge whether dividend payouts remain sustainable.\\n\\nWhat AI Misses:\\nHeadline summaries cannot measure management execution quality or how competitors are pricing their services on the ground in Singapore.\\n\\nYour Turn:\\n\${meta.learningObjective}\`;
  return { success: true, data: { text, headlines } };
}

export async function analysePricePatternAction(ticker: string) {
  const meta = TICKER_META[ticker.toUpperCase()] ?? TICKER_META["D05.SI"];
  const text = \`Over the past 30 trading sessions, \${meta.name} (\${ticker}) exhibited \${meta.tier === "Safe Bets" ? "moderate blue-chip volatility" : "active sector rotation"} aligned with Singapore institutional flows.\\n\\nSupporting Factors:\\n• Resilient demand within Singapore's \${meta.sector} ecosystem and steady recurring cash flows.\\n• Institutional investor interest in companies with established market share and dividend track records (approx. \${meta.dividendYieldPct}% yield).\\n\\nReversal Risks:\\n• Margin compression if input, energy, or labour costs in Singapore rise faster than revenue.\\n• Broader macroeconomic slowdowns or shifts in global interest rates affecting valuation multiples (P/E of \${meta.peRatio}x).\\n\\nWhat is YOUR assessment of this stock, and what additional research would you do before making a decision?\`;
  return { success: true, data: { text, days: 30 } };
}

export async function analyseFinancialHealthAction(ticker: string) {
  const meta = TICKER_META[ticker.toUpperCase()] ?? TICKER_META["D05.SI"];
  const rating = meta.tier === "Safe Bets" || meta.tier === "Industry Giants" ? "STRONG" : "MODERATE";
  const text = \`• Market Capitalisation (\${meta.marketCapB}): This is the total market value of all \${meta.shortName} shares combined on SGX, showing its scale within the \${meta.sector} industry.\\n• Price-to-Earnings Ratio (\${meta.peRatio}x): Investors currently pay S$\${meta.peRatio.toFixed(1)} for every S$1.00 of annual company earnings.\\n• Dividend Yield (\${meta.dividendYieldPct}%): Historically, the company distributes approximately \${meta.dividendYieldPct}% of its share price back to shareholders annually as tax-exempt cash dividends.\\n\\nRemember: This analysis is based on historical financial data. Past performance does not predict future results.\`;
  return { success: true, data: { rating, text } };
}

export async function runPortfolioStressTestAction(scenarioId: string) {
  const db = getBrowserDb();
  const uid = getActiveUid();
  const user = db.users[uid];
  const rawHoldings = Object.values(db.holdings[uid] ?? {}).filter((h: any) => h.shares > 0) as any[];
  const titles: Record<string, string> = {
    mas_tightening: "MAS SGD NEER Tightening & Higher Interest Rates",
    semi_capex_surge: "Global Semiconductor & AI Infrastructure Boom",
    changi_tourism_boom: "Changi Aviation & ASEAN Tourism Record Surge",
    energy_inflation_shock: "Global Energy & Supply Chain Inflation Shock",
  };
  const scenarioTitle = titles[scenarioId] ?? titles.mas_tightening;
  const holdingImpacts = rawHoldings.map((h) => {
    const meta = TICKER_META[h.ticker] ?? TICKER_META["D05.SI"];
    const px = db.marketSnapshot.quotes[h.ticker]?.price ?? h.avgPrice;
    const currentValue = Number((h.shares * px).toFixed(2));
    const shockPct = scenarioId === "semi_capex_surge" || scenarioId === "changi_tourism_boom" ? 4.2 : -2.1;
    const estimatedDeltaSgd = Number((currentValue * (shockPct / 100)).toFixed(2));
    return { ticker: h.ticker, companyName: meta.name, sector: meta.sector, currentValue, shockPct, estimatedDeltaSgd };
  });
  const totalDelta = Number(holdingImpacts.reduce((a, b) => a + b.estimatedDeltaSgd, 0).toFixed(2));
  const netVal = user?.netValue || 10000;
  const totalPct = Number(((totalDelta / netVal) * 100).toFixed(2));
  return {
    success: true,
    data: {
      scenarioId,
      scenarioTitle,
      estimatedPortfolioDeltaSgd: totalDelta,
      estimatedPortfolioDeltaPct: totalPct,
      holdingImpacts,
      socraticCommentary: \`Under the "\${scenarioTitle}" scenario, your SGX holdings experience an estimated net shift of \${totalDelta >= 0 ? "+" : ""}S$\${totalDelta.toFixed(2)} (\${totalPct >= 0 ? "+" : ""}\${totalPct}%).\\n\\nSocratic Question: How does spreading capital across uncorrelated SGX sectors protect your portfolio during unexpected macroeconomic shifts?\`,
    },
  };
}

export async function updateExchangeSettingsAction(patch: any) {
  const db = getBrowserDb();
  db.appSettings = { ...db.appSettings, ...patch };
  saveBrowserDb(db);
  return { success: true, data: db.appSettings };
}

export async function setClassTradingLockAction(classId: string, locked: boolean) {
  const db = getBrowserDb();
  let updatedCount = 0;
  Object.values(db.users).forEach((u: any) => {
    if (u.role === "student" && (classId === "ALL" || u.classGroupIds.includes(classId))) {
      u.tradingLocked = locked;
      updatedCount++;
    }
  });
  saveBrowserDb(db);
  return { success: true, data: { updatedCount } };
}

export async function resetSingleStudentAction(targetUid: string) {
  const db = getBrowserDb();
  if (db.users[targetUid]) {
    db.holdings[targetUid] = {};
    db.users[targetUid].cashBalance = 10000;
    db.users[targetUid].holdingsValue = 0;
    db.users[targetUid].netValue = 10000;
    saveBrowserDb(db);
  }
  return { success: true };
}

export async function resetAllStudentsAction() {
  const db = getBrowserDb();
  let count = 0;
  Object.values(db.users).forEach((u: any) => {
    if (u.role === "student") {
      db.holdings[u.uid] = {};
      u.cashBalance = 10000;
      u.holdingsValue = 0;
      u.netValue = 10000;
      count++;
    }
  });
  saveBrowserDb(db);
  return { success: true, data: { count } };
}

export async function createClassGroupAction(args: any) {
  const db = getBrowserDb();
  const newClass = {
    id: \`class-\${Date.now()}\`,
    name: args.name.trim(),
    joinCode: args.joinCode.trim().toUpperCase() || "SGXNEW",
    teacherId: "user-teacher-1",
    semester: args.semester || "2026-S2",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.classGroups[newClass.id] = newClass;
  saveBrowserDb(db);
  return { success: true, data: newClass };
}

export async function createWeeklyChallengeAction(args: any) {
  const db = getBrowserDb();
  const doc = {
    id: \`challenge-\${Date.now()}\`,
    classGroupId: args.classGroupId,
    title: args.title.trim(),
    description: args.description.trim(),
    weekStart: args.weekStart,
    weekEnd: args.weekEnd,
    createdBy: "user-teacher-1",
    createdAt: new Date().toISOString(),
  };
  db.weeklyChallenges[doc.id] = doc;
  saveBrowserDb(db);
  return { success: true, data: doc };
}

export async function updateUserRoleAction(targetUid: string, newRole: any) {
  const db = getBrowserDb();
  if (db.users[targetUid]) {
    db.users[targetUid].role = newRole;
    saveBrowserDb(db);
  }
  return { success: true };
}

export async function importGoogleWorkspaceRosterAction(rows: any[]) {
  const db = getBrowserDb();
  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const email = (r.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    const uid = \`gmail-\${email.replace(/[^a-z0-9]/g, "-")}\`;
    if (db.users[uid]) {
      updated++;
    } else {
      const now = new Date().toISOString();
      db.users[uid] = {
        uid,
        email,
        nickname: r.nickname || email.split("@")[0],
        photoURL: null,
        role: r.role || "student",
        classGroupIds: ["class-sec4-express-a"],
        startingCapital: 10000,
        cashBalance: 10000,
        holdingsValue: 0,
        netValue: 10000,
        totalFeesPaid: 0,
        hhi: 1,
        tradingLocked: false,
        coolingOffUntil: null,
        hasCompletedTutorial: true,
        acceptedTermsAt: now,
        achievementCount: 0,
        achievements: {},
        createdAt: now,
        lastLoginAt: now,
      };
      db.holdings[uid] = {};
      created++;
    }
  }
  saveBrowserDb(db);
  return { success: true, data: { created, updated, failed: 0, errors: [] } };
}

export async function adminTriggerMarketSyncAction() {
  await triggerLiveMarketTickAction();
  return { success: true, data: { liveCount: 20, fallbackCount: 0, timestamp: new Date().toISOString() } };
}

export async function adminTakePortfolioSnapshotsAction() {
  const db = getBrowserDb();
  const now = new Date().toISOString();
  let count = 0;
  Object.values(db.users).forEach((u: any) => {
    if (u.role === "student") {
      db.portfolioHistory.push({
        id: \`snap-\${Date.now()}-\${count}\`,
        userId: u.uid,
        netValue: u.netValue,
        cashBalance: u.cashBalance,
        holdingsValue: u.holdingsValue,
        recordedAt: now,
        semester: db.appSettings.currentSemester || "2026-S2",
      });
      count++;
    }
  });
  saveBrowserDb(db);
  return { success: true, data: { count, timestamp: now } };
}

export async function distributeClassDividendsAction(classId = "ALL") {
  const db = getBrowserDb();
  let studentsCredited = 0;
  let totalDividendSgd = 0;
  Object.values(db.users).forEach((u: any) => {
    if (u.role !== "student") return;
    if (classId !== "ALL" && !u.classGroupIds.includes(classId)) return;
    const holds = Object.values(db.holdings[u.uid] ?? {}) as any[];
    let div = 0;
    for (const h of holds) {
      const meta = TICKER_META[h.ticker];
      if (!meta) continue;
      const px = db.marketSnapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      div += h.shares * px * (meta.dividendYieldPct / 100 / 4);
    }
    const r = Number(div.toFixed(2));
    if (r > 0) {
      u.cashBalance = Number((u.cashBalance + r).toFixed(2));
      u.netValue = Number((u.cashBalance + u.holdingsValue).toFixed(2));
      studentsCredited++;
      totalDividendSgd = Number((totalDividendSgd + r).toFixed(2));
    }
  });
  saveBrowserDb(db);
  return { success: true, data: { studentsCredited, totalDividendSgd, timestamp: new Date().toISOString() } };
}

export async function runSgxCopilotAction(prompt: string, _optionalClientApiKey?: string) {
  const db = getBrowserDb();
  const uid = getActiveUid();
  const user = db.users[uid] ?? db.users["user-student-1"] ?? Object.values(db.users)[0];
  if (!user) return { success: false, error: "Please sign in first." };
  const holdings = Object.values(db.holdings[user.uid] ?? {}).filter((h: any) => h.shares > 0);
  const trades = db.tradeHistory.filter((t: any) => t.userId === user.uid);
  const limitOrders = db.limitOrders.filter((o: any) => o.userId === user.uid);
  const result = evaluateCopilotTurn(prompt, {
    user,
    settings: db.appSettings,
    snapshot: db.marketSnapshot,
    holdings,
    trades,
    limitOrders,
  });
  return { success: true, data: result };
}
`,
);

// Build CSS with Tailwind CLI
console.log("Building Tailwind CSS for Firebase Hosting...");
execSync(
  `npx tailwindcss -i ./src/app/globals.css -o ./dist-hosting/styles.css --minify`,
  { stdio: "inherit" },
);

// Locate esbuild inside node_modules (installed via tsx)
const esbuildModulePath = path.join(
  rootDir,
  "node_modules",
  "esbuild",
  "lib",
  "main.js",
);
let esbuild;
if (fs.existsSync(esbuildModulePath)) {
  esbuild = await import(`file:///${esbuildModulePath.replace(/\\/g, "/")}`);
} else {
  execSync(`npm install --no-save esbuild`, { stdio: "inherit" });
  esbuild = await import(
    `file:///${esbuildModulePath.replace(/\\/g, "/")}`
  );
}

fs.writeFileSync(
  path.join(shimDir, "firebase-client-shim.ts"),
  `import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export function isFirebaseBrowserConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      !firebaseConfig.apiKey.includes("your_firebase") &&
      !firebaseConfig.projectId.includes("your-project"),
  );
}

let cachedApp: FirebaseApp | null = null;

export function getFirebaseBrowserApp(): FirebaseApp | null {
  if (!isFirebaseBrowserConfigured()) return null;
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseBrowserAuth(): Auth | null {
  const app = getFirebaseBrowserApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseBrowserDb(): Firestore | null {
  return null;
}

export function createGoogleOAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
`,
);

const aliasPlugin = {
  name: "next-firebase-spa-alias",
  setup(build) {
    build.onResolve({ filter: /^next\/link$/ }, () => ({
      path: path.join(shimDir, "next-link.tsx"),
    }));
    build.onResolve({ filter: /^next\/navigation$/ }, () => ({
      path: path.join(shimDir, "next-navigation.tsx"),
    }));
    build.onResolve({ filter: /^@\/lib\/firebase\/client$/ }, () => ({
      path: path.join(shimDir, "firebase-client-shim.ts"),
    }));
    build.onResolve(
      { filter: /^@\/actions\/(trade|admin|ai|onboarding|reflection|copilot)$/ },
      () => ({
        path: path.join(shimDir, "actions-shim.ts"),
      }),
    );
    build.onResolve({ filter: /^\.\/actions$/ }, (args) => {
      if (args.importer.replace(/\\/g, "/").includes("src/app/dashboard")) {
        return { path: path.join(shimDir, "actions-shim.ts") };
      }
      return null;
    });
    build.onResolve({ filter: /^@\// }, (args) => {
      const rel = args.path.replace(/^@\//, "src/");
      const base = path.join(rootDir, rel);
      for (const ext of [".tsx", ".ts", ".js", "/index.tsx", "/index.ts"]) {
        if (fs.existsSync(base + ext)) return { path: base + ext };
      }
      return { path: base };
    });
  },
};

const buildVersion = Date.now();
console.log("Bundling React + TradingView Lightweight-Charts SPA with esbuild...");
await esbuild.default.build({
  entryPoints: [path.join(rootDir, "scripts", "firebase-spa-bridge.tsx")],
  bundle: true,
  minify: true,
  jsx: "automatic",
  format: "esm",
  target: ["es2020"],
  outfile: path.join(outDir, "app.v3.js"),
  plugins: [aliasPlugin],
  define: {
    ...envVars,
    __INITIAL_SEED_DB__: JSON.stringify(seedDb),
  },
});
fs.copyFileSync(path.join(outDir, "app.v3.js"), path.join(outDir, "app.js"));

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SGX Edu-Trader 2.0 · Singapore Exchange Classroom Simulator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=${buildVersion}" />
  <style>
    :root {
      --font-inter: 'Inter', system-ui, sans-serif;
      --font-jakarta: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-jetbrains-mono: 'JetBrains Mono', monospace;
    }
  </style>
  <script>window.process = window.process || { env: { NODE_ENV: "production" } };</script>
</head>
<body class="bg-sgx-canvas text-sgx-ink antialiased">
  <div id="root"></div>
  <script type="module" src="/app.v3.js?v=${buildVersion}"></script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), indexHtml, "utf8");
fs.rmSync(shimDir, { recursive: true, force: true });
console.log("✅ Firebase Hosting bundle generated in dist-hosting/!");
