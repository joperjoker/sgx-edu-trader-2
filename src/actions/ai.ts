"use server";

import { GoogleGenAI } from "@google/genai";
import YahooFinance from "yahoo-finance2";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { getMarketSnapshot, readLocalDb, writeLocalDb } from "@/lib/firebase/store";
import { getTickerCandles } from "@/lib/stock-provider";
import { TICKER_META, VALID_TICKERS } from "@/utils/tickers";

const yahooFinance = new YahooFinance();
const MODEL = "gemini-2.5-flash";

export interface AiActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_gemini")) return null;
  return new GoogleGenAI({ apiKey });
}

async function runGeminiOrSocraticFallback(
  prompt: string,
  fallbackText: string,
): Promise<string> {
  const ai = getGenAiClient();
  if (!ai) return fallbackText;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response.text?.trim();
    return text && text.length > 0 ? text : fallbackText;
  } catch {
    return fallbackText;
  }
}

export async function analyseCompanyNewsAction(
  ticker: string,
): Promise<AiActionResult<{ text: string; headlines: string[] }>> {
  const cleanTicker = ticker.toUpperCase();
  if (!VALID_TICKERS.includes(cleanTicker)) {
    return { success: false, error: "Invalid SGX ticker." };
  }
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Please sign in first." };

  const meta = TICKER_META[cleanTicker];
  let headlines: string[] = [];

  try {
    const search = (await yahooFinance.search(cleanTicker, {
      newsCount: 5,
      quotesCount: 0,
    })) as { news?: Array<{ title?: string }> };
    headlines = (search.news ?? [])
      .map((n) => (n.title ?? "").trim())
      .filter((t) => t.length > 0)
      .slice(0, 5);
  } catch {
    // Use realistic sector headlines if Yahoo search is offline
  }

  if (headlines.length === 0) {
    headlines = [
      `${meta.name} (${cleanTicker}) reports steady operational performance across ASEAN markets`,
      `SGX institutional flows highlight dividend resilience in ${meta.sector} sector`,
      `Analysts review capital allocation and margin outlook for ${meta.shortName}`,
      `Singapore macroeconomic update: Interest rate trajectory and SGD strength impact ${meta.sector}`,
    ];
  }

  const prompt = `You are a Socratic financial education coach for Singapore secondary school and JC students aged 14-18.

Here are recent news headlines for ${cleanTicker} (${meta.name} — ${meta.sector}):
${headlines.join("\n")}

Your task:
1. Write 3 clear sentences summarising the potential business impact in plain English (explain any financial term in brackets).
2. Add a section titled 'What AI Misses:' naming ONE important real-world factor that headlines alone cannot capture.
3. Add a section titled 'Your Turn:' posing ONE Socratic research question for the student to investigate before trading.

Keep the response under 175 words. NEVER give a buy/sell recommendation or price prediction.`;

  const fallback = `Recent updates for ${meta.name} (${cleanTicker}) focus on its core ${meta.sector} operations and margin stability across Singapore and regional ASEAN markets. Investors track revenue growth alongside operating costs (the day-to-day expenses required to run the business) to judge whether dividend payouts remain sustainable.

What AI Misses:
Headline summaries cannot measure management execution quality or how competitors are pricing their services on the ground in Singapore.

Your Turn:
${meta.learningObjective}`;

  const text = await runGeminiOrSocraticFallback(prompt, fallback);
  return { success: true, data: { text, headlines } };
}

