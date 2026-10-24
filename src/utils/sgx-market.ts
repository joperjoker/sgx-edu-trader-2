import type { FeeMode } from "@/types/firestore";

export type SgxMarketPhase =
  | "PRE_OPEN"
  | "MORNING_OPEN"
  | "MIDDAY_BREAK"
  | "AFTERNOON_OPEN"
  | "PRE_CLOSE"
  | "CLOSED";

export interface SgxSessionStatus {
  phase: SgxMarketPhase;
  isOpen: boolean;
  label: string;
  shortBadge: string;
  detail: string;
  sgtTimeFormatted: string;
  sgtDateFormatted: string;
  holidayName: string | null;
}

// Official Singapore Public Holidays (SGX Securities Market Closed)
export const SGX_PUBLIC_HOLIDAYS: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-02-17": "Chinese New Year",
  "2026-02-18": "Chinese New Year (Day 2)",
  "2026-03-20": "Hari Raya Puasa",
  "2026-04-03": "Good Friday",
  "2026-05-01": "Labour Day",
  "2026-05-27": "Hari Raya Haji",
  "2026-05-31": "Vesak Day",
  "2026-06-01": "Vesak Day (Observed)",
  "2026-08-09": "National Day",
  "2026-08-10": "National Day (Observed)",
  "2026-11-08": "Deepavali",
  "2026-11-09": "Deepavali (Observed)",
  "2026-12-25": "Christmas Day",
  "2027-01-01": "New Year's Day",
  "2027-02-06": "Chinese New Year",
  "2027-02-08": "Chinese New Year (Observed)",
  "2027-03-10": "Hari Raya Puasa",
  "2027-03-26": "Good Friday",
  "2027-05-01": "Labour Day",
  "2027-05-17": "Hari Raya Haji",
  "2027-05-20": "Vesak Day",
  "2027-08-09": "National Day",
  "2027-10-28": "Deepavali",
  "2027-12-25": "Christmas Day",
};

/**
 * Official SGX Securities Minimum Bid/Tick Size Table (Mainboard & Catalist SGD Stocks)
 * - Below S$0.20: S$0.001
 * - S$0.20 to S$0.995: S$0.005
 * - S$1.00 and above: S$0.01
 */
export function getSgxTickSize(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0.01;
  if (price < 0.2) return 0.001;
  if (price < 1.0) return 0.005;
  return 0.01;
}

export function roundToSgxTick(price: number): number {
  const tick = getSgxTickSize(price);
  const factor = Math.round(price / tick);
  const decimals = tick === 0.001 ? 3 : tick === 0.005 ? 3 : 2;
  return Number((factor * tick).toFixed(decimals));
}

export function formatSgxPrice(price: number): string {
  if (!Number.isFinite(price)) return "0.00";
  const tick = getSgxTickSize(price);
  if (tick < 0.01) {
    return price.toLocaleString("en-SG", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }
  return price.toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSgd(amount: number): string {
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calculateAdminBidAsk(
  lastPrice: number,
  tickSize?: number,
): { bid: number; ask: number; spread: number } {
  const tick = tickSize ?? getSgxTickSize(lastPrice);
  const decimals = tick < 0.01 ? 3 : 2;
  const bid = Number(Math.max(tick, lastPrice - tick).toFixed(decimals));
  const ask = Number((lastPrice + tick).toFixed(decimals));
  const spread = Number((ask - bid).toFixed(decimals));
  return { bid, ask, spread };
}

export interface OrderBookLevel {
  price: number;
  shares: number;
  ordersCount: number;
  depthPercent: number;
}

export function generateSgxOrderBook(
  ticker: string,
  lastPrice: number,
  dailyVolume: number,
): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const tick = getSgxTickSize(lastPrice);
  const decimals = tick < 0.01 ? 3 : 2;
  const { bid: topBid, ask: topAsk } = calculateAdminBidAsk(lastPrice, tick);

  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash * 31 + ticker.charCodeAt(i)) % 10000;
  }

  const baseLotPool = Math.max(15, Math.min(400, Math.round(dailyVolume / 25000)));
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  let maxShares = 100;

  for (let i = 0; i < 5; i++) {
    const bidPrice = Number(Math.max(tick, topBid - i * tick).toFixed(decimals));
    const askPrice = Number((topAsk + i * tick).toFixed(decimals));

    const bidLots = Math.max(
      2,
      Math.round(baseLotPool * (0.65 + ((hash + i * 17) % 90) / 100)),
    );
    const askLots = Math.max(
      2,
      Math.round(baseLotPool * (0.65 + ((hash + i * 29) % 90) / 100)),
    );

    const bidShares = bidLots * 100;
    const askShares = askLots * 100;
    if (bidShares > maxShares) maxShares = bidShares;
    if (askShares > maxShares) maxShares = askShares;

    bids.push({
      price: bidPrice,
      shares: bidShares,
      ordersCount: Math.max(2, Math.round(bidLots / 8)),
      depthPercent: 0,
    });
    asks.push({
      price: askPrice,
      shares: askShares,
      ordersCount: Math.max(2, Math.round(askLots / 8)),
      depthPercent: 0,
    });
  }

  for (const b of bids) {
    b.depthPercent = Math.min(100, Math.round((b.shares / maxShares) * 100));
  }
  for (const a of asks) {
    a.depthPercent = Math.min(100, Math.round((a.shares / maxShares) * 100));
  }

  return { bids, asks };
}

