import type {
  AppSettingsDoc,
  FeeMode,
  HoldingDoc,
  LimitOrderDoc,
  MarketLiveSnapshotDoc,
  OrderType,
  TradeAction,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  calculateSmartInvestorScore,
  formatSgd,
  formatSgxPrice,
  getSgxTickSize,
  roundToSgxTick,
  type SgxFeeBreakdown,
} from "@/utils/sgx-market";
import {
  TICKER_META,
  TIER_CONFIG,
  VALID_TICKERS,
  type RiskTier,
} from "@/utils/tickers";

export type CopilotCardType =
  | "guardrail_refusal"
  | "order_preview"
  | "what_if"
  | "comparison"
  | "screener"
  | "portfolio_audit"
  | "dividend_projection"
  | "stress_test"
  | "limit_orders"
  | "glossary"
  | "reflection_helper"
  | "teacher_action";

export interface CopilotOrderPreviewCard {
  type: "order_preview";
  ticker: string;
  companyName: string;
  sector: string;
  tier: RiskTier;
  action: TradeAction;
  orderType: OrderType;
  shares: number;
  boardLots: number;
  livePrice: number;
  bid: number;
  ask: number;
  effectivePrice: number;
  limitPrice: number | null;
  fees: SgxFeeBreakdown;
  feeDragPct: number;
  highFeeDragWarning: string | null;
  cashBefore: number;
  cashAfter: number;
  holdingSharesBefore: number;
  holdingSharesAfter: number;
  hhiBefore: number;
  hhiAfter: number;
  diversificationPctBefore: number;
  diversificationPctAfter: number;
  canExecute: boolean;
  validationError: string | null;
}

export interface CopilotWhatIfCard {
  type: "what_if";
  ticker: string;
  companyName: string;
  action: TradeAction;
  shares: number;
  effectivePrice: number;
  netTotal: number;
  totalFee: number;
  feeDragPct: number;
  cashBefore: number;
  cashAfter: number;
  diversificationPctBefore: number;
  diversificationPctAfter: number;
  smartScoreBefore: number;
  smartScoreAfter: number;
}

export interface CopilotComparisonItem {
  ticker: string;
  name: string;
  shortName: string;
  sector: string;
  tier: RiskTier;
  price: number;
  changePct: number;
  bid: number;
  ask: number;
  lotCostSgd: number;
  marketCapB: string;
  peRatio: number;
  dividendYieldPct: number;
}

export interface CopilotComparisonCard {
  type: "comparison";
  title: string;
  items: CopilotComparisonItem[];
}

export interface CopilotScreenerCard {
  type: "screener";
  criteriaLabel: string;
  items: CopilotComparisonItem[];
}

export interface CopilotPortfolioAuditCard {
  type: "portfolio_audit";
  netValue: number;
  cashBalance: number;
  holdingsValue: number;
  totalReturnPct: number;
  totalFeesPaid: number;
  feeDragOnCapitalPct: number;
  diversificationPct: number;
  smartScore: number;
  holdingsCount: number;
  tiersCovered: RiskTier[];
  missingTiers: RiskTier[];
  topHoldingTicker: string | null;
  topHoldingWeightPct: number;
}

export interface CopilotDividendCard {
  type: "dividend_projection";
  ticker: string;
  companyName: string;
  lots: number;
  shares: number;
  years: number;
  livePrice: number;
  principalSgd: number;
  dividendYieldPct: number;
  annualCashPayout: number;
  totalDividendsWithDrip: number;
  projectedEndValueWithDrip: number;
  totalDividendsNoDrip: number;
}

export interface CopilotStressTestCard {
  type: "stress_test";
  scenarioId:
    | "mas_tightening"
    | "semi_capex_surge"
    | "changi_tourism_boom"
    | "energy_inflation_shock";
  scenarioTitle: string;
  estimatedDeltaSgd: number;
  estimatedDeltaPct: number;
  impacts: Array<{
    ticker: string;
    companyName: string;
    sector: string;
    currentValue: number;
    shockPct: number;
    deltaSgd: number;
  }>;
}

export interface CopilotLimitOrdersCard {
  type: "limit_orders";
  openOrders: LimitOrderDoc[];
}

export interface CopilotGlossaryCard {
  type: "glossary";
  term: string;
  sgxRule: string;
  laymanAnalogy: string;
  exampleMath: string;
}

export interface CopilotReflectionCard {
  type: "reflection_helper";
  weekNumber: number;
  suggestedDraft: string;
  recentTradesSummary: string[];
}

export interface CopilotTeacherActionCard {
  type: "teacher_action";
  actionKey:
    | "toggle_odd_lots"
    | "toggle_fee_mode"
    | "pause_trading"
    | "resume_trading"
    | "distribute_dividends"
    | "export_gradebook";
  title: string;
  summary: string;
  canExecute: boolean;
}

export interface CopilotGuardrailCard {
  type: "guardrail_refusal";
  ruleTriggered: string;
  educationalReason: string;
  suggestedExplorations: string[];
}

export type CopilotCard =
  | CopilotOrderPreviewCard
  | CopilotWhatIfCard
  | CopilotComparisonCard
  | CopilotScreenerCard
  | CopilotPortfolioAuditCard
  | CopilotDividendCard
  | CopilotStressTestCard
  | CopilotLimitOrdersCard
  | CopilotGlossaryCard
  | CopilotReflectionCard
  | CopilotTeacherActionCard
  | CopilotGuardrailCard;

export interface CopilotExecutionContext {
  user: UserProfileDoc;
  settings: AppSettingsDoc;
  snapshot: MarketLiveSnapshotDoc;
  holdings: HoldingDoc[];
  trades: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
}

export interface CopilotTurnOutput {
  toolUsed: string;
  headline: string;
  explanation: string;
  socraticQuestion: string;
  card: CopilotCard | null;
  followUpChips: string[];
}