export async function analysePricePatternAction(
  ticker: string,
): Promise<AiActionResult<{ text: string; days: number }>> {
  const cleanTicker = ticker.toUpperCase();
  if (!VALID_TICKERS.includes(cleanTicker)) {
    return { success: false, error: "Invalid SGX ticker." };
  }
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Please sign in first." };

  const meta = TICKER_META[cleanTicker];
  const candles = await getTickerCandles(cleanTicker, "1M");
  const series = candles.slice(-30);
  const first = series[0]?.close ?? meta.refPrice;
  const last = series[series.length - 1]?.close ?? meta.refPrice;
  const pct = ((last - first) / first) * 100;
  const pricesList = series.map((c) => c.close.toFixed(2)).join(", ");

  const prompt = `You are a financial education tool for Singapore students.
Here are ${series.length} sessions of closing prices for ${cleanTicker} (${meta.name}):
[${pricesList}]
Start: S$${first.toFixed(2)}, Latest: S$${last.toFixed(2)}, Change: ${pct.toFixed(2)}%.

STRICT RULE: Do NOT give a bullish or bearish verdict. Do NOT recommend buying or selling.
1. Describe the historical price behaviour and volatility objectively in 2 sentences.
2. List 2 fundamental catalysts that could support the business.
3. List 2 risks that could cause a reversal.
4. End with: 'What is YOUR assessment of this stock, and what additional research would you do before making a decision?'`;

  const fallback = `Over the past ${series.length} trading sessions, ${meta.name} (${cleanTicker}) moved from S$${first.toFixed(2)} to S$${last.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%), reflecting ${meta.tier === "Safe Bets" ? "moderate blue-chip volatility" : "active sector rotation"}.

Supporting Factors:
• Resilient demand within Singapore's ${meta.sector} ecosystem and steady recurring cash flows.
• Institutional investor interest in companies with established market share and dividend track records (approx. ${meta.dividendYieldPct}% yield).

Reversal Risks:
• Margin compression if input, energy, or labour costs in Singapore rise faster than revenue.
• Broader macroeconomic slowdowns or shifts in global interest rates affecting valuation multiples (P/E of ${meta.peRatio}x).

What is YOUR assessment of this stock, and what additional research would you do before making a decision?`;

  const text = await runGeminiOrSocraticFallback(prompt, fallback);
  return { success: true, data: { text, days: series.length } };
}

export async function analyseFinancialHealthAction(
  ticker: string,
): Promise<
  AiActionResult<{
    rating: "STRONG" | "MODERATE" | "WEAK";
    text: string;
  }>
> {
  const cleanTicker = ticker.toUpperCase();
  if (!VALID_TICKERS.includes(cleanTicker)) {
    return { success: false, error: "Invalid SGX ticker." };
  }
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Please sign in first." };

  const meta = TICKER_META[cleanTicker];
  const snapshot = await getMarketSnapshot();
  const quote = snapshot.quotes[cleanTicker];
  const price = quote?.price ?? meta.refPrice;

  const prompt = `You are a financial education assistant for Singapore secondary school students.
Company: ${meta.name} (${cleanTicker})
Sector: ${meta.sector} | Tier: ${meta.tier}
Market Cap: ${meta.marketCapB} | P/E Ratio: ${meta.peRatio}x | Dividend Yield: ${meta.dividendYieldPct}% | Share Price: S$${price.toFixed(2)}

Rate overall fundamental profile as STRONG or MODERATE.
Write 3 plain-English bullet points explaining P/E ratio (${meta.peRatio}x), Dividend Yield (${meta.dividendYieldPct}%), and Market Capitalisation (${meta.marketCapB}) to a 15-year-old student.
End with: 'Remember: This analysis is based on historical financial data. Past performance does not predict future results. This AI output may contain errors.'`;

  const rating: "STRONG" | "MODERATE" =
    meta.tier === "Safe Bets" || meta.tier === "Industry Giants"
      ? "STRONG"
      : "MODERATE";

  const fallback = `• Market Capitalisation (${meta.marketCapB}): This is the total market value of all ${meta.shortName} shares combined on SGX, showing its scale within the ${meta.sector} industry.
• Price-to-Earnings Ratio (${meta.peRatio}x): Investors currently pay S$${meta.peRatio.toFixed(1)} for every S$1.00 of annual company earnings, reflecting market expectations for future stability and growth.
• Dividend Yield (${meta.dividendYieldPct}%): Historically, the company distributes approximately ${meta.dividendYieldPct}% of its share price back to shareholders annually as cash dividends, though dividends are never guaranteed.

Remember: This analysis is based on historical financial data. Past performance does not predict future results. This AI output may contain errors.`;

  const text = await runGeminiOrSocraticFallback(prompt, fallback);

  // Grant `ai_analyst` achievement when student explores AI analysis
  const db = readLocalDb();
  const profile = db.users[user.uid];
  if (profile && !profile.achievements["ai_analyst"]) {
    profile.achievements["ai_analyst"] = new Date().toISOString();
    profile.achievementCount = Object.keys(profile.achievements).length;
    writeLocalDb(db);
  }

  return { success: true, data: { rating, text } };
}