export interface SgxFeeBreakdown {
  grossAmount: number;
  brokerageFee: number;
  clearingFee: number;
  sgxTradingFee: number;
  gstAmount: number;
  totalFee: number;
  netTotal: number;
}

/**
 * Calculates SGX Trade Fees:
 * 1) `sgx_realistic`:
 *    - Brokerage Commission: 0.08% of contract value (Minimum S$10.00)
 *    - CDP Clearing Fee: 0.0325% of contract value
 *    - SGX Trading Fee: 0.0075% of contract value
 *    - Singapore GST: 9% on (Brokerage + CDP Clearing + SGX Trading Fee)
 * 2) `flat_10`:
 *    - Classroom simplified flat S$10.00 fee
 */
export function calculateSgxTradeFees(
  shares: number,
  executionPrice: number,
  isBuy: boolean,
  feeMode: FeeMode = "sgx_realistic",
): SgxFeeBreakdown {
  const cleanShares = Math.max(0, Math.floor(shares));
  const grossAmount = Number((cleanShares * executionPrice).toFixed(2));
  if (cleanShares === 0 || grossAmount <= 0) {
    return {
      grossAmount: 0,
      brokerageFee: 0,
      clearingFee: 0,
      sgxTradingFee: 0,
      gstAmount: 0,
      totalFee: 0,
      netTotal: 0,
    };
  }

  if (feeMode === "flat_10") {
    const totalFee = 10.0;
    const netTotal = isBuy
      ? Number((grossAmount + totalFee).toFixed(2))
      : Number(Math.max(0, grossAmount - totalFee).toFixed(2));
    return {
      grossAmount,
      brokerageFee: 10.0,
      clearingFee: 0,
      sgxTradingFee: 0,
      gstAmount: 0,
      totalFee,
      netTotal,
    };
  }

  const brokerageFee = Number(Math.max(10.0, grossAmount * 0.0008).toFixed(2));
  const clearingFee = Number((grossAmount * 0.000325).toFixed(2));
  const sgxTradingFee = Number((grossAmount * 0.000075).toFixed(2));
  const preGstFees = brokerageFee + clearingFee + sgxTradingFee;
  const gstAmount = Number((preGstFees * 0.09).toFixed(2));
  const totalFee = Number((preGstFees + gstAmount).toFixed(2));
  const netTotal = isBuy
    ? Number((grossAmount + totalFee).toFixed(2))
    : Number(Math.max(0, grossAmount - totalFee).toFixed(2));

  return {
    grossAmount,
    brokerageFee,
    clearingFee,
    sgxTradingFee,
    gstAmount,
    totalFee,
    netTotal,
  };
}

