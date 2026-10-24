import fs from "fs";
import path from "path";
import type {
  AppSettingsDoc,
  ClassGroupDoc,
  HoldingDoc,
  LimitOrderDoc,
  LiveQuoteItem,
  MarketCandlesDoc,
  MarketLiveSnapshotDoc,
  PortfolioSnapshotDoc,
  PreauthorizedUserDoc,
  ReflectionDoc,
  TradeHistoryDoc,
  UserProfileDoc,
  WeeklyChallengeDoc,
} from "@/types/firestore";
import { TICKER_META, VALID_TICKERS } from "@/utils/tickers";
import {
  calculateAdminBidAsk,
  generateDeterministicSparkline,
  getSgxTickSize,
} from "@/utils/sgx-market";
import { getAdminDb, isLiveFirestoreReady } from "./admin";

export interface LocalDbSchema {
  appSettings: AppSettingsDoc;
  marketSnapshot: MarketLiveSnapshotDoc;
  marketCandles: Record<string, MarketCandlesDoc>;
  users: Record<string, UserProfileDoc>;
  holdings: Record<string, Record<string, HoldingDoc>>; // userId -> ticker -> HoldingDoc
  tradeHistory: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
  portfolioHistory: PortfolioSnapshotDoc[];
  classGroups: Record<string, ClassGroupDoc>;
  weeklyChallenges: Record<string, WeeklyChallengeDoc>;
  reflections: Record<string, ReflectionDoc>;
  preauthorizedUsers: Record<string, PreauthorizedUserDoc>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "firestore-local.json");

function buildDefaultSnapshot(): MarketLiveSnapshotDoc {
  const now = new Date().toISOString();
  const quotes: Record<string, LiveQuoteItem> = {};
  for (const ticker of VALID_TICKERS) {
    const meta = TICKER_META[ticker];
    const price = meta.refPrice;
    const changePct = meta.refChangePct;
    const prevClose = Number((price / (1 + changePct / 100)).toFixed(3));
    const change = Number((price - prevClose).toFixed(3));
    const tickSize = getSgxTickSize(price);
    const { bid, ask } = calculateAdminBidAsk(price, tickSize);
    const dayHigh = Number((Math.max(price, prevClose) + tickSize * 3).toFixed(3));
    const dayLow = Number(
      Math.max(tickSize, Math.min(price, prevClose) - tickSize * 3).toFixed(3),
    );
    quotes[ticker] = {
      ticker,
      name: meta.name,
      shortName: meta.shortName,
      tier: meta.tier,
      sector: meta.sector,
      price,
      prevClose,
      open: prevClose,
      dayHigh,
      dayLow,
      change,
      changePct,
      volume: meta.refVolume,
      bid,
      ask,
      tickSize,
      boardLot: meta.boardLot,
      sparkline: generateDeterministicSparkline(ticker, price, changePct),
      isLive: false,
      updatedAt: now,
    };
  }
  return {
    updatedAt: now,
    isLive: false,
    quotes,
  };
}