const TICKER_ALIASES: Array<{ ticker: string; keywords: string[] }> = [
  { ticker: "D05.SI", keywords: ["d05.si", "d05", "dbs", "dbs bank", "dbs group"] },
  { ticker: "O39.SI", keywords: ["o39.si", "o39", "ocbc", "ocbc bank"] },
  { ticker: "U11.SI", keywords: ["u11.si", "u11", "uob", "united overseas bank"] },
  { ticker: "Z74.SI", keywords: ["z74.si", "z74", "singtel", "telecom"] },
  {
    ticker: "C6L.SI",
    keywords: ["c6l.si", "c6l", "sia", "singapore airlines", "airlines"],
  },
  { ticker: "BN4.SI", keywords: ["bn4.si", "bn4", "keppel"] },
  { ticker: "U96.SI", keywords: ["u96.si", "u96", "sembcorp"] },
  {
    ticker: "S68.SI",
    keywords: ["s68.si", "s68", "sgx group", "singapore exchange"],
  },
  { ticker: "S58.SI", keywords: ["s58.si", "s58", "sats"] },
  { ticker: "S63.SI", keywords: ["s63.si", "s63", "st eng", "st engineering"] },
  {
    ticker: "C52.SI",
    keywords: ["c52.si", "c52", "comfortdelgro", "comfort", "cdg", "zig"],
  },
  { ticker: "OV8.SI", keywords: ["ov8.si", "ov8", "sheng siong", "supermarket"] },
  {
    ticker: "BSL.SI",
    keywords: ["bsl.si", "bsl", "raffles medical", "raffles hospital"],
  },
  { ticker: "OYY.SI", keywords: ["oyy.si", "oyy", "propnex"] },
  { ticker: "S59.SI", keywords: ["s59.si", "s59", "sia engineering", "siae"] },
  { ticker: "AIY.SI", keywords: ["aiy.si", "aiy", "ifast"] },
  { ticker: "MZH.SI", keywords: ["mzh.si", "mzh", "nanofilm"] },
  { ticker: "CHZ.SI", keywords: ["chz.si", "chz", "hrnet", "hrnetgroup"] },
  { ticker: "8AZ.SI", keywords: ["8az.si", "8az", "aztech"] },
  { ticker: "ITS.SI", keywords: ["its.si", "its", "isoteam"] },
];

export function extractTickersFromText(input: string): string[] {
  const lower = input.toLowerCase();
  const found: string[] = [];

  if (
    lower.includes("3 banks") ||
    lower.includes("three banks") ||
    lower.includes("singapore banks") ||
    lower.includes("local banks")
  ) {
    found.push("D05.SI", "O39.SI", "U11.SI");
  }

  for (const entry of TICKER_ALIASES) {
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
      if (regex.test(lower)) {
        if (!found.includes(entry.ticker)) {
          found.push(entry.ticker);
        }
        break;
      }
    }
  }

  return found;
}

function parseSharesAndLots(
  input: string,
  allowOddLots: boolean,
): { shares: number; explicit: boolean } {
  const lower = input.toLowerCase();

  // Match "N lot(s)" or "N board lot(s)"
  const lotMatch = lower.match(/(\d+)\s*(?:board\s*)?lots?\b/);
  if (lotMatch) {
    const lots = Math.max(1, parseInt(lotMatch[1], 10));
    return { shares: lots * 100, explicit: true };
  }

  // Match "N share(s)" or "N sh"
  const shareMatch = lower.match(/(\d[\d,]*)\s*(?:shares?|sh)\b/);
  if (shareMatch) {
    const raw = parseInt(shareMatch[1].replace(/,/g, ""), 10);
    if (Number.isFinite(raw) && raw > 0) {
      return { shares: raw, explicit: true };
    }
  }

  // Match "buy 200 dbs" or "sell 300 singtel"
  const verbNumberMatch = lower.match(
    /\b(?:buy|sell|purchase|short|trade|simulate|what\s+if\s+i\s+buy)\s+(\d[\d,]*)\b/,
  );
  if (verbNumberMatch) {
    const num = parseInt(verbNumberMatch[1].replace(/,/g, ""), 10);
    if (Number.isFinite(num) && num > 0) {
      // If user said "buy 2 DBS" and odd lots are disabled, treat <= 20 as board lots if they meant lots, or keep exact so board lot rule explains it
      return { shares: num, explicit: true };
    }
  }

  return { shares: allowOddLots ? 100 : 100, explicit: false };
}

function parseLimitPrice(input: string): number | null {
  const lower = input.toLowerCase();
  if (!lower.includes("limit") && !lower.includes("at s$") && !lower.includes("@")) {
    return null;
  }
  const match = lower.match(/(?:at|@|limit(?:\s+price)?(?:\s+of)?)\s*s?\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) && val > 0 ? roundToSgxTick(val) : null;
}

function buildComparisonItem(
  ticker: string,
  snapshot: MarketLiveSnapshotDoc,
): CopilotComparisonItem {
  const meta = TICKER_META[ticker] ?? TICKER_META["D05.SI"];
  const q = snapshot.quotes[ticker];
  const price = q?.price ?? meta.refPrice;
  const changePct = q?.changePct ?? meta.refChangePct;
  const tick = getSgxTickSize(price);
  const spread = calculateAdminBidAsk(price, tick);
  const bid = q?.bid ?? spread.bid;
  const ask = q?.ask ?? spread.ask;
  return {
    ticker,
    name: meta.name,
    shortName: meta.shortName,
    sector: meta.sector,
    tier: meta.tier,
    price,
    changePct,
    bid,
    ask,
    lotCostSgd: Number((ask * 100).toFixed(2)),
    marketCapB: meta.marketCapB,
    peRatio: meta.peRatio,
    dividendYieldPct: meta.dividendYieldPct,
  };
}