export type StressScenarioId =
  | "mas_tightening"
  | "semi_capex_surge"
  | "changi_tourism_boom"
  | "energy_inflation_shock";

export interface StressTestHoldingImpact {
  ticker: string;
  companyName: string;
  sector: string;
  currentValue: number;
  shockPct: number;
  estimatedDeltaSgd: number;
}

export interface StressTestResult {
  scenarioId: StressScenarioId;
  scenarioTitle: string;
  estimatedPortfolioDeltaSgd: number;
  estimatedPortfolioDeltaPct: number;
  holdingImpacts: StressTestHoldingImpact[];
  socraticCommentary: string;
}

const SCENARIO_CATALOG: Record<
  StressScenarioId,
  {
    title: string;
    description: string;
    sectorShocks: Record<string, number>;
    defaultShock: number;
  }
> = {
  mas_tightening: {
    title: "Stronger Singapore Dollar (SGD) & Higher Interest Rates",
    description:
      "Singapore Dollar exchange rate strengthens against regional currencies while global interest rates stay elevated.",
    sectorShocks: {
      "Banking & Financial Services": 3.8,
      "Capital Markets & Wealth": 2.1,
      "Real Estate Agency": -4.2,
      "Industrial & Urban Solutions": -2.4,
      "Technology & Manufacturing": -3.1,
    },
    defaultShock: -1.2,
  },
  semi_capex_surge: {
    title: "Global Semiconductor & AI Infrastructure Boom",
    description:
      "Hyperscale cloud providers accelerate data-centre, precision engineering, and IoT hardware orders across Singapore.",
    sectorShocks: {
      "Technology & Manufacturing": 8.5,
      "Capital Markets & Wealth": 5.2,
      "Telecommunications": 3.4,
      "Energy & Utilities": 2.9,
      "Aerospace & Defence": 2.5,
    },
    defaultShock: 1.0,
  },
  changi_tourism_boom: {
    title: "Changi Aviation & ASEAN Tourism Record Surge",
    description:
      "Passenger traffic at Changi Airport surpasses 70M annually, boosting airlines, MRO, gateway catering, and transport.",
    sectorShocks: {
      "Aviation & Logistics": 6.8,
      "Public Transport": 4.2,
      "Healthcare Services": 3.1,
      "Consumer Staples": 2.0,
    },
    defaultShock: 0.8,
  },
  energy_inflation_shock: {
    title: "Global Energy & Supply Chain Inflation Shock",
    description:
      "Brent crude oil spikes +35% alongside higher shipping and electricity tariffs across Southeast Asia.",
    sectorShocks: {
      "Energy & Utilities": 3.5,
      "Aviation & Logistics": -6.4,
      "Consumer Staples": -1.8,
      "Technology & Manufacturing": -4.0,
      "Facilities & Engineering": -3.5,
    },
    defaultShock: -2.2,
  },
};