function buildInitialDb(): LocalDbSchema {
  const now = new Date().toISOString();
  const snapshot = buildDefaultSnapshot();

  const defaultClassId = "class-sec4-express-a";
  const defaultClass: ClassGroupDoc = {
    id: defaultClassId,
    name: "Sec 4 Financial Literacy (4E1)",
    joinCode: "SGX4E1",
    teacherId: "user-teacher-1",
    semester: "2026-S2",
    isActive: true,
    createdAt: now,
  };

  const secondClassId = "class-jc1-econ-b";
  const secondClass: ClassGroupDoc = {
    id: secondClassId,
    name: "JC1 Economics & Markets (26S03)",
    joinCode: "SGXJC1",
    teacherId: "user-teacher-1",
    semester: "2026-S2",
    isActive: true,
    createdAt: now,
  };

  const today = new Date();
  const weekStart = new Date(today.getTime() - 2 * 86400000)
    .toISOString()
    .slice(0, 10);
  const weekEnd = new Date(today.getTime() + 5 * 86400000)
    .toISOString()
    .slice(0, 10);

  const defaultChallenge: WeeklyChallengeDoc = {
    id: "challenge-week-1",
    classGroupId: defaultClassId,
    title: "Cross-Tier Portfolio Construction Challenge",
    description:
      "Build a balanced SGX portfolio across at least 3 different Risk Tiers (e.g., Safe Bets + Industry Giants + Everyday Brands) while keeping brokerage & CDP clearing fees below 1.2% of your total invested capital.",
    weekStart,
    weekEnd,
    createdBy: "user-teacher-1",
    createdAt: now,
  };

  const demoUsers: Record<string, UserProfileDoc> = {
    "user-superadmin-1": {
      uid: "user-superadmin-1",
      email: "admin@sgxedu.sg",
      nickname: "Dr. Tan (Superadmin)",
      photoURL: null,
      role: "superadmin",
      classGroupIds: [defaultClassId, secondClassId],
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
    },
    "user-teacher-1": {
      uid: "user-teacher-1",
      email: "teacher@sgxedu.sg",
      nickname: "Ms. Rachel Lim (HOD)",
      photoURL: null,
      role: "teacher",
      classGroupIds: [defaultClassId, secondClassId],
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
    },
    "user-student-1": {
      uid: "user-student-1",
      email: "student1@gmail.com",
      nickname: "Ryan Koh",
      photoURL: null,
      role: "student",
      classGroupIds: [defaultClassId],
      startingCapital: 10000,
      cashBalance: 4131.78,
      holdingsValue: 6169.0,
      netValue: 10300.78,
      totalFeesPaid: 33.42,
      hhi: 0.36,
      tradingLocked: false,
      coolingOffUntil: null,
      hasCompletedTutorial: true,
      acceptedTermsAt: now,
      achievementCount: 3,
      achievements: {
        first_trade: now,
        diversified: now,
        first_profit: now,
      },
      createdAt: now,
      lastLoginAt: now,
    },
    "user-student-2": {
      uid: "user-student-2",
      email: "chloe.ng@gmail.com",
      nickname: "Chloe Ng",
      photoURL: null,
      role: "student",
      classGroupIds: [defaultClassId],
      startingCapital: 10000,
      cashBalance: 5210.4,
      holdingsValue: 5012.0,
      netValue: 10222.4,
      totalFeesPaid: 22.1,
      hhi: 0.38,
      tradingLocked: false,
      coolingOffUntil: null,
      hasCompletedTutorial: true,
      acceptedTermsAt: now,
      achievementCount: 2,
      achievements: {
        first_trade: now,
        diversified: now,
      },
      createdAt: now,
      lastLoginAt: now,
    },
    "user-student-3": {
      uid: "user-student-3",
      email: "aarav.sharma@gmail.com",
      nickname: "Aarav Sharma",
      photoURL: null,
      role: "student",
      classGroupIds: [defaultClassId],
      startingCapital: 10000,
      cashBalance: 6410.0,
      holdingsValue: 3718.0,
      netValue: 10128.0,
      totalFeesPaid: 21.8,
      hhi: 0.48,
      tradingLocked: false,
      coolingOffUntil: null,
      hasCompletedTutorial: true,
      acceptedTermsAt: now,
      achievementCount: 2,
      achievements: {
        first_trade: now,
        fast_mover: now,
      },
      createdAt: now,
      lastLoginAt: now,
    },
    "user-student-4": {
      uid: "user-student-4",
      email: "nurul.aisyah@gmail.com",
      nickname: "Nurul Aisyah",
      photoURL: null,
      role: "student",
      classGroupIds: [defaultClassId],
      startingCapital: 10000,
      cashBalance: 7120.5,
      holdingsValue: 2790.0,
      netValue: 9910.5,
      totalFeesPaid: 43.6,
      hhi: 0.55,
      tradingLocked: false,
      coolingOffUntil: null,
      hasCompletedTutorial: true,
      acceptedTermsAt: now,
      achievementCount: 1,
      achievements: {
        first_trade: now,
      },
      createdAt: now,
      lastLoginAt: now,
    },
  };

  const holdings: Record<string, Record<string, HoldingDoc>> = {
    "user-student-1": {
      "D05.SI": {
        ticker: "D05.SI",
        shares: 100,
        avgPrice: 34.2,
        updatedAt: now,
      },
      "S68.SI": {
        ticker: "S68.SI",
        shares: 100,
        avgPrice: 10.15,
        updatedAt: now,
      },
      "OV8.SI": {
        ticker: "OV8.SI",
        shares: 1000,
        avgPrice: 1.54,
        updatedAt: now,
      },
    },
    "user-student-2": {
      "O39.SI": {
        ticker: "O39.SI",
        shares: 200,
        avgPrice: 13.9,
        updatedAt: now,
      },
      "C6L.SI": {
        ticker: "C6L.SI",
        shares: 200,
        avgPrice: 6.65,
        updatedAt: now,
      },
      "AIY.SI": {
        ticker: "AIY.SI",
        shares: 100,
        avgPrice: 8.42,
        updatedAt: now,
      },
    },
    "user-student-3": {
      "U11.SI": {
        ticker: "U11.SI",
        shares: 100,
        avgPrice: 32.1,
        updatedAt: now,
      },
      "C52.SI": {
        ticker: "C52.SI",
        shares: 300,
        avgPrice: 1.4,
        updatedAt: now,
      },
    },
  };

  const pastDays = [6, 5, 4, 3, 2, 1, 0];
  const student1Curve = [10000, 9985, 10060, 10120, 10095, 10215, 10300.78];
  const portfolioHistory: PortfolioSnapshotDoc[] = pastDays.map((d, idx) => {
    const stamp = new Date(Date.now() - d * 86400000).toISOString();
    const net = student1Curve[idx];
    return {
      id: `snap-s1-${idx}`,
      userId: "user-student-1",
      netValue: net,
      cashBalance: 4131.78,
      holdingsValue: Number((net - 4131.78).toFixed(2)),
      recordedAt: stamp,
      semester: "2026-S2",
    };
  });

  const tradeHistory: TradeHistoryDoc[] = [
    {
      id: "trd-1001",
      userId: "user-student-1",
      userEmail: "student1@gmail.com",
      userNickname: "Ryan Koh",
      ticker: "D05.SI",
      companyName: "DBS Group Holdings Ltd",
      action: "buy",
      orderType: "market",
      shares: 100,
      executionPrice: 34.2,
      limitPrice: null,
      grossAmount: 3420.0,
      brokerageFee: 10.0,
      clearingFee: 1.11,
      sgxTradingFee: 0.26,
      gstAmount: 1.02,
      totalFee: 12.39,
      netTotal: 3432.39,
      realizedPnl: null,
      contractNoteNo: "SGX-CN-20261018-8821",
      semester: "2026-S2",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "trd-1002",
      userId: "user-student-1",
      userEmail: "student1@gmail.com",
      userNickname: "Ryan Koh",
      ticker: "S68.SI",
      companyName: "Singapore Exchange Ltd",
      action: "buy",
      orderType: "limit",
      shares: 100,
      executionPrice: 10.15,
      limitPrice: 10.15,
      grossAmount: 1015.0,
      brokerageFee: 10.0,
      clearingFee: 0.33,
      sgxTradingFee: 0.08,
      gstAmount: 0.94,
      totalFee: 11.35,
      netTotal: 1026.35,
      realizedPnl: null,
      contractNoteNo: "SGX-CN-20261020-4419",
      semester: "2026-S2",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "trd-1003",
      userId: "user-student-1",
      userEmail: "student1@gmail.com",
      userNickname: "Ryan Koh",
      ticker: "OV8.SI",
      companyName: "Sheng Siong Group Ltd",
      action: "buy",
      orderType: "market",
      shares: 1000,
      executionPrice: 1.54,
      limitPrice: null,
      grossAmount: 1540.0,
      brokerageFee: 10.0,
      clearingFee: 0.5,
      sgxTradingFee: 0.12,
      gstAmount: 0.96,
      totalFee: 11.58,
      netTotal: 1551.58,
      realizedPnl: null,
      contractNoteNo: "SGX-CN-20261022-9104",
      semester: "2026-S2",
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const reflections: Record<string, ReflectionDoc> = {
    "refl-student-1-w43": {
      id: "refl-student-1-w43",
      userId: "user-student-1",
      userEmail: "student1@gmail.com",
      userNickname: "Ryan Koh",
      classGroupId: defaultClassId,
      weekNumber: 43,
      semester: "2026-S2",
      promptQuestion:
        "Review your trades this week. Did you diversify across risk tiers, and how did SGX brokerage + CDP clearing fees affect your net return?",
      responseText:
        "I allocated across 3 tiers: DBS (Safe Bets), SGX Group (Industry Giants), and Sheng Siong (Everyday Brands). Buying in 100-share board lots kept my fee ratio around 0.6% of each trade.",
      updatedAt: now,
    },
  };

  return {
    appSettings: {
      leaderboardMode: "named",
      maintenanceMode: false,
      maintenanceMessage:
        "SGX Edu-Trader 2.0 is undergoing scheduled exchange maintenance. Please check back shortly.",
      schoolName:
        process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Singapore Academy of Finance",
      currentSemester: "2026-S2",
      stockDataProvider: "yahoo",
      allowOddLots: false,
      strictExchangeHours: false,
      feeMode: "sgx_realistic",
    },
    marketSnapshot: snapshot,
    marketCandles: {},
    users: demoUsers,
    holdings,
    tradeHistory,
    limitOrders: [],
    portfolioHistory,
    classGroups: {
      [defaultClassId]: defaultClass,
      [secondClassId]: secondClass,
    },
    weeklyChallenges: {
      [defaultChallenge.id]: defaultChallenge,
    },
    reflections,
    preauthorizedUsers: {
      "medthilda.teo.qing.cong@gmail.com": {
        email: "medthilda.teo.qing.cong@gmail.com",
        role: "superadmin",
        nickname: "Eugene Teo (Superadmin)",
        createdAt: now,
      },
      "admin@sgxedu.sg": {
        email: "admin@sgxedu.sg",
        role: "superadmin",
        nickname: "Dr. Tan (Superadmin)",
        createdAt: now,
      },
      "teacher@sgxedu.sg": {
        email: "teacher@sgxedu.sg",
        role: "teacher",
        nickname: "Ms. Rachel Lim (HOD)",
        createdAt: now,
      },
    },
  };
}

export function readLocalDb(): LocalDbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = buildInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as LocalDbSchema;
  } catch {
    return buildInitialDb();
  }
}