function buildOrderPreviewCard(
  ticker: string,
  action: TradeAction,
  orderType: OrderType,
  shares: number,
  limitPrice: number | null,
  ctx: CopilotExecutionContext,
): CopilotOrderPreviewCard {
  const meta = TICKER_META[ticker] ?? TICKER_META["D05.SI"];
  const q = ctx.snapshot.quotes[ticker];
  const livePrice = q?.price ?? meta.refPrice;
  const tickSize = getSgxTickSize(livePrice);
  const spread = calculateAdminBidAsk(livePrice, tickSize);
  const bid = q?.bid ?? spread.bid;
  const ask = q?.ask ?? spread.ask;
  const isBuy = action === "buy";

  const effectivePrice =
    orderType === "limit" && limitPrice
      ? limitPrice
      : isBuy
        ? ask
        : bid;

  const fees = calculateSgxTradeFees(
    shares,
    effectivePrice,
    isBuy,
    ctx.settings.feeMode as FeeMode,
  );

  const feeDragPct =
    fees.grossAmount > 0
      ? Number(((fees.totalFee / fees.grossAmount) * 100).toFixed(2))
      : 0;

  const highFeeDragWarning =
    feeDragPct > 1.5
      ? `Fee Alert: Transaction fees (${feeDragPct.toFixed(2)}% of trade value) exceed 1.5% because Singapore brokers charge a S$10.00 minimum fee. Consider whether a full 100-share Board Lot or higher-value order reduces your fee drag.`
      : null;

  const existingHold = ctx.holdings.find((h) => h.ticker === ticker);
  const holdingSharesBefore = existingHold?.shares ?? 0;
  const holdingSharesAfter = isBuy
    ? holdingSharesBefore + shares
    : Math.max(0, holdingSharesBefore - shares);

  const cashBefore = ctx.user.cashBalance;
  const cashAfter = isBuy
    ? Number((cashBefore - fees.netTotal).toFixed(2))
    : Number((cashBefore + fees.netTotal).toFixed(2));

  // Compute HHI before and after
  const currentValues = ctx.holdings
    .filter((h) => h.shares > 0)
    .map((h) => {
      const px = ctx.snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      return Number((h.shares * px).toFixed(2));
    });
  const hhiBefore = calculatePortfolioHhi(currentValues);

  const nextHoldingsMap = new Map<string, number>();
  ctx.holdings.forEach((h) => {
    if (h.shares > 0) {
      const px = ctx.snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      nextHoldingsMap.set(h.ticker, h.shares * px);
    }
  });
  if (holdingSharesAfter > 0) {
    nextHoldingsMap.set(ticker, holdingSharesAfter * effectivePrice);
  } else {
    nextHoldingsMap.delete(ticker);
  }
  const hhiAfter = calculatePortfolioHhi(Array.from(nextHoldingsMap.values()));

  let validationError: string | null = null;
  if (ctx.user.tradingLocked) {
    validationError =
      "Classroom trading is currently paused by your teacher.";
  } else if (!ctx.settings.allowOddLots && shares % 100 !== 0) {
    validationError =
      "SGX Board Lot Rule: Orders must be placed in multiples of 100 shares (1 Board Lot = 100 shares).";
  } else if (isBuy && fees.netTotal > cashBefore) {
    validationError = `Insufficient cash: Order requires S$${formatSgd(fees.netTotal)} (including fees), but you have S$${formatSgd(cashBefore)}.`;
  } else if (!isBuy && shares > holdingSharesBefore) {
    validationError = `You currently own ${holdingSharesBefore.toLocaleString()} shares of ${ticker}, so you cannot sell ${shares.toLocaleString()} shares.`;
  }

  return {
    type: "order_preview",
    ticker,
    companyName: meta.name,
    sector: meta.sector,
    tier: meta.tier,
    action,
    orderType,
    shares,
    boardLots: Number((shares / 100).toFixed(2)),
    livePrice,
    bid,
    ask,
    effectivePrice,
    limitPrice,
    fees,
    feeDragPct,
    highFeeDragWarning,
    cashBefore,
    cashAfter,
    holdingSharesBefore,
    holdingSharesAfter,
    hhiBefore,
    hhiAfter,
    diversificationPctBefore: Math.round((1 - hhiBefore) * 100),
    diversificationPctAfter: Math.round((1 - hhiAfter) * 100),
    canExecute: validationError === null,
    validationError,
  };
}

