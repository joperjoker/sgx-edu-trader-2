export type RiskTier =
  | "Safe Bets"
  | "Industry Giants"
  | "Everyday Brands"
  | "Growth & Innovation"
  | "High Risk, High Reward";

export interface SgxTickerMeta {
  ticker: string;
  sgxCode: string;
  name: string;
  shortName: string;
  tier: RiskTier;
  sector: string;
  boardLot: number;
  refPrice: number;
  refChangePct: number;
  refVolume: number;
  dividendYieldPct: number;
  marketCapB: string;
  peRatio: number;
  description: string;
  learningObjective: string;
}

export const VALID_TICKERS: string[] = [
  "D05.SI",
  "O39.SI",
  "U11.SI",
  "Z74.SI",
  "C6L.SI",
  "BN4.SI",
  "U96.SI",
  "S68.SI",
  "S58.SI",
  "S63.SI",
  "C52.SI",
  "OV8.SI",
  "BSL.SI",
  "OYY.SI",
  "S59.SI",
  "AIY.SI",
  "MZH.SI",
  "CHZ.SI",
  "8AZ.SI",
  "ITS.SI",
];

export const TICKER_META: Record<string, SgxTickerMeta> = {
  "D05.SI": {
    ticker: "D05.SI",
    sgxCode: "D05",
    name: "DBS Group Holdings Ltd",
    shortName: "DBS",
    tier: "Safe Bets",
    sector: "Financial Services",
    boardLot: 100,
    refPrice: 35.5,
    refChangePct: 0.85,
    refVolume: 3200000,
    dividendYieldPct: 5.4,
    marketCapB: "S$101.2B",
    peRatio: 10.2,
    description:
      "Southeast Asia's largest banking group by assets, providing retail, corporate, and wealth management services across 19 markets.",
    learningObjective:
      "How do changes in global interest rates (e.g., US Federal Reserve decisions) affect a commercial bank's Net Interest Margin (NIM) and share price?",
  },
  "O39.SI": {
    ticker: "O39.SI",
    sgxCode: "O39",
    name: "Oversea-Chinese Banking Corp",
    shortName: "OCBC Bank",
    tier: "Safe Bets",
    sector: "Financial Services",
    boardLot: 100,
    refPrice: 14.2,
    refChangePct: -0.42,
    refVolume: 5100000,
    dividendYieldPct: 5.6,
    marketCapB: "S$63.8B",
    peRatio: 9.6,
    description:
      "Singapore's longest-established local bank with strong franchises in banking, wealth management (Bank of Singapore), and insurance (Great Eastern).",
    learningObjective:
      "Why does owning an insurance subsidiary (Great Eastern) help diversify OCBC's earnings compared to pure lending?",
  },
  "U11.SI": {
    ticker: "U11.SI",
    sgxCode: "U11",
    name: "United Overseas Bank Ltd",
    shortName: "UOB",
    tier: "Safe Bets",
    sector: "Financial Services",
    boardLot: 100,
    refPrice: 32.8,
    refChangePct: 0.12,
    refVolume: 2800000,
    dividendYieldPct: 5.2,
    marketCapB: "S$54.9B",
    peRatio: 9.8,
    description:
      "Leading ASEAN regional bank with an extensive branch network across Singapore, Malaysia, Indonesia, Thailand, and Vietnam.",
    learningObjective:
      "Compare DBS, OCBC, and UOB: why do all three Singapore banks often move in the same direction on the same trading day?",
  },
  "Z74.SI": {
    ticker: "Z74.SI",
    sgxCode: "Z74",
    name: "Singapore Telecommunications Ltd",
    shortName: "Singtel",
    tier: "Safe Bets",
    sector: "Telecommunications",
    boardLot: 100,
    refPrice: 3.15,
    refChangePct: -0.95,
    refVolume: 12000000,
    dividendYieldPct: 4.8,
    marketCapB: "S$52.0B",
    peRatio: 18.4,
    description:
      "Asia's leading communications technology group operating 5G mobile, broadband, digital infra (Nxera), and regional associates (Airtel, Telkomsel, AIS, Optus).",
    learningObjective:
      "Why is a telecommunications provider considered a defensive stock during economic slowdowns, and how do overseas currency fluctuations affect Singtel's profits?",
  },
  "C6L.SI": {
    ticker: "C6L.SI",
    sgxCode: "C6L",
    name: "Singapore Airlines Ltd",
    shortName: "SIA",
    tier: "Safe Bets",
    sector: "Aviation & Travel",
    boardLot: 100,
    refPrice: 6.85,
    refChangePct: 1.32,
    refVolume: 4500000,
    dividendYieldPct: 5.8,
    marketCapB: "S$20.4B",
    peRatio: 7.9,
    description:
      "Singapore's flagship international carrier and Scoot low-cost airline operator, globally recognized for premium aviation service and Changi hub connectivity.",
    learningObjective:
      "Jet fuel is an airline's largest variable cost. How do sudden spikes in crude oil prices impact Singapore Airlines' profitability?",
  },
  "BN4.SI": {
    ticker: "BN4.SI",
    sgxCode: "BN4",
    name: "Keppel Ltd",
    shortName: "Keppel",
    tier: "Industry Giants",
    sector: "Infrastructure & Asset Mgmt",
    boardLot: 100,
    refPrice: 6.42,
    refChangePct: 0.31,
    refVolume: 3100000,
    dividendYieldPct: 5.1,
    marketCapB: "S$11.6B",
    peRatio: 12.5,
    description:
      "Global asset manager and operator with deep expertise in sustainability solutions spanning energy & environment, urban development, and digital connectivity (data centres).",
    learningObjective:
      "How does transitioning from heavy shipyard manufacturing to recurring asset management fees change how investors value a company like Keppel?",
  },
  "U96.SI": {
    ticker: "U96.SI",
    sgxCode: "U96",
    name: "Sembcorp Industries Ltd",
    shortName: "Sembcorp",
    tier: "Industry Giants",
    sector: "Utilities & Renewables",
    boardLot: 100,
    refPrice: 5.18,
    refChangePct: -0.19,
    refVolume: 2200000,
    dividendYieldPct: 2.5,
    marketCapB: "S$9.2B",
    peRatio: 9.9,
    description:
      "Leading energy and urban solutions provider driving the energy transition across Asia with solar, wind, energy storage, and power generation assets.",
    learningObjective:
      "What are the capital expenditure (CapEx) risks of building massive solar and wind farms across Asia?",
  },
  "S68.SI": {
    ticker: "S68.SI",
    sgxCode: "S68",
    name: "Singapore Exchange Ltd",
    shortName: "SGX Group",
    tier: "Industry Giants",
    sector: "Financial Exchanges",
    boardLot: 100,
    refPrice: 10.62,
    refChangePct: 0.19,
    refVolume: 1800000,
    dividendYieldPct: 3.4,
    marketCapB: "S$11.4B",
    peRatio: 20.1,
    description:
      "Asia's most international multi-asset market operator, running securities, fixed income, currencies, and commodities derivatives clearing and trading.",
    learningObjective:
      "Remember the clearing and trading fees you pay on every trade? How does SGX earn revenue regardless of whether stock prices go up or down?",
  },
  "S58.SI": {
    ticker: "S58.SI",
    sgxCode: "S58",
    name: "SATS Ltd",
    shortName: "SATS",
    tier: "Industry Giants",
    sector: "Aviation Gateway & Logistics",
    boardLot: 100,
    refPrice: 3.78,
    refChangePct: 0.8,
    refVolume: 6700000,
    dividendYieldPct: 1.2,
    marketCapB: "S$5.6B",
    peRatio: 24.3,
    description:
      "Global leader in air cargo handling (following the Worldwide Flight Services acquisition) and Asia's premier airline catering and ground handling provider.",
    learningObjective:
      "When a company makes a large overseas acquisition using debt, what are the rewards and financial risks for shareholders?",
  },
  "S63.SI": {
    ticker: "S63.SI",
    sgxCode: "S63",
    name: "ST Engineering Ltd",
    shortName: "ST Engineering",
    tier: "Industry Giants",
    sector: "Aerospace & Defence",
    boardLot: 100,
    refPrice: 4.48,
    refChangePct: 0.0,
    refVolume: 2300000,
    dividendYieldPct: 3.6,
    marketCapB: "S$14.0B",
    peRatio: 22.8,
    description:
      "Global technology, defence, and engineering group specializing in commercial aerospace MRO, smart city mobility, satellite communications, and defence systems.",
    learningObjective:
      "Why do investors closely watch 'Order Book Backlog' (multi-year signed contracts) when evaluating an engineering and defence company?",
  },
  "C52.SI": {
    ticker: "C52.SI",
    sgxCode: "C52",
    name: "ComfortDelGro Corporation Ltd",
    shortName: "ComfortDelGro",
    tier: "Everyday Brands",
    sector: "Land Transport",
    boardLot: 100,
    refPrice: 1.42,
    refChangePct: 0.71,
    refVolume: 4500000,
    dividendYieldPct: 4.9,
    marketCapB: "S$3.1B",
    peRatio: 15.6,
    description:
      "One of the world's largest land transport companies operating buses, rail (SBS Transit), and taxi/point-to-point fleets in Singapore, the UK, and Australia.",
    learningObjective:
      "How do ride-hailing app competitors (like Grab and Gojek) impact traditional taxi and public transport operators?",
  },
  "OV8.SI": {
    ticker: "OV8.SI",
    sgxCode: "OV8",
    name: "Sheng Siong Group Ltd",
    shortName: "Sheng Siong",
    tier: "Everyday Brands",
    sector: "Consumer Staples & Retail",
    boardLot: 100,
    refPrice: 1.68,
    refChangePct: -0.59,
    refVolume: 3800000,
    dividendYieldPct: 3.8,
    marketCapB: "S$2.5B",
    peRatio: 18.2,
    description:
      "One of Singapore's largest supermarket chains with over 70 heartland stores focused on fresh produce, value-for-money essentials, and high gross margins.",
    learningObjective:
      "Why do consumer staples (supermarkets) often perform resiliently when inflation rises and families dine out less?",
  },
  "BSL.SI": {
    ticker: "BSL.SI",
    sgxCode: "BSL",
    name: "Raffles Medical Group Ltd",
    shortName: "Raffles Medical",
    tier: "Everyday Brands",
    sector: "Healthcare Services",
    boardLot: 100,
    refPrice: 1.18,
    refChangePct: 0.85,
    refVolume: 2100000,
    dividendYieldPct: 2.9,
    marketCapB: "S$2.2B",
    peRatio: 23.1,
    description:
      "Integrated private healthcare provider operating Raffles Hospital in Singapore, specialist clinics, health insurance, and hospitals in major Chinese cities.",
    learningObjective:
      "How does Singapore's ageing population create long-term structural demand for healthcare services?",
  },
  "OYY.SI": {
    ticker: "OYY.SI",
    sgxCode: "OYY",
    name: "PropNex Limited",
    shortName: "PropNex",
    tier: "Everyday Brands",
    sector: "Real Estate Services",
    boardLot: 100,
    refPrice: 0.93,
    refChangePct: -1.06,
    refVolume: 5200000,
    dividendYieldPct: 6.2,
    marketCapB: "S$0.69B",
    peRatio: 14.1,
    description:
      "Singapore's largest listed real estate agency with over 12,000 salespersons handling HDB resale, private condominium launches, and commercial property transactions.",
    learningObjective:
      "How do government property cooling measures (like Additional Buyer's Stamp Duty) affect property transaction volumes and PropNex's commission revenue?",
  },
  "S59.SI": {
    ticker: "S59.SI",
    sgxCode: "S59",
    name: "SIA Engineering Company Ltd",
    shortName: "SIA Engineering",
    tier: "Everyday Brands",
    sector: "Aviation MRO",
    boardLot: 100,
    refPrice: 2.45,
    refChangePct: 0.41,
    refVolume: 1200000,
    dividendYieldPct: 3.3,
    marketCapB: "S$2.7B",
    peRatio: 19.5,
    description:
      "Major provider of aircraft Maintenance, Repair, and Overhaul (MRO) services in Asia-Pacific, servicing over 70 international airlines at Changi Airport.",
    learningObjective:
      "Why can an aircraft maintenance company experience steadier earnings than a passenger airline even when ticket prices fluctuate?",
  },
  "AIY.SI": {
    ticker: "AIY.SI",
    sgxCode: "AIY",
    name: "iFAST Corporation Ltd",
    shortName: "iFAST Corp",
    tier: "Growth & Innovation",
    sector: "Fintech & Wealth Tech",
    boardLot: 100,
    refPrice: 8.61,
    refChangePct: 2.34,
    refVolume: 890000,
    dividendYieldPct: 0.7,
    marketCapB: "S$2.6B",
    peRatio: 38.4,
    description:
      "Global digital banking and wealth management fintech platform (operating FSMOne and iFAST Global Bank UK) with rapidly growing Assets Under Administration (AUA).",
    learningObjective:
      "Growth stocks trade at high Price-to-Earnings (P/E) ratios because investors expect rapid future growth. Why does this make their share price more volatile?",
  },
  "MZH.SI": {
    ticker: "MZH.SI",
    sgxCode: "MZH",
    name: "Nanofilm Technologies Intl Ltd",
    shortName: "Nanofilm",
    tier: "Growth & Innovation",
    sector: "Advanced Materials & Tech",
    boardLot: 100,
    refPrice: 0.73,
    refChangePct: -3.97,
    refVolume: 2400000,
    dividendYieldPct: 0.9,
    marketCapB: "S$0.48B",
    peRatio: 45.0,
    description:
      "Deep-tech spin-off from NTU providing nanotechnology vacuum coating solutions for consumer electronics, smartphones, wearables, and hydrogen fuel cells.",
    learningObjective:
      "What is 'customer concentration risk' when a technology supplier relies heavily on one or two major smartphone brands for its revenue?",
  },
  "CHZ.SI": {
    ticker: "CHZ.SI",
    sgxCode: "CHZ",
    name: "HRnetGroup Limited",
    shortName: "HRnetGroup",
    tier: "Growth & Innovation",
    sector: "Human Resources & Staffing",
    boardLot: 100,
    refPrice: 0.64,
    refChangePct: 1.59,
    refVolume: 1800000,
    dividendYieldPct: 5.9,
    marketCapB: "S$0.63B",
    peRatio: 11.4,
    description:
      "Asia-Pacific recruitment and flexible staffing powerhouse operating brands like RecruitFirst and HRnetOne across 15 Asian cities.",
    learningObjective:
      "Why is recruitment and hiring activity considered a 'leading indicator' of whether the broader economy is expanding or contracting?",
  },
  "8AZ.SI": {
    ticker: "8AZ.SI",
    sgxCode: "8AZ",
    name: "Aztech Global Ltd",
    shortName: "Aztech Global",
    tier: "Growth & Innovation",
    sector: "IoT & Electronics Mfg",
    boardLot: 100,
    refPrice: 0.95,
    refChangePct: 0.53,
    refVolume: 980000,
    dividendYieldPct: 7.4,
    marketCapB: "S$0.73B",
    peRatio: 8.2,
    description:
      "Design and electronics manufacturer specializing in IoT smart home cameras, LED lighting, and data-communication devices with facilities in Malaysia and China.",
    learningObjective:
      "How do global supply chain shifts and manufacturing tariffs affect electronics manufacturers operating across multiple countries?",
  },
  "ITS.SI": {
    ticker: "ITS.SI",
    sgxCode: "ITS",
    name: "ISOTeam Ltd",
    shortName: "ISOTeam",
    tier: "Growth & Innovation",
    sector: "Building & Estate Upgrading",
    boardLot: 100,
    refPrice: 0.87,
    refChangePct: 0.0,
    refVolume: 320000,
    dividendYieldPct: 1.1,
    marketCapB: "S$0.12B",
    peRatio: 11.9,
    description:
      "Established Singapore building maintenance and estate upgrading specialist executing Neighbourhood Renewal Programmes (NRP), R&R, and eco-friendly facade projects.",
    learningObjective:
      "Notice the lower daily trading volume on smaller-cap stocks like ISOTeam. What is 'liquidity risk' when you want to buy or sell a large number of shares quickly?",
  },
};

