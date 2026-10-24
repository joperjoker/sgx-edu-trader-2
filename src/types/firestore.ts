export type UserRole = "student" | "teacher" | "superadmin";

export type LeaderboardMode = "anonymous" | "named";
export type StockDataProvider = "yahoo" | "twelvedata";
export type FeeMode = "sgx_realistic" | "flat_10";
export type OrderType = "market" | "limit";
export type TradeAction = "buy" | "sell";
export type ChartTimeframe = "1D" | "5D" | "1M" | "6M" | "1Y";

export interface AppSettingsDoc {
  leaderboardMode: LeaderboardMode;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  schoolName: string;
  currentSemester: string;
  stockDataProvider: StockDataProvider;
  allowOddLots: boolean;
  strictExchangeHours: boolean;
  feeMode: FeeMode;
}

export interface LiveQuoteItem {
  ticker: string;
  name: string;
  shortName: string;
  tier: string;
  sector: string;
  price: number;
  prevClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  change: number;
  changePct: number;
  volume: number;
  bid: number;
  ask: number;
  tickSize: number;
  boardLot: number;
  sparkline: number[];
  isLive: boolean;
  updatedAt: string;
}

export interface MarketLiveSnapshotDoc {
  updatedAt: string;
  isLive: boolean;
  quotes: Record<string, LiveQuoteItem>;
}

export interface OhlcvCandle {
  time: number; // Unix timestamp in seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCandlesDoc {
  ticker: string;
  range: ChartTimeframe;
  updatedAt: string;
  candles: OhlcvCandle[];
}

export interface UserProfileDoc {
  uid: string;
  email: string;
  nickname: string;
  photoURL: string | null;
  role: UserRole;
  classGroupIds: string[];
  startingCapital: number;
  cashBalance: number;
  holdingsValue: number;
  netValue: number;
  totalFeesPaid: number;
  hhi: number;
  tradingLocked: boolean;
  coolingOffUntil: string | null;
  hasCompletedTutorial: boolean;
  acceptedTermsAt: string | null;
  achievementCount: number;
  achievements: Record<string, string>; // key -> ISO timestamp
  createdAt: string;
  lastLoginAt: string;
}

export interface HoldingDoc {
  ticker: string;
  shares: number;
  avgPrice: number;
  updatedAt: string;
}

export interface TradeHistoryDoc {
  id: string;
  userId: string;
  userEmail: string;
  userNickname: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  orderType: OrderType;
  shares: number;
  executionPrice: number;
  limitPrice: number | null;
  grossAmount: number;
  brokerageFee: number;
  clearingFee: number;
  sgxTradingFee: number;
  gstAmount: number;
  totalFee: number;
  netTotal: number;
  realizedPnl: number | null;
  contractNoteNo: string;
  semester: string;
  timestamp: string;
}

export interface LimitOrderDoc {
  id: string;
  userId: string;
  userEmail: string;
  userNickname: string;
  ticker: string;
  companyName: string;
  action: TradeAction;
  shares: number;
  limitPrice: number;
  status: "open" | "filled" | "cancelled";
  createdAt: string;
  filledAt: string | null;
}

export interface PortfolioSnapshotDoc {
  id: string;
  userId: string;
  netValue: number;
  cashBalance: number;
  holdingsValue: number;
  recordedAt: string;
  semester: string;
}

export interface ClassGroupDoc {
  id: string;
  name: string;
  joinCode: string;
  teacherId: string;
  semester: string;
  isActive: boolean;
  createdAt: string;
}

export interface WeeklyChallengeDoc {
  id: string;
  classGroupId: string;
  title: string;
  description: string;
  weekStart: string;
  weekEnd: string;
  createdBy: string;
  createdAt: string;
}

export interface ReflectionDoc {
  id: string;
  userId: string;
  userEmail: string;
  userNickname: string;
  classGroupId: string | null;
  weekNumber: number;
  semester: string;
  promptQuestion: string;
  responseText: string;
  updatedAt: string;
}

export interface PreauthorizedUserDoc {
  email: string;
  role: UserRole;
  nickname?: string;
  classGroupId?: string;
  createdAt: string;
}