export function getSgxSessionStatus(now: Date = new Date()): SgxSessionStatus {
  const sgtFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = sgtFormatter.formatToParts(now);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const weekday = getPart("weekday");
  const hour = Number(getPart("hour") || "0");
  const minute = Number(getPart("minute") || "0");
  const second = getPart("second") || "00";

  const isoDate = `${year}-${month}-${day}`;
  const sgtTimeFormatted = `${String(hour).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}:${second} SGT`;

  const sgtDateFormatted = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  const holidayName = SGX_PUBLIC_HOLIDAYS[isoDate] ?? null;
  if (holidayName) {
    return {
      phase: "CLOSED",
      isOpen: false,
      label: `SGX CLOSED · Public Holiday (${holidayName})`,
      shortBadge: "HOLIDAY CLOSED",
      detail: `Singapore Exchange is closed today for ${holidayName}. Paper trades execute at Indicative Last Close / Queued mode.`,
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName,
    };
  }

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (isWeekend) {
    return {
      phase: "CLOSED",
      isOpen: false,
      label: "SGX CLOSED · Weekend Session",
      shortBadge: "WEEKEND CLOSED",
      detail:
        "SGX continuous trading operates Monday–Friday (09:00–12:00 & 13:00–17:00 SGT). Classroom practice trades execute at reference closing bid/ask.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  const totalMinutes = hour * 60 + minute;

  // 08:30 - 08:59 SGT: Pre-Open Routine
  if (totalMinutes >= 8 * 60 + 30 && totalMinutes < 9 * 60) {
    return {
      phase: "PRE_OPEN",
      isOpen: false,
      label: "SGX PRE-OPEN ROUTINE (08:30–09:00 SGT)",
      shortBadge: "PRE-OPEN",
      detail:
        "Orders are queuing in the SGX Opening Auction book. Continuous trading starts at 09:00 SGT.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  // 09:00 - 11:59 SGT: Morning Continuous Trading
  if (totalMinutes >= 9 * 60 && totalMinutes < 12 * 60) {
    return {
      phase: "MORNING_OPEN",
      isOpen: true,
      label: "SGX MARKET OPEN · Morning Continuous Session",
      shortBadge: "MARKET OPEN",
      detail:
        "Live SGX Morning Continuous Trading (09:00–12:00 SGT). Midday intermission begins at 12:00 SGT.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  // 12:00 - 12:59 SGT: Midday Break
  if (totalMinutes >= 12 * 60 && totalMinutes < 13 * 60) {
    return {
      phase: "MIDDAY_BREAK",
      isOpen: false,
      label: "SGX MIDDAY INTERMISSION (12:00–13:00 SGT)",
      shortBadge: "MIDDAY BREAK",
      detail:
        "SGX is in its scheduled midday lunch intermission. Afternoon continuous trading resumes at 13:00 SGT.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  // 13:00 - 16:59 SGT: Afternoon Continuous Trading
  if (totalMinutes >= 13 * 60 && totalMinutes < 17 * 60) {
    return {
      phase: "AFTERNOON_OPEN",
      isOpen: true,
      label: "SGX MARKET OPEN · Afternoon Continuous Session",
      shortBadge: "MARKET OPEN",
      detail:
        "Live SGX Afternoon Continuous Trading (13:00–17:00 SGT). Closing auction routine starts at 17:00 SGT.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  // 17:00 - 17:06 SGT: Pre-Close Routine
  if (totalMinutes >= 17 * 60 && totalMinutes <= 17 * 60 + 6) {
    return {
      phase: "PRE_CLOSE",
      isOpen: false,
      label: "SGX CLOSING AUCTION ROUTINE (17:00–17:06 SGT)",
      shortBadge: "PRE-CLOSE",
      detail:
        "SGX Closing Routine in progress. Final settlement prices match at 17:06 SGT.",
      sgtTimeFormatted,
      sgtDateFormatted,
      holidayName: null,
    };
  }

  return {
    phase: "CLOSED",
    isOpen: false,
    label: "SGX MARKET CLOSED · After-Hours Practice",
    shortBadge: "MARKET CLOSED",
    detail:
      "SGX trading hours are 09:00–12:00 and 13:00–17:00 SGT. Classroom simulation executes at last closing Bid/Ask.",
    sgtTimeFormatted,
    sgtDateFormatted,
    holidayName: null,
  };
}

export function generateDeterministicSparkline(
  ticker: string,
  currentPrice: number,
  changePct: number,
  pointsCount = 24,
): number[] {
  const tick = getSgxTickSize(currentPrice);
  const decimals = tick < 0.01 ? 3 : 2;
  const startPrice = currentPrice / (1 + changePct / 100);
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 37 + ticker.charCodeAt(i)) % 9973;
  }

  const points: number[] = [];
  for (let i = 0; i < pointsCount; i++) {
    if (i === pointsCount - 1) {
      points.push(Number(currentPrice.toFixed(decimals)));
      continue;
    }
    const progress = i / (pointsCount - 1);
    const wave =
      Math.sin((i + (seed % 7)) * 0.65) * 0.006 +
      Math.cos((i + (seed % 11)) * 0.35) * 0.004;
    const interpolated =
      startPrice + (currentPrice - startPrice) * progress + startPrice * wave;
    points.push(Number(Math.max(tick, interpolated).toFixed(decimals)));
  }
  return points;
}

/**
 * Calculates Herfindahl-Hirschman Index (HHI) across a student's stock holdings.
 * - Range: 1/N (well diversified) to 1.0 (concentrated in 1 stock or 0 holdings).
 */
export function calculatePortfolioHhi(
  holdingsValues: number[],
): number {
  const positive = holdingsValues.filter((v) => Number.isFinite(v) && v > 0);
  const total = positive.reduce((acc, v) => acc + v, 0);
  if (total <= 0 || positive.length === 0) return 1;
  const sumSquares = positive.reduce((acc, v) => {
    const share = v / total;
    return acc + share * share;
  }, 0);
  return Number(Math.min(1, Math.max(0, sumSquares)).toFixed(4));
}

export function calculateSmartInvestorScore(
  netValue: number,
  startingCapital: number,
  hhi: number,
): number {
  const base = startingCapital > 0 ? startingCapital : 10000;
  const rawReturnPct = ((netValue - base) / base) * 100;
  const diversificationMultiplier = 1 + (1 - Math.min(1, Math.max(0, hhi)));
  // Reward positive returns enhanced by diversification; penalize losses less if diversified
  const score =
    rawReturnPct >= 0
      ? rawReturnPct * diversificationMultiplier
      : rawReturnPct / diversificationMultiplier;
  return Number(score.toFixed(2));
}