export interface TierStyleMeta {
  key: string;
  tier: RiskTier;
  badgeText: string;
  shortLabel: string;
  blurb: string;
  beginnerFriendly: boolean;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  dotColor: string;
  chartColor: string;
}

export const TIER_CONFIG: Record<RiskTier, TierStyleMeta> = {
  "Safe Bets": {
    key: "safe",
    tier: "Safe Bets",
    badgeText: "Blue-Chip Safe Bets",
    shortLabel: "Safe Bets",
    blurb:
      "STI flagship banks, telco, and national carrier. High liquidity, established dividends, lower volatility.",
    beginnerFriendly: true,
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
    pillBorder: "border-blue-200",
    dotColor: "#0052FF",
    chartColor: "#0052FF",
  },
  "Industry Giants": {
    key: "giants",
    tier: "Industry Giants",
    badgeText: "Industry Giants",
    shortLabel: "Industry Giants",
    blurb:
      "Critical Singapore infrastructure, utilities, exchange operator, and aerospace engineering leaders.",
    beginnerFriendly: false,
    pillBg: "bg-indigo-50",
    pillText: "text-indigo-700",
    pillBorder: "border-indigo-200",
    dotColor: "#4F46E5",
    chartColor: "#4F46E5",
  },
  "Everyday Brands": {
    key: "everyday",
    tier: "Everyday Brands",
    badgeText: "Everyday Brands",
    shortLabel: "Everyday Brands",
    blurb:
      "Companies Singaporeans interact with daily — supermarkets, transport, clinics, and real estate.",
    beginnerFriendly: false,
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    pillBorder: "border-amber-200",
    dotColor: "#D97706",
    chartColor: "#D97706",
  },
  "Growth & Innovation": {
    key: "growth",
    tier: "Growth & Innovation",
    badgeText: "Growth & Innovation",
    shortLabel: "Growth & Innovation",
    blurb:
      "High-growth fintech, advanced nanotechnology, IoT electronics, and agile small-to-mid-cap innovators with strong catalyst potential.",
    beginnerFriendly: false,
    pillBg: "bg-purple-50",
    pillText: "text-purple-700",
    pillBorder: "border-purple-200",
    dotColor: "#9333EA",
    chartColor: "#9333EA",
  },
  "High Risk, High Reward": {
    key: "growth",
    tier: "Growth & Innovation",
    badgeText: "Growth & Innovation",
    shortLabel: "Growth & Innovation",
    blurb:
      "High-growth fintech, advanced nanotechnology, IoT electronics, and agile small-to-mid-cap innovators with strong catalyst potential.",
    beginnerFriendly: false,
    pillBg: "bg-purple-50",
    pillText: "text-purple-700",
    pillBorder: "border-purple-200",
    dotColor: "#9333EA",
    chartColor: "#9333EA",
  },
};

export const TIER_LIST: RiskTier[] = [
  "Safe Bets",
  "Industry Giants",
  "Everyday Brands",
  "Growth & Innovation",
];