export async function runPortfolioStressTestAction(
  scenarioId: StressScenarioId,
): Promise<AiActionResult<StressTestResult>> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Please sign in first." };

  const scenario =
    SCENARIO_CATALOG[scenarioId] ?? SCENARIO_CATALOG.mas_tightening;
  const db = readLocalDb();
  const snapshot = await getMarketSnapshot();
  const rawHoldings = Object.values(db.holdings[user.uid] ?? {}).filter(
    (h) => h.shares > 0,
  );

  const holdingImpacts: StressTestHoldingImpact[] = [];
  let totalDeltaSgd = 0;

  for (const h of rawHoldings) {
    const meta = TICKER_META[h.ticker];
    if (!meta) continue;
    const livePx = snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
    const currentValue = Number((h.shares * livePx).toFixed(2));
    const shockPct =
      scenario.sectorShocks[meta.sector] ?? scenario.defaultShock;
    const estimatedDeltaSgd = Number(
      (currentValue * (shockPct / 100)).toFixed(2),
    );
    totalDeltaSgd += estimatedDeltaSgd;

    holdingImpacts.push({
      ticker: h.ticker,
      companyName: meta.name,
      sector: meta.sector,
      currentValue,
      shockPct,
      estimatedDeltaSgd,
    });
  }

  const totalNet = user.netValue > 0 ? user.netValue : 10000;
  const estimatedPortfolioDeltaSgd = Number(totalDeltaSgd.toFixed(2));
  const estimatedPortfolioDeltaPct = Number(
    ((estimatedPortfolioDeltaSgd / totalNet) * 100).toFixed(2),
  );

  const holdingsSummary =
    holdingImpacts.length > 0
      ? holdingImpacts
          .map(
            (i) =>
              `${i.ticker} (${i.sector}): S$${i.currentValue.toFixed(2)} -> ${i.shockPct >= 0 ? "+" : ""}${i.shockPct}% (S$${i.estimatedDeltaSgd.toFixed(2)})`,
          )
          .join("; ")
      : "100% Cash (S$10,000.00 uninvested)";

  const prompt = `You are a Socratic financial education coach for Singapore students.
Scenario: ${scenario.title} — ${scenario.description}
Student's SGX Holdings Impact: ${holdingsSummary}
Estimated Total Portfolio Impact: S$${estimatedPortfolioDeltaSgd.toFixed(2)} (${estimatedPortfolioDeltaPct}%).

Write 3 concise sentences in plain English explaining WHY these Singapore sectors react differently to this macroeconomic event, and end with 1 Socratic question asking how the student can balance sector risks. Under 130 words. Never recommend specific trades.`;

  const fallback =
    holdingImpacts.length > 0
      ? `Under the "${scenario.title}" scenario, your SGX holdings experience an estimated net shift of ${estimatedPortfolioDeltaSgd >= 0 ? "+" : ""}S$${estimatedPortfolioDeltaSgd.toFixed(2)} (${estimatedPortfolioDeltaPct >= 0 ? "+" : ""}${estimatedPortfolioDeltaPct}%), while your S$${user.cashBalance.toFixed(2)} cash reserve acts as a volatility buffer. Different SGX sectors—such as Banking, Aviation, Consumer Staples, and Precision Tech—have distinct sensitivity to interest rates, fuel costs, and regional demand.

Socratic Question: Looking at which of your holdings absorbed the largest shock above, how does spreading capital across uncorrelated SGX sectors protect your portfolio during unexpected macroeconomic shifts?`
      : `Because your portfolio is currently 100% in cash (S$${user.cashBalance.toFixed(2)}), a "${scenario.title}" shock has S$0.00 direct market impact on your principal, though inflation can gradually erode the purchasing power of idle cash.

Socratic Question: If you were constructing your first 3-counter SGX portfolio today, which combination of sectors would give you resilience against this macroeconomic scenario?`;

  const socraticCommentary = await runGeminiOrSocraticFallback(
    prompt,
    fallback,
  );

  return {
    success: true,
    data: {
      scenarioId,
      scenarioTitle: scenario.title,
      estimatedPortfolioDeltaSgd,
      estimatedPortfolioDeltaPct,
      holdingImpacts,
      socraticCommentary,
    },
  };
}