export function evaluateCopilotTurn(
  rawPrompt: string,
  ctx: CopilotExecutionContext,
): CopilotTurnOutput {
  const prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();
  const tickers = extractTickersFromText(prompt);

  // =========================================================================
  // 1. GUARDRAIL 1: ANTI-SPECULATION / REFUSAL TO PICK WINNING STOCKS
  // =========================================================================
  const isAskingForFinancialAdvice =
    (lower.includes("which stock") ||
      lower.includes("what stock") ||
      lower.includes("best stock") ||
      lower.includes("recommend") ||
      lower.includes("should i buy") ||
      lower.includes("will go up") ||
      lower.includes("make the most money") ||
      lower.includes("guaranteed profit") ||
      lower.includes("pick a stock for me")) &&
    tickers.length === 0;

  if (isAskingForFinancialAdvice) {
    return {
      toolUsed: "guardrail_anti_speculation",
      headline: "Educational Guardrail: Socratic Coach Does Not Pick Stocks",
      explanation:
        "Under Monetary Authority of Singapore (MAS) educational guidelines and EduFinLit's Socratic learning rules, I never tell you which stock to buy or predict future prices. Instead, I can help you compare companies across our 4 SGX Market Risk Tiers so YOU make the investment decision!",
      socraticQuestion:
        "Would you rather start with a steady dividend-paying company in 'Safe Bets' (like DBS, OCBC, or Singtel) or compare everyday consumer brands like Sheng Siong and ComfortDelGro?",
      card: {
        type: "guardrail_refusal",
        ruleTriggered: "Zero Financial Advice & Anti-Speculation Guardrail",
        educationalReason:
          "Real investing requires building your own thesis around how a company earns revenue, its valuation (P/E Ratio), and how it fits your portfolio diversification (1 − HHI).",
        suggestedExplorations: [
          "Screen SGX Safe Bets with highest dividend yields",
          "Compare the 3 Singapore banks (DBS, OCBC, UOB)",
          "Analyse my current portfolio diversification & Smart Score",
        ],
      },
      followUpChips: [
        "Show me Safe Bets on SGX",
        "Compare DBS, OCBC, and UOB",
        "Analyse my portfolio health",
      ],
    };
  }

  // =========================================================================
  // 2. TEACHER / ADMIN CLASSROOM COMMANDS (WITH RBAC GUARDRAIL)
  // =========================================================================
  const isTeacherIntent =
    lower.includes("odd lot") ||
    lower.includes("flat fee") ||
    lower.includes("pause trading") ||
    lower.includes("lock trading") ||
    lower.includes("resume trading") ||
    lower.includes("unlock trading") ||
    lower.includes("distribute dividend") ||
    lower.includes("export gradebook") ||
    lower.includes("google sheets csv");

  if (isTeacherIntent) {
    const isTeacherOrAdmin =
      ctx.user.role === "teacher" || ctx.user.role === "superadmin";

    let actionKey: CopilotTeacherActionCard["actionKey"] = "toggle_odd_lots";
    let title = "Toggle SGX Board Lot / Odd Lot Rule";
    let summary = `Currently set to: ${ctx.settings.allowOddLots ? "Odd Lots Enabled (1 share min)" : "Strict 100-Share SGX Board Lots"}. Click below to toggle this classroom setting.`;

    if (lower.includes("flat fee") || lower.includes("fee mode")) {
      actionKey = "toggle_fee_mode";
      title = "Toggle SGX Fee Structure Mode";
      summary = `Currently set to: ${ctx.settings.feeMode === "sgx_realistic" ? "Authentic SGX + CDP + 9% GST" : "Simplified S$10.00 Flat Fee"}.`;
    } else if (lower.includes("pause") || lower.includes("lock")) {
      actionKey = "pause_trading";
      title = "Pause Classroom Order Submission";
      summary =
        "Temporarily locks student buy/sell order execution during your classroom debrief.";
    } else if (lower.includes("resume") || lower.includes("unlock")) {
      actionKey = "resume_trading";
      title = "Resume Classroom Order Submission";
      summary = "Unlocks order submission for all students in your class.";
    } else if (lower.includes("distribute") && lower.includes("dividend")) {
      actionKey = "distribute_dividends";
      title = "Distribute Quarterly SGX Cash Dividends";
      summary =
        "Credits tax-exempt Tier-1 SGX quarterly dividends to all student accounts holding dividend-paying shares.";
    } else if (lower.includes("export") || lower.includes("gradebook") || lower.includes("sheets")) {
      actionKey = "export_gradebook";
      title = "Export Classroom Gradebook for Google Sheets";
      summary =
        "Downloads a Google Sheets-ready CSV with every student's Net Value, Return %, Diversification %, Smart Investor Score, and Reflections.";
    }

    return {
      toolUsed: "teacher_classroom_control",
      headline: isTeacherOrAdmin
        ? `Teacher Command Ready: ${title}`
        : `Teacher Permission Required: ${title}`,
      explanation: isTeacherOrAdmin
        ? `As a ${ctx.user.role.toUpperCase()}, you can execute this classroom administration command with 1 click below.`
        : `Guardrail Notice: Your account role is currently '${ctx.user.role}'. Only Teachers and Superadmins can modify classroom exchange rules or export the class gradebook.`,
      socraticQuestion:
        "How does changing exchange rules (like 100-share Board Lots vs 1-share Odd Lots) affect how students manage their S$10,000.00 starting capital?",
      card: {
        type: "teacher_action",
        actionKey,
        title,
        summary,
        canExecute: isTeacherOrAdmin,
      },
      followUpChips: [
        "Export gradebook to Google Sheets CSV",
        "Toggle 1-share odd lots for beginners",
        "Distribute quarterly dividends",
      ],
    };
  }

  // =========================================================================
  // 3. "WHAT-IF" TRADE & DIVERSIFICATION SIMULATOR
  // =========================================================================
  const isWhatIfIntent =
    (lower.includes("what if") ||
      lower.includes("what happens if") ||
      lower.includes("simulate buying") ||
      lower.includes("simulate selling") ||
      lower.includes("impact on my diversification") ||
      lower.includes("impact on my hhi")) &&
    tickers.length > 0;

  if (isWhatIfIntent) {
    const ticker = tickers[0];
    const action: TradeAction = lower.includes("sell") ? "sell" : "buy";
    const { shares } = parseSharesAndLots(prompt, ctx.settings.allowOddLots);
    const preview = buildOrderPreviewCard(
      ticker,
      action,
      "market",
      shares,
      null,
      ctx,
    );

    const startCap =
      ctx.user.startingCapital > 0 ? ctx.user.startingCapital : 10000;
    const smartBefore = calculateSmartInvestorScore(
      ctx.user.netValue,
      startCap,
      preview.hhiBefore,
    );
    const netAfter = Number(
      (ctx.user.netValue - preview.fees.totalFee).toFixed(2),
    );
    const smartAfter = calculateSmartInvestorScore(
      netAfter,
      startCap,
      preview.hhiAfter,
    );

    return {
      toolUsed: "simulateWhatIfTrade",
      headline: `What-If Simulation: ${action.toUpperCase()} ${shares.toLocaleString()} Shares (${preview.boardLots} Lots) of ${preview.companyName} (${ticker})`,
      explanation: `If you ${action} ${shares.toLocaleString()} shares of ${ticker} at S$${formatSgxPrice(preview.effectivePrice)}, your total SGX + CDP + 9% GST fee is S$${formatSgd(preview.fees.totalFee)} (${preview.feeDragPct}% of trade value), and your Diversification Score (1 − HHI) shifts from ${preview.diversificationPctBefore}% to ${preview.diversificationPctAfter}%.`,
      socraticQuestion:
        preview.diversificationPctAfter >= preview.diversificationPctBefore
          ? `This trade increases your diversification from ${preview.diversificationPctBefore}% to ${preview.diversificationPctAfter}%. Does ${preview.companyName}'s sector (${preview.sector}) balance the other industries in your portfolio?`
          : `Notice that this trade lowers your diversification score from ${preview.diversificationPctBefore}% to ${preview.diversificationPctAfter}% because it concentrates more of your money into ${ticker}. Are you comfortable with that extra concentration risk?`,
      card: {
        type: "what_if",
        ticker,
        companyName: preview.companyName,
        action,
        shares,
        effectivePrice: preview.effectivePrice,
        netTotal: preview.fees.netTotal,
        totalFee: preview.fees.totalFee,
        feeDragPct: preview.feeDragPct,
        cashBefore: preview.cashBefore,
        cashAfter: preview.cashAfter,
        diversificationPctBefore: preview.diversificationPctBefore,
        diversificationPctAfter: preview.diversificationPctAfter,
        smartScoreBefore: smartBefore,
        smartScoreAfter: smartAfter,
      },
      followUpChips: [
        `Buy ${shares} shares of ${ticker}`,
        `Compare ${ticker} with peers`,
        `Check ${ticker} dividend yield`,
      ],
    };
  }

  // =========================================================================
  // 4. BUY / SELL ORDER PREPARATION & INTERACTIVE EXECUTION TICKET
  // =========================================================================
  const isTradeIntent =
    (lower.includes("buy") ||
      lower.includes("sell") ||
      lower.includes("purchase") ||
      lower.includes("order") ||
      lower.includes("trade")) &&
    tickers.length > 0 &&
    !lower.includes("compare") &&
    !lower.includes("dividend");

  if (isTradeIntent) {
    const ticker = tickers[0];
    const action: TradeAction = lower.includes("sell") ? "sell" : "buy";
    const { shares } = parseSharesAndLots(prompt, ctx.settings.allowOddLots);
    const limitPrice = parseLimitPrice(prompt);
    const orderType: OrderType = limitPrice !== null ? "limit" : "market";

    const preview = buildOrderPreviewCard(
      ticker,
      action,
      orderType,
      shares,
      limitPrice,
      ctx,
    );

    return {
      toolUsed: "prepareOrExecuteTrade",
      headline: `SGX Order Ticket Ready: ${action.toUpperCase()} ${shares.toLocaleString()} Shares (${preview.boardLots} Board Lots) of ${preview.companyName} (${ticker})`,
      explanation: preview.canExecute
        ? `I have prepared your ${orderType.toUpperCase()} ${action.toUpperCase()} order for ${shares.toLocaleString()} shares of ${ticker} at S$${formatSgxPrice(preview.effectivePrice)}. Review the itemized SGX + CDP + 9% GST fee breakdown (S$${formatSgd(preview.fees.totalFee)}) and click "Confirm & Execute SGX Order" below to route your trade and receive your T+2 Contract Note!`
        : `Order Pre-Check Alert: ${preview.validationError}`,
      socraticQuestion: `Before clicking Confirm: What is your investment thesis for ${preview.companyName} (${ticker}), and what catalyst or risk would make you exit this position later?`,
      card: preview,
      followUpChips: [
        `What if I buy 200 shares of ${ticker}?`,
        `Compare ${ticker} with other SGX stocks`,
        "Analyse my portfolio diversification",
      ],
    };
  }

  // =========================================================================
  // 5. DIVIDEND & DRIP COMPOUNDING SIMULATOR
  // =========================================================================
  if (
    lower.includes("dividend") ||
    lower.includes("drip") ||
    lower.includes("yield") ||
    lower.includes("payout")
  ) {
    const ticker = tickers[0] ?? "D05.SI";
    const meta = TICKER_META[ticker] ?? TICKER_META["D05.SI"];
    const q = ctx.snapshot.quotes[ticker];
    const livePrice = q?.price ?? meta.refPrice;
    const { shares, explicit } = parseSharesAndLots(prompt, true);
    const lots = explicit ? Math.max(1, Math.round(shares / 100)) : 5;
    const totalShares = lots * 100;

    const yearMatch = lower.match(/(\d+)[\s-]*(?:years?|yrs?)\b/);
    const years = yearMatch
      ? Math.min(30, Math.max(1, parseInt(yearMatch[1], 10)))
      : 5;

    const principalSgd = Number((totalShares * livePrice).toFixed(2));
    const rate = Math.max(0, meta.dividendYieldPct) / 100;
    const annualCashPayout = Number((principalSgd * rate).toFixed(2));
    const projectedEndValueWithDrip = Number(
      (principalSgd * Math.pow(1 + rate, years)).toFixed(2),
    );
    const totalDividendsWithDrip = Number(
      (projectedEndValueWithDrip - principalSgd).toFixed(2),
    );
    const totalDividendsNoDrip = Number((annualCashPayout * years).toFixed(2));

    return {
      toolUsed: "projectDividendCompounding",
      headline: `SGX Tax-Exempt Dividend & DRIP Projection: ${meta.name} (${ticker})`,
      explanation: `In Singapore, Tier-1 corporate dividends are 100% tax-free for retail investors. Holding ${lots} Board Lots (${totalShares.toLocaleString()} shares = S$${formatSgd(principalSgd)}) of ${ticker} at an indicative ${meta.dividendYieldPct.toFixed(2)}% annual yield pays S$${formatSgd(annualCashPayout)}/year. Over ${years} years with DRIP (reinvesting dividends into more shares), you earn S$${formatSgd(totalDividendsWithDrip)} vs S$${formatSgd(totalDividendsNoDrip)} without reinvesting!`,
      socraticQuestion:
        "Why might a fast-growing technology company pay a low dividend yield (reinvesting profits into R&D) while mature banks like DBS, OCBC, and UOB pay higher cash dividend yields?",
      card: {
        type: "dividend_projection",
        ticker,
        companyName: meta.name,
        lots,
        shares: totalShares,
        years,
        livePrice,
        principalSgd,
        dividendYieldPct: meta.dividendYieldPct,
        annualCashPayout,
        totalDividendsWithDrip,
        projectedEndValueWithDrip,
        totalDividendsNoDrip,
      },
      followUpChips: [
        `Buy ${lots} lots of ${ticker}`,
        "Screen SGX stocks with highest dividend yield",
        "Compare DBS, OCBC, and Singtel dividends",
      ],
    };
  }

  // =========================================================================
  // 6. MULTI-STOCK SGX COMPARISON TOOL
  // =========================================================================
  const isComparisonIntent =
    (lower.includes("compare") ||
      (lower.includes(" vs ") && tickers.length >= 2) ||
      (lower.includes(" vs. ") && tickers.length >= 2) ||
      tickers.length >= 2) &&
    !lower.includes("explain") &&
    !lower.includes("what is") &&
    !lower.includes("what are") &&
    !lower.includes("meaning of");

  if (isComparisonIntent) {
    const compareList =
      tickers.length >= 2
        ? tickers.slice(0, 4)
        : tickers.length === 1
          ? [
              tickers[0],
              tickers[0] === "D05.SI" ? "O39.SI" : "D05.SI",
              "Z74.SI",
            ]
          : ["D05.SI", "O39.SI", "U11.SI"];

    const items = compareList.map((t) => buildComparisonItem(t, ctx.snapshot));

    return {
      toolUsed: "compareSgxCounters",
      headline: `SGX Side-by-Side Comparison: ${items.map((i) => `${i.shortName} (${i.ticker})`).join(" vs. ")}`,
      explanation:
        "Compare each company's 100-share Board Lot entry cost, Price-to-Earnings (P/E) Ratio (how much you pay per S$1 of annual profit), and Annual Tax-Free Dividend Yield below. You can click 'Prepare Buy Order' on any row to open an instant order ticket.",
      socraticQuestion:
        "Looking at the P/E Ratio and Dividend Yield columns below, which company offers steady income versus higher growth expectations?",
      card: {
        type: "comparison",
        title: `Fundamental & Valuation Comparison (${items.length} SGX Counters)`,
        items,
      },
      followUpChips: items.map((i) => `Buy 1 lot of ${i.ticker}`),
    };
  }

  // =========================================================================
  // 7. MACROECONOMIC PORTFOLIO STRESS-TESTER
  // =========================================================================
  if (
    lower.includes("stress") ||
    lower.includes("macro") ||
    lower.includes("mas ") ||
    lower.includes("oil shock") ||
    lower.includes("inflation") ||
    lower.includes("changi") ||
    lower.includes("tourism") ||
    lower.includes("semiconductor") ||
    lower.includes("capex")
  ) {
    let scenarioId: CopilotStressTestCard["scenarioId"] = "mas_tightening";
    let scenarioTitle = "MAS SGD NEER Tightening & Higher Interest Rates";
    let shocks: Record<string, number> = {
      "Banking & Financial Services": 3.8,
      "Financial Services": 3.8,
      "Capital Markets & Wealth": 2.1,
      "Real Estate Agency": -4.2,
      "Technology & Manufacturing": -3.1,
    };
    let defaultShock = -1.2;

    if (lower.includes("oil") || lower.includes("energy") || lower.includes("inflation")) {
      scenarioId = "energy_inflation_shock";
      scenarioTitle = "Global Energy & Supply Chain Inflation Shock (+35% Oil)";
      shocks = {
        "Energy & Utilities": 3.5,
        "Aviation & Logistics": -6.4,
        "Consumer Staples": -1.8,
        "Technology & Manufacturing": -4.0,
      };
      defaultShock = -2.2;
    } else if (lower.includes("changi") || lower.includes("tourism") || lower.includes("aviation")) {
      scenarioId = "changi_tourism_boom";
      scenarioTitle = "Changi Aviation & ASEAN Tourism Record Surge";
      shocks = {
        "Aviation & Logistics": 6.8,
        "Public Transport": 4.2,
        "Healthcare Services": 3.1,
        "Consumer Staples": 2.0,
      };
      defaultShock = 0.8;
    } else if (lower.includes("semi") || lower.includes("ai ") || lower.includes("tech") || lower.includes("capex")) {
      scenarioId = "semi_capex_surge";
      scenarioTitle = "Global Semiconductor & AI Infrastructure Boom";
      shocks = {
        "Technology & Manufacturing": 8.5,
        "Capital Markets & Wealth": 5.2,
        "Telecommunications": 3.4,
        "Energy & Utilities": 2.9,
      };
      defaultShock = 1.0;
    }

    const activeHolds = ctx.holdings.filter((h) => h.shares > 0);
    const impacts = activeHolds.map((h) => {
      const meta = TICKER_META[h.ticker] ?? TICKER_META["D05.SI"];
      const px = ctx.snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const currentValue = Number((h.shares * px).toFixed(2));
      const shockPct = shocks[meta.sector] ?? defaultShock;
      const deltaSgd = Number((currentValue * (shockPct / 100)).toFixed(2));
      return {
        ticker: h.ticker,
        companyName: meta.name,
        sector: meta.sector,
        currentValue,
        shockPct,
        deltaSgd,
      };
    });

    const estimatedDeltaSgd = Number(
      impacts.reduce((acc, item) => acc + item.deltaSgd, 0).toFixed(2),
    );
    const baseNet = ctx.user.netValue > 0 ? ctx.user.netValue : 10000;
    const estimatedDeltaPct = Number(
      ((estimatedDeltaSgd / baseNet) * 100).toFixed(2),
    );

    return {
      toolUsed: "runMacroStressTest",
      headline: `Macroeconomic Stress-Test: ${scenarioTitle}`,
      explanation:
        impacts.length > 0
          ? `Across your ${impacts.length} active SGX holdings, this scenario produces an estimated net shift of ${estimatedDeltaSgd >= 0 ? "▲" : "▼"} S$${formatSgd(Math.abs(estimatedDeltaSgd))} ${estimatedDeltaSgd >= 0 ? "profit" : "loss"} (${estimatedDeltaPct >= 0 ? "+" : ""}${estimatedDeltaPct}%).`
          : `You are currently 100% in cash (S$${formatSgd(ctx.user.cashBalance)}), so your holdings experience S$0.00 direct market shock. Buy stocks across different sectors to see counter-by-counter stress impacts!`,
      socraticQuestion:
        "How does holding companies from different SGX sectors (e.g., Banking + Supermarkets + Telecom) prevent a single macroeconomic shock from wiping out your portfolio?",
      card: {
        type: "stress_test",
        scenarioId,
        scenarioTitle,
        estimatedDeltaSgd,
        estimatedDeltaPct,
        impacts,
      },
      followUpChips: [
        "Stress-test against Energy & Oil Shock",
        "Stress-test against Changi Aviation Boom",
        "Stress-test against AI & Tech Capex Boom",
      ],
    };
  }

  // =========================================================================
  // 8. OPEN LIMIT ORDERS QUEUE MANAGER
  // =========================================================================
  if (lower.includes("limit order") || lower.includes("open order") || lower.includes("working order")) {
    const openOrders = ctx.limitOrders.filter((o) => o.status === "open");
    return {
      toolUsed: "manageOpenLimitOrders",
      headline: `SGX Working Limit Orders Queue (${openOrders.length} Active)`,
      explanation:
        openOrders.length > 0
          ? `You currently have ${openOrders.length} open Limit Order(s) waiting in the SGX order book queue. You can cancel any working order with 1 click below.`
          : "You currently have 0 open Limit Orders in the queue. You can place a Limit Order by saying e.g. 'Limit buy 100 shares of Sheng Siong at S$1.60'.",
      socraticQuestion:
        "What is the trade-off between waiting for a better price with a Limit Order versus getting guaranteed instant execution with a Market Order?",
      card: {
        type: "limit_orders",
        openOrders,
      },
      followUpChips: [
        "Limit buy 100 OV8.SI at S$1.60",
        "Analyse my portfolio health",
        "Compare DBS, OCBC, and UOB",
      ],
    };
  }

  // =========================================================================
  // 9. WEEKLY REFLECTION ASSISTANT & SAVER
  // =========================================================================
  if (lower.includes("reflection") || lower.includes("journal")) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), 0, 1));
    const weekNumber = Math.max(
      1,
      Math.ceil(((now.getTime() - start.getTime()) / 86400000 + 1) / 7),
    );
    const recentTradesSummary = ctx.trades.slice(0, 4).map(
      (t) =>
        `${t.action.toUpperCase()} ${t.shares} ${t.ticker} (${t.companyName}) @ S$${formatSgxPrice(t.executionPrice)} · Fee: S$${formatSgd(t.totalFee)}`,
    );
    const divPct = Math.round((1 - (ctx.user.hhi ?? 1)) * 100);
    const suggestedDraft =
      ctx.holdings.length > 0
        ? `This week I allocated my S$10,000 virtual capital across ${ctx.holdings.length} SGX counters (${ctx.holdings.map((h) => h.ticker).join(", ")}), achieving a ${divPct}% Diversification Score (1 − HHI). I monitored my SGX + CDP + 9% GST brokerage fees (total S$${formatSgd(ctx.user.totalFeesPaid)} paid) by trading in standard 100-share Board Lots so the S$10 minimum brokerage fee did not erode my returns.`
        : `This week I researched SGX counters across the 4 Risk Tiers and learned how Bid/Ask spreads, 100-share Board Lots, and the S$10 minimum brokerage fee work before deploying my S$10,000 starting capital.`;

    return {
      toolUsed: "draftAndSaveReflection",
      headline: `Week ${weekNumber} Investment Reflection Assistant`,
      explanation:
        "I have summarised your live SGX portfolio metrics and recent trades into a reflection draft below. You can edit it and click 'Save Reflection to Teacher Console' right inside the card!",
      socraticQuestion:
        "Looking back at your trades this week, which decision was driven by company fundamentals (like P/E Ratio or Dividend Yield) versus short-term price movements?",
      card: {
        type: "reflection_helper",
        weekNumber,
        suggestedDraft,
        recentTradesSummary,
      },
      followUpChips: [
        "Analyse my portfolio diversification",
        "Stress-test my portfolio",
        "Compare my stocks",
      ],
    };
  }

  // =========================================================================
  // 10. PORTFOLIO HEALTH & SMART INVESTOR SCORE DIAGNOSTIC
  // =========================================================================
  if (
    lower.includes("portfolio") ||
    lower.includes("diversif") ||
    lower.includes("hhi") ||
    lower.includes("smart score") ||
    lower.includes("smart investor") ||
    lower.includes("my holdings") ||
    lower.includes("my account")
  ) {
    const startCap =
      ctx.user.startingCapital > 0 ? ctx.user.startingCapital : 10000;
    const totalReturnPct = Number(
      (((ctx.user.netValue - startCap) / startCap) * 100).toFixed(2),
    );
    const hhi = ctx.user.hhi ?? 1;
    const diversificationPct = Math.round((1 - hhi) * 100);
    const smartScore = calculateSmartInvestorScore(
      ctx.user.netValue,
      startCap,
      hhi,
    );
    const feeDragOnCapitalPct = Number(
      ((ctx.user.totalFeesPaid / startCap) * 100).toFixed(2),
    );

    const activeHoldings = ctx.holdings.filter((h) => h.shares > 0);
    const allTiers: RiskTier[] = [
      "Safe Bets",
      "Industry Giants",
      "Everyday Brands",
      "High Risk, High Reward",
    ];
    const coveredSet = new Set<RiskTier>();
    let topHoldingTicker: string | null = null;
    let maxVal = 0;
    let totalHoldVal = 0;

    for (const h of activeHoldings) {
      const meta = TICKER_META[h.ticker];
      if (meta) coveredSet.add(meta.tier);
      const px = ctx.snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const val = h.shares * px;
      totalHoldVal += val;
      if (val > maxVal) {
        maxVal = val;
        topHoldingTicker = h.ticker;
      }
    }

    const tiersCovered = allTiers.filter((t) => coveredSet.has(t));
    const missingTiers = allTiers.filter((t) => !coveredSet.has(t));
    const topHoldingWeightPct =
      totalHoldVal > 0 ? Math.round((maxVal / totalHoldVal) * 100) : 0;

    return {
      toolUsed: "diagnosePortfolioHealth",
      headline: `CDP Portfolio & Smart Investor Score Diagnostic (${ctx.user.nickname})`,
      explanation: `Your Net Portfolio Value is S$${formatSgd(ctx.user.netValue)} (${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct}%), with a Diversification Score (1 − HHI) of ${diversificationPct}% and a Smart Investor Score of ${smartScore >= 0 ? "+" : ""}${smartScore.toFixed(2)}. ${missingTiers.length > 0 ? `You currently have exposure to ${tiersCovered.length}/4 SGX Risk Tiers (missing: ${missingTiers.join(", ")}).` : "You are diversified across all 4 SGX Risk Tiers!"}`,
      socraticQuestion:
        topHoldingWeightPct > 50
          ? `Your largest position (${topHoldingTicker}) makes up ${topHoldingWeightPct}% of your invested stock value. How would adding a stock from ${missingTiers[0] ?? "another sector"} improve your 1 − HHI Diversification Score?`
          : "How are you balancing your cash reserve against your invested SGX holdings to prepare for future market opportunities?",
      card: {
        type: "portfolio_audit",
        netValue: ctx.user.netValue,
        cashBalance: ctx.user.cashBalance,
        holdingsValue: Math.max(
          0,
          Number((ctx.user.netValue - ctx.user.cashBalance).toFixed(2)),
        ),
        totalReturnPct,
        totalFeesPaid: ctx.user.totalFeesPaid,
        feeDragOnCapitalPct,
        diversificationPct,
        smartScore,
        holdingsCount: activeHoldings.length,
        tiersCovered,
        missingTiers,
        topHoldingTicker,
        topHoldingWeightPct,
      },
      followUpChips: [
        missingTiers[0]
          ? `Show me ${missingTiers[0]} stocks`
          : "Screen high dividend SGX stocks",
        "Stress-test my portfolio",
        "Help me draft my weekly reflection",
      ],
    };
  }

  // =========================================================================
  // 11. FINANCIAL LITERACY GLOSSARY & SGX CONCEPT EXPLAINER
  // =========================================================================
  if (
    lower.includes("explain") ||
    lower.includes("what is") ||
    lower.includes("what are") ||
    lower.includes("how does") ||
    lower.includes("bid") ||
    lower.includes("board lot") ||
    lower.includes("p/e") ||
    lower.includes("t+2") ||
    lower.includes("vwap") ||
    lower.includes("rsi") ||
    lower.includes("sma")
  ) {
    let term = "SGX Bid vs. Ask Spread & 100-Share Board Lots";
    let sgxRule =
      "On the Singapore Exchange (SGX), standard Mainboard shares trade in Board Lots of 100 shares. The Ask is the lowest price a seller will accept (your Buy Now price), and the Bid is the highest price a buyer is offering (your Sell Now price).";
    let laymanAnalogy =
      "Think of a money changer at Raffles Place: the board shows a slightly higher rate when you BUY currency (Ask) and a slightly lower rate when you SELL currency (Bid). And a 100-share Board Lot is like buying a wholesale carton of 100 cans instead of single loose cans.";
    let exampleMath =
      "If Singtel (Z74.SI) has Bid = S$4.11 and Ask = S$4.13, buying 1 Board Lot (100 shares) at Market costs 100 × S$4.13 = S$413.00 + SGX/CDP fees.";

    if (lower.includes("p/e") || lower.includes("pe ratio")) {
      term = "Price-to-Earnings (P/E) Ratio";
      sgxRule =
        "P/E Ratio = Current Share Price ÷ Earnings Per Share (EPS). It measures how many dollars investors are paying for every S$1.00 of annual company profit.";
      laymanAnalogy =
        "Imagine buying a bubble tea shop in Singapore that earns S$10,000 profit per year. If the owner sells the shop for S$100,000, the P/E ratio is 10x (it takes 10 years of steady profit to earn back your purchase price).";
      exampleMath =
        "At a P/E of 10.2x, investors pay S$10.20 for every S$1.00 of annual profit earned by DBS Group (D05.SI).";
    } else if (lower.includes("t+2") || lower.includes("cdp") || lower.includes("contract note")) {
      term = "SGX Contract Note & CDP T+2 Settlement";
      sgxRule =
        "In Singapore, the Central Depository (CDP) holds your SGX shares safely in your own name. When a trade executes on Trade Day (T), official legal transfer of shares and cash completes 2 business days later (T+2).";
      laymanAnalogy =
        "When you buy an item online, you get an order receipt (Contract Note) immediately, and the parcel is officially delivered to your locker 2 working days later (T+2).";
      exampleMath =
        "A trade executed on Monday (Trade Day T) officially settles in your CDP account on Wednesday (T+2).";
    } else if (lower.includes("vwap") || lower.includes("rsi") || lower.includes("sma") || lower.includes("candle")) {
      term = "TradingView Pro Chart Indicators (SMA 20/50, VWAP & RSI 14)";
      sgxRule =
        "SMA 20/50 tracks the 20- and 50-period Simple Moving Average closing price; VWAP tracks the Volume-Weighted Average Price; RSI(14) measures momentum on a 0–100 scale (>70 Overbought, <30 Oversold).";
      laymanAnalogy =
        "SMA is like your 20-day rolling school test average (smoothing out one bad day). VWAP shows the price where the heaviest crowd volume actually traded. RSI is a speedometer showing if buyers or sellers have been sprinting too fast.";
      exampleMath =
        "If DBS trades above its 20-day SMA with an RSI(14) of 55, momentum is positive without yet crossing the 70 'Overbought' threshold.";
    }

    return {
      toolUsed: "explainSgxConcept",
      headline: `SGX Plain-English Concept Guide: ${term}`,
      explanation: `${sgxRule}\n\nEveryday Analogy: ${laymanAnalogy}`,
      socraticQuestion:
        "How can you use this concept before placing your next 100-share Board Lot order?",
      card: {
        type: "glossary",
        term,
        sgxRule,
        laymanAnalogy,
        exampleMath,
      },
      followUpChips: [
        "Explain P/E Ratio simply",
        "Explain CDP T+2 Settlement",
        "Explain SMA, VWAP, and RSI chart indicators",
      ],
    };
  }

  // =========================================================================
  // 12. SINGLE TICKER DEEP-DIVE OR MARKET SCREENER BY CRITERIA
  // =========================================================================
  if (tickers.length === 1) {
    const ticker = tickers[0];
    const preview = buildOrderPreviewCard(
      ticker,
      "buy",
      "market",
      100,
      null,
      ctx,
    );
    const meta = TICKER_META[ticker];
    return {
      toolUsed: "inspectSingleCounter",
      headline: `${meta.name} (${ticker}) · Live SGX Quote & Quick Order Ticket`,
      explanation: `${meta.description} Currently trading at S$${formatSgxPrice(preview.livePrice)} (Bid: S$${formatSgxPrice(preview.bid)} · Ask: S$${formatSgxPrice(preview.ask)} · P/E: ${meta.peRatio.toFixed(1)}x · Dividend Yield: ${meta.dividendYieldPct.toFixed(1)}%). Below is a ready-to-use 1-Board-Lot (100 shares) order preview:`,
      socraticQuestion: meta.learningObjective,
      card: preview,
      followUpChips: [
        `What if I buy 200 shares of ${ticker}?`,
        `Project 5-year dividends for ${ticker}`,
        `Compare ${ticker} with peers`,
      ],
    };
  }

  // Filter / Screen Market by Risk Tier or Price/Yield Criteria
  let filteredTickers = [...VALID_TICKERS];
  let criteriaLabel = "Top SGX Counters Across Risk Tiers";

  if (lower.includes("safe bet")) {
    filteredTickers = VALID_TICKERS.filter(
      (t) => TICKER_META[t].tier === "Safe Bets",
    );
    criteriaLabel = "🟢 Safe Bets (Blue-Chip Leaders & Banks)";
  } else if (lower.includes("industry giant")) {
    filteredTickers = VALID_TICKERS.filter(
      (t) => TICKER_META[t].tier === "Industry Giants",
    );
    criteriaLabel = "🔵 Industry Giants (Infrastructure, Aviation & Defence)";
  } else if (lower.includes("everyday brand")) {
    filteredTickers = VALID_TICKERS.filter(
      (t) => TICKER_META[t].tier === "Everyday Brands",
    );
    criteriaLabel = "🟣 Everyday Brands (Supermarkets, Transport & Healthcare)";
  } else if (lower.includes("high risk")) {
    filteredTickers = VALID_TICKERS.filter(
      (t) => TICKER_META[t].tier === "High Risk, High Reward",
    );
    criteriaLabel = "🟠 High Risk, High Reward (Growth & Small-Cap)";
  } else if (lower.includes("under s$") || lower.includes("cheap") || lower.includes("affordable") || lower.includes("low price")) {
    filteredTickers = VALID_TICKERS.filter((t) => {
      const px = ctx.snapshot.quotes[t]?.price ?? TICKER_META[t].refPrice;
      return px <= 2.5;
    });
    criteriaLabel = "Affordable SGX Board Lots (Under S$250 per 100-Share Lot)";
  } else {
    // Default showcase of 6 diverse counters across tiers
    filteredTickers = ["D05.SI", "O39.SI", "Z74.SI", "OV8.SI", "C52.SI", "AIY.SI"];
    criteriaLabel = "Featured SGX Counters Across All 4 Risk Tiers";
  }

  const items = filteredTickers
    .slice(0, 6)
    .map((t) => buildComparisonItem(t, ctx.snapshot));

  return {
    toolUsed: "screenSgxMarketByCriteria",
    headline: `SGX Market Screener: ${criteriaLabel}`,
    explanation:
      "Here are the matching SGX-listed companies with their live share price, 100-share Board Lot cost, P/E Ratio, and tax-exempt Dividend Yield. Click 'Prepare Buy Order' on any card to stage an order ticket right in chat!",
    socraticQuestion:
      "Which two companies from different industries below could you combine to boost your 1 − HHI Diversification Score?",
    card: {
      type: "screener",
      criteriaLabel,
      items,
    },
    followUpChips: [
      "Buy 1 lot of DBS (D05.SI)",
      "Buy 2 lots of Sheng Siong (OV8.SI)",
      "Analyse my portfolio diversification",
      "Compare the 3 Singapore banks",
    ],
  };
}