export function writeLocalDb(db: LocalDbSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write local Firestore emulator state:", err);
  }
}

// Unified Data Access Layer: Uses Google Cloud Firestore when credentials exist,
// and seamlessly mirrors/falls back to Local Firestore JSON store when in local dev mode.

export async function getAppSettings(): Promise<AppSettingsDoc> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("system").doc("app_settings").get();
      if (snap.exists) {
        return { ...local.appSettings, ...(snap.data() as Partial<AppSettingsDoc>) };
      }
      await db.collection("system").doc("app_settings").set(local.appSettings);
    } catch (err) {
      console.error("Firestore getAppSettings fallback:", err);
    }
  }
  return local.appSettings;
}

export async function updateAppSettings(
  patch: Partial<AppSettingsDoc>,
): Promise<AppSettingsDoc> {
  const local = readLocalDb();
  const updated: AppSettingsDoc = { ...local.appSettings, ...patch };
  local.appSettings = updated;
  writeLocalDb(local);

  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      await db.collection("system").doc("app_settings").set(updated, { merge: true });
    } catch (err) {
      console.error("Firestore updateAppSettings error:", err);
    }
  }
  return updated;
}

export async function getMarketSnapshot(): Promise<MarketLiveSnapshotDoc> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("market").doc("live_snapshot").get();
      if (snap.exists) {
        return snap.data() as MarketLiveSnapshotDoc;
      }
      await db.collection("market").doc("live_snapshot").set(local.marketSnapshot);
    } catch (err) {
      console.error("Firestore getMarketSnapshot fallback:", err);
    }
  }
  return local.marketSnapshot;
}

