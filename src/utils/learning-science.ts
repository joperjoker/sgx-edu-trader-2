import { TICKER_META } from "@/utils/tickers";
import { calculateSmartInvestorScore } from "@/utils/sgx-market";
import type {
  HoldingDoc,
  LimitOrderDoc,
  MarketLiveSnapshotDoc,
  ReflectionDoc,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";

export type CompetencyId = "C1" | "C2" | "C3" | "C4" | "C5";

export type MasteryLevel =
  | "Level 1: Novice"
  | "Level 2: Developing"
  | "Level 3: Proficient"
  | "Level 4: Advanced";

export type BloomsLevel =
  | "Understand & Apply"
  | "Apply & Analyze"
  | "Analyze & Evaluate"
  | "Evaluate & Create";

export type SoloLevel =
  | "Unistructural"
  | "Multistructural"
  | "Relational"
  | "Extended Abstract";

export interface CompetencyRubricBands {
  novice: string;
  developing: string;
  proficient: string;
  advanced: string;
}

export interface CompetencyDimensionResult {
  id: CompetencyId;
  code: string;
  title: string;
  shortTitle: string;
  standardAlignment: string;
  cognitiveApproach: string;
  bloomsLevel: BloomsLevel;
  soloLevel: SoloLevel;
  scorePct: number; // 0 - 100
  level: MasteryLevel;
  evidenceSummary: string;
  nextActionTip: string;
  nextActionPrompt: string;
  rubricBands: CompetencyRubricBands;
}

export interface StudentCognitiveProfile {
  uid: string;
  nickname: string;
  overallScorePct: number;
  overallLevel: MasteryLevel;
  overallSoloStage: SoloLevel;
  cognitiveXp: number;
  proficientCount: number;
  competencies: CompetencyDimensionResult[];
  strengths: string[];
  growthAreas: string[];
  teacherReportComment: string;
}

export interface WorkedExampleItem {
  id: string;
  competencyId: CompetencyId;
  title: string;
  cognitivePrinciple: string;
  scenario: string;
  step1Worked: string;
  step2Worked: string;
  step3FadedPrompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RetrievalQuestionItem {
  id: string;
  competencyId: CompetencyId;
  bloomsLevel: BloomsLevel;
  question: string;
  options: string[];
  correctIndex: number;
  cognitiveFeedback: string;
}

export interface PreTradeThesisOption {
  id: string;
  label: string;
  competencyId: CompetencyId;
  promptHint: string;
}

export const PRE_TRADE_THESIS_OPTIONS: PreTradeThesisOption[] = [
  {
    id: "dividend_compounding",
    label: "Dividend Yield & Cash Flow",
    competencyId: "C4",
    promptHint:
      "Buying for sustainable Tier-1 tax-exempt SGX dividend income and compounding.",
  },
  {
    id: "sector_diversification",
    label: "Cross-Tier Diversification (1−HHI)",
    competencyId: "C3",
    promptHint:
      "Spreading risk across a new SGX Risk Tier or sector to lower portfolio concentration.",
  },
  {
    id: "valuation_pe_moat",
    label: "Attractive P/E Valuation & Moat",
    competencyId: "C4",
    promptHint:
      "Earnings multiple (P/E) is reasonable relative to sector peers and balance-sheet strength.",
  },
  {
    id: "fee_efficient_sizing",
    label: "Fee-Efficient Board Lot Sizing",
    competencyId: "C2",
    promptHint:
      "Sizing the order so SGX + CDP + 9% GST fees stay well below 1.5% of principal.",
  },
  {
    id: "risk_rebalancing",
    label: "Profit-Taking / Risk Rebalancing",
    competencyId: "C5",
    promptHint:
      "Trimming an overweight position or rebalancing cash reserves after a price move.",
  },
];

export const WORKED_EXAMPLES_BANK: WorkedExampleItem[] = [
  {
    id: "we-fee-drag",
    competencyId: "C2",
    title: "Worked Example 1: Why Small Orders Suffer High SGX Fee Drag",
    cognitivePrinciple: "Sweller's Cognitive Load Theory (Faded Worked Example)",
    scenario:
      "Compare buying 1 Board Lot (100 shares) of ISOTeam (ITS.SI @ S$0.088) versus 1 Board Lot (100 shares) of Sheng Siong (OV8.SI @ S$2.82) under SGX's S$10.00 minimum brokerage rule.",
    step1Worked:
      "Step 1 (Worked — Gross Principal): For 100 shares of ITS.SI @ S$0.088, Gross Principal = 100 × S$0.088 = S$8.80. For 100 shares of OV8.SI @ S$2.82, Gross Principal = 100 × S$2.82 = S$282.00.",
    step2Worked:
      "Step 2 (Worked — Minimum Brokerage + CDP + SGX + 9% GST): Both orders trigger the S$10.00 minimum brokerage. Total fee on ITS.SI is S$10.90 (123.86% of S$8.80!), while total fee on OV8.SI is S$11.02 (3.91% of S$282.00).",
    step3FadedPrompt:
      "Step 3 (Your Turn — Complete the Solution): What minimum trade value is required so that a ~S$11.00 total fee stays below the 1.50% institutional fee-drag threshold?",
    options: [
      "At least ~S$735.00 in gross principal (S$11.00 ÷ 0.015 ≈ S$733)",
      "Any trade above S$50.00 in gross principal",
      "Exactly 100 shares regardless of share price",
    ],
    correctIndex: 0,
    explanation:
      "Correct! Dividing the ~S$11.00 minimum fee package by 1.5% (0.015) shows that orders around S$735+ keep fee drag under 1.50%. On sub-dollar counters, buying multiple lots or larger position sizes prevents minimum brokerage from eating your returns.",
  },
  {
    id: "we-hhi-diversification",
    competencyId: "C3",
    title: "Worked Example 2: Computing Herfindahl-Hirschman Index (1 − HHI)",
    cognitivePrinciple: "Schema Acquisition via Step-by-Step Decomposition",
    scenario:
      "Student A puts 100% of their invested stock capital into DBS (D05.SI). Student B splits their stock capital equally across 4 SGX companies (25% each in DBS, Singtel, Sheng Siong, and ST Engineering).",
    step1Worked:
      "Step 1 (Worked — Square Each Stock's Portfolio Weight): Student A's HHI = 1.00² = 1.00. Student B's HHI = 0.25² + 0.25² + 0.25² + 0.25² = 0.0625 × 4 = 0.25.",
    step2Worked:
      "Step 2 (Worked — Convert to Diversification Score 1 − HHI): Student A's Diversification Score = 1 − 1.00 = 0%. Student B's Diversification Score = 1 − 0.25 = 75%.",
    step3FadedPrompt:
      "Step 3 (Your Turn — Complete the Solution): If both students earn a +6.00% raw portfolio return, what is Student B's Smart Investor Score using Return × (1 + (1 − HHI))?",
    options: [
      "+10.50 Smart Score (6.00 × 1.75) vs Student A's +6.00",
      "+6.00 Smart Score (identical to Student A)",
      "+1.50 Smart Score (6.00 × 0.25)",
    ],
    correctIndex: 0,
    explanation:
      "Exact match! Student B earns a 1.75× diversification multiplier (6.00 × (1 + 0.75) = +10.50), proving mathematically why spreading risk across uncorrelated SGX sectors beats single-stock concentration.",
  },
  {
    id: "we-valuation-pe-yield",
    competencyId: "C4",
    title: "Worked Example 3: Comparing P/E Ratio vs. Dividend Yield",
    cognitivePrinciple: "Dual-Variable Comparative Evaluation",
    scenario:
      "You are comparing OCBC Bank (O39.SI: P/E ~9.8x, Dividend Yield ~5.3%) with iFAST Corporation (AIY.SI: P/E ~28.4x, Dividend Yield ~0.8%).",
    step1Worked:
      "Step 1 (Worked — Earnings Multiple Interpretation): OCBC trades at 9.8× annual earnings (value/income anchor), whereas iFAST trades at 28.4× earnings because investors price in high future platform growth.",
    step2Worked:
      "Step 2 (Worked — Cash Yield Calculation): On a S$5,000 position, OCBC pays ~S$265/year in Tier-1 tax-exempt cash dividends, while iFAST pays ~S$40/year.",
    step3FadedPrompt:
      "Step 3 (Your Turn — Complete the Solution): Why is a high-P/E growth stock like iFAST more sensitive to an interest-rate tightening shock than OCBC?",
    options: [
      "Higher interest rates discount distant future earnings more heavily, compressing high-P/E multiples",
      "High-P/E stocks are required by SGX to pay higher brokerage fees",
      "Banks cannot earn net interest income when interest rates rise",
    ],
    correctIndex: 0,
    explanation:
      "Spot on! Growth stocks derive most of their valuation from cash flows far in the future. When discount rates rise, those distant cash flows lose present value faster than near-term bank dividends.",
  },
  {
    id: "we-drip-compounding",
    competencyId: "C4",
    title: "Worked Example 4: The 5-Year DRIP Dividend Snowball",
    cognitivePrinciple: "Exponential vs. Linear Mental Model Calibration",
    scenario:
      "You invest S$8,500 into OCBC Bank yielding 5.3% per year. Compare taking cash dividends (Linear) vs. reinvesting dividends into additional shares each year (DRIP Compounding).",
    step1Worked:
      "Step 1 (Worked — Year 1 Dividend): Year 1 cash dividend = S$8,500 × 5.3% = S$450.50.",
    step2Worked:
      "Step 2 (Worked — 5-Year Linear Cash Total): Without reinvestment, 5 years of flat dividends = 5 × S$450.50 = S$2,252.50 (Principal stays S$8,500 + S$2,252.50 = S$10,752.50).",
    step3FadedPrompt:
      "Step 3 (Your Turn — Complete the Solution): With DRIP reinvestment at 5.3% compounded annually for 5 years (S$8,500 × 1.053⁵), what happens to total cumulative payouts?",
    options: [
      "Portfolio grows to ~S$11,004 (+S$2,504 total gain) because each year's dividends buy shares that pay their own dividends",
      "Total value is lower because Singapore taxes domestic dividends at 30%",
      "DRIP only works on High-Risk technology stocks",
    ],
    correctIndex: 0,
    explanation:
      "Correct! Under Singapore's Tier-1 corporate tax system, dividends are tax-exempt in the hands of shareholders, allowing 100% of reinvested dividends to compound year after year.",
  },
];

export const RETRIEVAL_PRACTICE_BANK: RetrievalQuestionItem[] = [
  {
    id: "rq-c1-bid-ask",
    competencyId: "C1",
    bloomsLevel: "Understand & Apply",
    question:
      "DBS Group (D05.SI) shows a Top Bid of S$43.79 and a Top Ask of S$43.81. If you submit an immediate Market BUY order for 1 Board Lot (100 shares), at what price does your order fill?",
    options: [
      "S$43.81 (the Ask price offered by sellers)",
      "S$43.79 (the Bid price offered by buyers)",
      "S$43.80 (the midpoint average)",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C1 — Market Mechanics): Immediate Market BUY orders cross the spread and fill at the lowest Ask price (S$43.81). Market SELL orders fill at the highest Bid price (S$43.79).",
  },
  {
    id: "rq-c1-limit-order",
    competencyId: "C1",
    bloomsLevel: "Apply & Analyze",
    question:
      "Singtel (Z74.SI) is currently trading at an Ask price of S$4.12. You place a Limit BUY order at S$4.05. When will your order execute?",
    options: [
      "Only if Singtel's Ask price drops to S$4.05 or lower",
      "Immediately at S$4.12",
      "At 5:00 PM regardless of price",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C1 — Order Discipline): A Limit BUY sets the maximum ceiling price you are willing to pay. It rests in the order queue until sellers offer shares at S$4.05 or better.",
  },
  {
    id: "rq-c2-min-fee",
    competencyId: "C2",
    bloomsLevel: "Apply & Analyze",
    question:
      "Under realistic SGX fee rules (0.20% brokerage with S$10.00 minimum + 0.0325% CDP + 0.0075% SGX + 9% GST), why does buying S$100 worth of shares require a >21% price jump just to break even on a round-trip buy + sell?",
    options: [
      "Because the S$10.00 minimum brokerage applies on BOTH the buy leg (~S$10.93) and the sell leg (~S$10.93)",
      "Because GST is charged at 21% on small stocks",
      "Because CDP charges S$20 flat per share",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C2 — Transaction Cost Economics): Fixed minimum commissions create severe fee drag on tiny trades. Sizing orders appropriately is a core institutional skill.",
  },
  {
    id: "rq-c3-hhi",
    competencyId: "C3",
    bloomsLevel: "Analyze & Evaluate",
    question:
      "Your portfolio holds S$4,500 in DBS Bank and S$4,500 in OCBC Bank. Why does a Macroeconomic Interest-Rate Shock still pose concentration risk even though you own 2 tickers?",
    options: [
      "Both counters belong to the same Financial Services sector and Safe Bets tier, so their earnings react to the same macro factor",
      "Because holding two banks doubles your CDP clearing fee rate",
      "Because HHI only countsHigh-Risk stocks",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C3 — True Diversification): True risk reduction requires spreading capital across both multiple tickers (lowering HHI) AND multiple economic sectors/risk tiers.",
  },
  {
    id: "rq-c4-pe-trap",
    competencyId: "C4",
    bloomsLevel: "Analyze & Evaluate",
    question:
      "Company X has a share price of S$0.50 and a P/E ratio of 35x. Company Y has a share price of S$30.00 and a P/E ratio of 10x. Which company is cheaper relative to its current annual earnings?",
    options: [
      "Company Y (investors pay S$10 for every S$1 of annual profit, vs S$35 for Company X)",
      "Company X because S$0.50 is a lower share price than S$30.00",
      "Both have identical valuation because share price equals value",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C4 — Valuation Literacy): Nominal share price tells you nothing about valuation! P/E ratio measures what you pay per dollar of company earnings.",
  },
  {
    id: "rq-c5-metacognition",
    competencyId: "C5",
    bloomsLevel: "Evaluate & Create",
    question:
      "Why do institutional portfolio managers write a Pre-Trade Thesis and Confidence Rating BEFORE executing an order?",
    options: [
      "To combat hindsight bias and emotional impulse trading so they can objectively audit whether their thesis was right or lucky",
      "To satisfy SGX T+2 settlement computer formatting",
      "To guarantee the stock price will rise",
    ],
    correctIndex: 0,
    cognitiveFeedback:
      "Retrieval Encoding (C5 — Metacognitive Calibration): Recording your hypothesis before knowing the outcome prevents the 'illusion of competence' and separates skill from luck.",
  },
];

export function scoreToMasteryLevel(scorePct: number): MasteryLevel {
  if (scorePct >= 85) return "Level 4: Advanced";
  if (scorePct >= 70) return "Level 3: Proficient";
  if (scorePct >= 50) return "Level 2: Developing";
  return "Level 1: Novice";
}

export function scoreToSoloStage(scorePct: number): SoloLevel {
  if (scorePct >= 85) return "Extended Abstract";
  if (scorePct >= 70) return "Relational";
  if (scorePct >= 50) return "Multistructural";
  return "Unistructural";
}

/**
 * Computes a student's 5-Pillar Financial Literacy Competency Profile
 * aligned with OECD/PISA Youth Financial Literacy, CEE Investing Standards,
 * Bloom's Revised Taxonomy, and SOLO Taxonomy.
 */
export function computeStudentCompetencyProfile(params: {
  user: UserProfileDoc;
  holdings: HoldingDoc[];
  trades: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
  reflections: ReflectionDoc[];
  snapshot?: MarketLiveSnapshotDoc;
  completedRetrievalIds?: string[];
  completedWorkedExampleIds?: string[];
}): StudentCognitiveProfile {
  const {
    user,
    holdings,
    trades,
    limitOrders,
    reflections,
    completedRetrievalIds = [],
    completedWorkedExampleIds = [],
  } = params;

  const activeHoldings = holdings.filter((h) => h.shares > 0);
  const tradeCount = trades.length;
  const limitOrderCount =
    limitOrders.length +
    trades.filter((t) => t.orderType === "limit").length;
  const retrievalBonus = Math.min(18, completedRetrievalIds.length * 4);
  const workedExampleBonus = Math.min(12, completedWorkedExampleIds.length * 4);

  // ---------------------------------------------------------------------------
  // C1: SGX Market Mechanics & Order Execution Discipline
  // ---------------------------------------------------------------------------
  let c1Base = 25;
  if (tradeCount >= 1) c1Base += 30;
  if (tradeCount >= 2) c1Base += 15;
  if (activeHoldings.length >= 2) c1Base += 10;
  if (limitOrderCount >= 1) c1Base += 14;
  const c1Retrieval = completedRetrievalIds.filter((id) =>
    id.includes("c1"),
  ).length;
  const c1Score = Math.min(100, Math.round(c1Base + c1Retrieval * 6));

  // ---------------------------------------------------------------------------
  // C2: Transaction Cost Economics & Fee-Drag Optimization
  // Critic Guardrail: 0 trades MUST NOT receive 100% fee-drag mastery!
  // ---------------------------------------------------------------------------
  let c2Score = 35;
  let avgFeeDragPct = 0;
  if (tradeCount === 0) {
    const c2Practice =
      (completedWorkedExampleIds.includes("we-fee-drag") ? 18 : 0) +
      (completedRetrievalIds.includes("rq-c2-min-fee") ? 15 : 0);
    c2Score = Math.min(68, 35 + c2Practice);
  } else {
    const totalGross = trades.reduce(
      (acc, t) => acc + Math.max(1, t.grossAmount),
      0,
    );
    const totalFees = trades.reduce((acc, t) => acc + t.totalFee, 0);
    avgFeeDragPct = Number(((totalFees / totalGross) * 100).toFixed(2));
    const lowFeeTrades = trades.filter(
      (t) => (t.totalFee / Math.max(1, t.grossAmount)) * 100 <= 1.5,
    ).length;
    const lowFeeRatio = lowFeeTrades / tradeCount;

    if (avgFeeDragPct <= 0.75) {
      c2Score = 88 + Math.round(lowFeeRatio * 8);
    } else if (avgFeeDragPct <= 1.5) {
      c2Score = 74 + Math.round(lowFeeRatio * 10);
    } else if (avgFeeDragPct <= 2.5) {
      c2Score = 56;
    } else {
      c2Score = 42;
    }
    if (completedWorkedExampleIds.includes("we-fee-drag")) c2Score += 5;
    if (completedRetrievalIds.includes("rq-c2-min-fee")) c2Score += 5;
    c2Score = Math.min(100, c2Score);
  }

  // ---------------------------------------------------------------------------
  // C3: Portfolio Diversification & Risk-Adjusted Architecture (1 - HHI)
  // ---------------------------------------------------------------------------
  const divScorePct = Math.round((1 - (user.hhi ?? 1)) * 100);
  const distinctTiers = new Set(
    activeHoldings.map((h) => TICKER_META[h.ticker]?.tier).filter(Boolean),
  ).size;
  const distinctSectors = new Set(
    activeHoldings.map((h) => TICKER_META[h.ticker]?.sector).filter(Boolean),
  ).size;

  let c3Score = 25;
  if (activeHoldings.length === 0) {
    c3Score = 30;
  } else {
    c3Score = Math.min(
      92,
      Math.round(
        divScorePct * 0.75 + distinctTiers * 10 + distinctSectors * 4,
      ),
    );
  }
  if (completedWorkedExampleIds.includes("we-hhi-diversification")) {
    c3Score += 5;
  }
  if (completedRetrievalIds.includes("rq-c3-hhi")) {
    c3Score += 5;
  }
  c3Score = Math.min(100, Math.max(25, c3Score));

  // ---------------------------------------------------------------------------
  // C4: Fundamental Valuation & Compounding Analysis
  // ---------------------------------------------------------------------------
  let avgYield = 0;
  let avgPe = 0;
  if (activeHoldings.length > 0) {
    avgYield =
      activeHoldings.reduce(
        (acc, h) => acc + (TICKER_META[h.ticker]?.dividendYieldPct ?? 0),
        0,
      ) / activeHoldings.length;
    avgPe =
      activeHoldings.reduce(
        (acc, h) => acc + (TICKER_META[h.ticker]?.peRatio ?? 15),
        0,
      ) / activeHoldings.length;
  }

  let c4Score = 38;
  if (activeHoldings.length > 0) {
    c4Score = 58;
    if (avgYield >= 3.2) c4Score += 16;
    else if (avgYield >= 2.0) c4Score += 8;
    if (avgPe > 0 && avgPe <= 22) c4Score += 12;
  }
  if (completedWorkedExampleIds.includes("we-valuation-pe-yield")) c4Score += 6;
  if (completedWorkedExampleIds.includes("we-drip-compounding")) c4Score += 6;
  if (completedRetrievalIds.includes("rq-c4-pe-trap")) c4Score += 6;
  c4Score = Math.min(100, c4Score);

  // ---------------------------------------------------------------------------
  // C5: Metacognitive Calibration & Behavioural Self-Regulation
  // ---------------------------------------------------------------------------
  const reflectionCount = reflections.length;
  const hasCoolingLockout =
    user.coolingOffUntil !== null &&
    new Date(user.coolingOffUntil).getTime() > Date.now();

  let c5Score = 40;
  if (!hasCoolingLockout && tradeCount > 0) c5Score += 18;
  if (reflectionCount >= 1) c5Score += 22;
  if (reflectionCount >= 2) c5Score += 10;
  if (completedRetrievalIds.includes("rq-c5-metacognition")) c5Score += 8;
  if (hasCoolingLockout) c5Score = Math.min(48, c5Score);
  c5Score = Math.min(100, c5Score);

  const competencies: CompetencyDimensionResult[] = [
    {
      id: "C1",
      code: "FL-C1",
      title: "SGX Market Mechanics & Order Execution",
      shortTitle: "Market Mechanics",
      standardAlignment:
        "OECD/PISA Planning & Managing Finances · CEE Investing Std 2",
      cognitiveApproach: "Procedural Schema & Worked Examples",
      bloomsLevel: "Understand & Apply",
      soloLevel: scoreToSoloStage(c1Score),
      scorePct: c1Score,
      level: scoreToMasteryLevel(c1Score),
      evidenceSummary: `${tradeCount} executed SGX trade(s), ${activeHoldings.length} active counter(s), ${limitOrderCount} limit order(s) staged/filled.`,
      nextActionTip:
        limitOrderCount === 0
          ? "Stage a price-disciplined Limit Order to reach Proficient/Advanced mastery."
          : "Maintain Bid/Ask spread awareness across all 3 SGX tick-size bands.",
      nextActionPrompt: "Limit buy 100 shares of Singtel at S$4.05",
      rubricBands: {
        novice:
          "Has not yet executed a 100-share SGX Board Lot or confuses Bid/Ask execution.",
        developing:
          "Executes Market orders in 100-share Board Lots; developing Limit order discipline.",
        proficient:
          "Executes Board Lot trades and uses Limit orders or spread checks to control entry price.",
        advanced:
          "Mastery of Market & Limit order execution across SGX tick bands with 100% recall.",
      },
    },
    {
      id: "C2",
      code: "FL-C2",
      title: "Transaction Cost & Fee-Drag Optimization",
      shortTitle: "Fee-Drag Math",
      standardAlignment:
        "OECD/PISA Money & Transactions · CEE Cost-Benefit Standard",
      cognitiveApproach: "Faded Worked Examples (Cognitive Load Theory)",
      bloomsLevel: "Apply & Analyze",
      soloLevel: scoreToSoloStage(c2Score),
      scorePct: c2Score,
      level: scoreToMasteryLevel(c2Score),
      evidenceSummary:
        tradeCount > 0
          ? `Cumulative fees S$${user.totalFeesPaid.toFixed(2)} across ${tradeCount} trade(s) (Avg fee drag: ${avgFeeDragPct.toFixed(2)}%).`
          : "No trades executed yet — complete Worked Example 1 or execute a fee-efficient lot (>S$735).",
      nextActionTip:
        avgFeeDragPct > 1.5 || tradeCount === 0
          ? "Size SGX Board Lot trades above ~S$735 so the S$10 minimum fee stays under 1.50%."
          : "Excellent fee discipline! Your average transaction cost drag is below 1.50%.",
      nextActionPrompt: "What if I buy 2 lots of Sheng Siong (OV8.SI)?",
      rubricBands: {
        novice:
          "Uninvested or places small orders where the S$10 minimum fee exceeds 2.5% of principal.",
        developing:
          "Recognizes SGX/CDP/9% GST fee structure with average fee drag between 1.5% and 2.5%.",
        proficient:
          "Sizes SGX Board Lot orders so effective transaction cost drag stays below 1.50%.",
        advanced:
          "Maintains sub-0.85% average fee drag and masters round-trip break-even math.",
      },
    },
    {
      id: "C3",
      code: "FL-C3",
      title: "Portfolio Diversification & Risk Architecture",
      shortTitle: "Diversification (1−HHI)",
      standardAlignment:
        "OECD/PISA Risk & Reward · CEE Portfolio Diversification Std 6",
      cognitiveApproach: "Quantitative Mental Modeling & Counterfactual What-If",
      bloomsLevel: "Analyze & Evaluate",
      soloLevel: scoreToSoloStage(c3Score),
      scorePct: c3Score,
      level: scoreToMasteryLevel(c3Score),
      evidenceSummary: `Diversification (1 − HHI): ${divScorePct}% across ${activeHoldings.length} stock(s), ${distinctTiers} Risk Tier(s), and ${distinctSectors} sector(s).`,
      nextActionTip:
        distinctTiers < 3
          ? `Add a counter from an unrepresented SGX Risk Tier (currently in ${distinctTiers}/4 tiers) to boost 1 − HHI.`
          : "Strong multi-tier diversification! Stress-test your holdings against macro shocks.",
      nextActionPrompt: "Analyse my portfolio health & Smart Score",
      rubricBands: {
        novice:
          "Portfolio is 100% cash or concentrated in 1 stock (1 − HHI < 30%).",
        developing:
          "Holds 2 SGX counters (1 − HHI 30–54%) across 1–2 risk tiers.",
        proficient:
          "Diversified across ≥3 SGX counters and ≥2 risk tiers with 1 − HHI ≥ 55%.",
        advanced:
          "Institutional allocation across ≥3 risk tiers with 1 − HHI ≥ 65% and strong Smart Score.",
      },
    },
    {
      id: "C4",
      code: "FL-C4",
      title: "Fundamental Valuation & Compounding Literacy",
      shortTitle: "Valuation & DRIP",
      standardAlignment:
        "OECD/PISA Financial Landscape · CEE Earnings & Compounding Std 3",
      cognitiveApproach: "Comparative Elaborative Interrogation",
      bloomsLevel: "Analyze & Evaluate",
      soloLevel: scoreToSoloStage(c4Score),
      scorePct: c4Score,
      level: scoreToMasteryLevel(c4Score),
      evidenceSummary:
        activeHoldings.length > 0
          ? `Portfolio avg P/E: ${avgPe.toFixed(1)}x · Avg Tax-Exempt Dividend Yield: ${avgYield.toFixed(2)}%.`
          : "Complete the P/E vs. Yield Worked Example and compare SGX Blue-Chip anchors.",
      nextActionTip:
        "Compare P/E multiples and project 5-year DRIP dividend compounding in AI Copilot.",
      nextActionPrompt: "Project 5-year DRIP dividends for 5 lots of OCBC",
      rubricBands: {
        novice:
          "Evaluates stocks by nominal share price rather than P/E or dividend yield.",
        developing:
          "Distinguishes between P/E valuation and Dividend Yield across tiers.",
        proficient:
          "Constructs a portfolio balancing reasonable P/E multiples and ≥3.0% dividend yield.",
        advanced:
          "Synthesizes P/E, Dividend Yield, and 5-year DRIP compounding for total return.",
      },
    },
    {
      id: "C5",
      code: "FL-C5",
      title: "Metacognitive Calibration & Self-Regulation",
      shortTitle: "Metacognition",
      standardAlignment:
        "OECD/PISA Behavioural Self-Regulation · Flavell Metacognitive Framework",
      cognitiveApproach: "Pre-Trade Hypothesis Testing & Post-Trade Reflection",
      bloomsLevel: "Evaluate & Create",
      soloLevel: scoreToSoloStage(c5Score),
      scorePct: c5Score,
      level: scoreToMasteryLevel(c5Score),
      evidenceSummary: `${reflectionCount} Weekly Reflection(s) logged · Circuit Breaker status: ${hasCoolingLockout ? "Active Lockout" : "Disciplined (0 lockouts)"}.`,
      nextActionTip:
        reflectionCount === 0
          ? "Log your Weekly Investment Reflection on /portfolio to encode your learning."
          : "Tag a Pre-Trade Thesis before your next order and stress-test macro scenarios.",
      nextActionPrompt: "Help me draft my weekly reflection",
      rubricBands: {
        novice:
          "Trades without a pre-trade thesis or has not logged a weekly reflection.",
        developing:
          "Logs initial reflections and avoids circuit-breaker impulse overtrading.",
        proficient:
          "Articulates pre-trade theses, calibrates confidence, and logs weekly reflections.",
        advanced:
          "Exemplary self-regulation: thesis audits, macro stress-testing, and deep reflections.",
      },
    },
  ];

  const overallScorePct = Math.round(
    competencies.reduce((acc, c) => acc + c.scorePct, 0) / competencies.length,
  );
  const overallLevel = scoreToMasteryLevel(overallScorePct);
  const overallSoloStage = scoreToSoloStage(overallScorePct);
  const proficientCount = competencies.filter((c) => c.scorePct >= 70).length;
  const cognitiveXp =
    overallScorePct * 12 +
    tradeCount * 25 +
    reflectionCount * 60 +
    retrievalBonus * 10 +
    workedExampleBonus * 10;

  const sortedByScore = [...competencies].sort(
    (a, b) => b.scorePct - a.scorePct,
  );
  const strengths = sortedByScore
    .slice(0, 2)
    .map((c) => `${c.shortTitle} (${c.scorePct}%)`);
  const growthAreas = sortedByScore
    .slice(-2)
    .reverse()
    .map((c) => `${c.shortTitle} (${c.scorePct}%)`);

  const smartScore = calculateSmartInvestorScore(
    user.netValue,
    user.startingCapital > 0 ? user.startingCapital : 10000,
    user.hhi ?? 1,
  );

  const teacherReportComment = `${user.nickname} currently demonstrates ${overallLevel} proficiency (${overallScorePct}% overall mastery, SOLO ${overallSoloStage} stage) with a Smart Investor Score of ${smartScore >= 0 ? `+${smartScore.toFixed(2)}` : smartScore.toFixed(2)}. Strongest competency: ${sortedByScore[0].title} (${sortedByScore[0].scorePct}%). Recommended next instructional focus: ${sortedByScore[sortedByScore.length - 1].title} (${sortedByScore[sortedByScore.length - 1].nextActionTip})`;

  return {
    uid: user.uid,
    nickname: user.nickname,
    overallScorePct,
    overallLevel,
    overallSoloStage,
    cognitiveXp,
    proficientCount,
    competencies,
    strengths,
    growthAreas,
    teacherReportComment,
  };
}