export async function saveMarketSnapshot(
  snapshot: MarketLiveSnapshotDoc,
): Promise<void> {
  const local = readLocalDb();
  local.marketSnapshot = snapshot;
  writeLocalDb(local);

  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      await db.collection("market").doc("live_snapshot").set(snapshot);
    } catch (err) {
      console.error("Firestore saveMarketSnapshot error:", err);
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("users").doc(uid).get();
      if (snap.exists) {
        return snap.data() as UserProfileDoc;
      }
    } catch (err) {
      console.error("Firestore getUserProfile fallback:", err);
    }
  }
  return local.users[uid] ?? null;
}

export async function getUserByEmail(
  email: string,
): Promise<UserProfileDoc | null> {
  const clean = email.trim().toLowerCase();
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("users")
        .where("email", "==", clean)
        .limit(1)
        .get();
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfileDoc;
      }
    } catch (err) {
      console.error("Firestore getUserByEmail fallback:", err);
    }
  }
  return (
    Object.values(local.users).find((u) => u.email.toLowerCase() === clean) ??
    null
  );
}

export async function upsertUserProfile(user: UserProfileDoc): Promise<void> {
  const local = readLocalDb();
  local.users[user.uid] = user;
  if (!local.holdings[user.uid]) {
    local.holdings[user.uid] = {};
  }
  writeLocalDb(local);

  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      await db.collection("users").doc(user.uid).set(user, { merge: true });
    } catch (err) {
      console.error("Firestore upsertUserProfile error:", err);
    }
  }
}

export async function getAllUsers(): Promise<UserProfileDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("users").get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as UserProfileDoc);
      }
    } catch (err) {
      console.error("Firestore getAllUsers fallback:", err);
    }
  }
  return Object.values(local.users);
}

export async function getUserHoldings(uid: string): Promise<HoldingDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("users")
        .doc(uid)
        .collection("holdings")
        .get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as HoldingDoc)
          .filter((h) => h.shares > 0);
      }
    } catch (err) {
      console.error("Firestore getUserHoldings fallback:", err);
    }
  }
  const map = local.holdings[uid] ?? {};
  return Object.values(map).filter((h) => h.shares > 0);
}

export async function getUserTradeHistory(
  uid: string,
): Promise<TradeHistoryDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("trade_history")
        .where("userId", "==", uid)
        .get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as TradeHistoryDoc)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
      }
    } catch (err) {
      console.error("Firestore getUserTradeHistory fallback:", err);
    }
  }
  return local.tradeHistory
    .filter((t) => t.userId === uid)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export async function getAllTradeHistory(
  limitCount = 200,
): Promise<TradeHistoryDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("trade_history")
        .orderBy("timestamp", "desc")
        .limit(limitCount)
        .get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as TradeHistoryDoc);
      }
    } catch (err) {
      console.error("Firestore getAllTradeHistory fallback:", err);
    }
  }
  return [...local.tradeHistory]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limitCount);
}

export async function getUserPortfolioHistory(
  uid: string,
): Promise<PortfolioSnapshotDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("portfolio_history")
        .where("userId", "==", uid)
        .get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as PortfolioSnapshotDoc)
          .sort(
            (a, b) =>
              new Date(a.recordedAt).getTime() -
              new Date(b.recordedAt).getTime(),
          );
      }
    } catch (err) {
      console.error("Firestore getUserPortfolioHistory fallback:", err);
    }
  }
  return local.portfolioHistory
    .filter((p) => p.userId === uid)
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
}

export async function getClassGroups(): Promise<ClassGroupDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("class_groups").get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ClassGroupDoc);
      }
    } catch (err) {
      console.error("Firestore getClassGroups fallback:", err);
    }
  }
  return Object.values(local.classGroups);
}

export async function getWeeklyChallenges(): Promise<WeeklyChallengeDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("weekly_challenges").get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as WeeklyChallengeDoc);
      }
    } catch (err) {
      console.error("Firestore getWeeklyChallenges fallback:", err);
    }
  }
  return Object.values(local.weeklyChallenges);
}

export async function getUserReflections(uid: string): Promise<ReflectionDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("reflections")
        .where("userId", "==", uid)
        .get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as ReflectionDoc)
          .sort((a, b) => b.weekNumber - a.weekNumber);
      }
    } catch (err) {
      console.error("Firestore getUserReflections fallback:", err);
    }
  }
  return Object.values(local.reflections)
    .filter((r) => r.userId === uid)
    .sort((a, b) => b.weekNumber - a.weekNumber);
}

export async function getAllReflections(): Promise<ReflectionDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db.collection("reflections").get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as ReflectionDoc)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
      }
    } catch (err) {
      console.error("Firestore getAllReflections fallback:", err);
    }
  }
  return Object.values(local.reflections).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function saveReflection(doc: ReflectionDoc): Promise<void> {
  const local = readLocalDb();
  local.reflections[doc.id] = doc;
  writeLocalDb(local);

  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      await db.collection("reflections").doc(doc.id).set(doc, { merge: true });
    } catch (err) {
      console.error("Firestore saveReflection error:", err);
    }
  }
}

export async function getUserLimitOrders(uid: string): Promise<LimitOrderDoc[]> {
  const local = readLocalDb();
  if (isLiveFirestoreReady()) {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection("limit_orders")
        .where("userId", "==", uid)
        .get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as LimitOrderDoc)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
      }
    } catch (err) {
      console.error("Firestore getUserLimitOrders fallback:", err);
    }
  }
  return local.limitOrders
    .filter((o) => o.userId === uid)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
