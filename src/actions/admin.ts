"use server";

import { revalidatePath } from "next/cache";
import type {
  AppSettingsDoc,
  ClassGroupDoc,
  UserRole,
  WeeklyChallengeDoc,
} from "@/types/firestore";
import {
  getServerSessionUser,
  provisionOrLoadUser,
} from "@/lib/firebase/auth-session";
import {
  readLocalDb,
  updateAppSettings,
  writeLocalDb,
} from "@/lib/firebase/store";
import { refreshAllStockQuotes } from "@/lib/stock-provider";
import { TICKER_META } from "@/utils/tickers";

export interface AdminActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

async function requireTeacherOrAdmin(
  allowed: Array<"teacher" | "superadmin"> = ["teacher", "superadmin"],
): Promise<
  | { ok: true; uid: string; role: "teacher" | "superadmin" }
  | { ok: false; error: string }
> {
  const user = await getServerSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (user.role !== "teacher" && user.role !== "superadmin") {
    return { ok: false, error: "Not authorised. Teacher or Superadmin role required." };
  }
  if (!allowed.includes(user.role)) {
    return { ok: false, error: "Superadmin privileges required for this action." };
  }
  return { ok: true, uid: user.uid, role: user.role };
}

export async function updateExchangeSettingsAction(
  patch: Partial<AppSettingsDoc>,
): Promise<AdminActionResponse<AppSettingsDoc>> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const updated = await updateAppSettings(patch);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");

  return { success: true, data: updated };
}

export async function setClassTradingLockAction(
  classId: string,
  locked: boolean,
): Promise<AdminActionResponse<{ updatedCount: number }>> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  let updatedCount = 0;

  for (const u of Object.values(db.users)) {
    if (
      u.role === "student" &&
      (classId === "ALL" || u.classGroupIds.includes(classId))
    ) {
      db.users[u.uid] = { ...u, tradingLocked: locked };
      updatedCount += 1;
    }
  }
  writeLocalDb(db);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true, data: { updatedCount } };
}

export async function resetSingleStudentAction(
  targetUid: string,
): Promise<AdminActionResponse> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  const target = db.users[targetUid];
  if (!target) return { success: false, error: "Student account not found." };

  db.holdings[targetUid] = {};
  db.tradeHistory = db.tradeHistory.filter((t) => t.userId !== targetUid);
  db.limitOrders = db.limitOrders.filter((o) => o.userId !== targetUid);
  db.portfolioHistory = db.portfolioHistory.filter(
    (p) => p.userId !== targetUid,
  );
  db.users[targetUid] = {
    ...target,
    cashBalance: 10000,
    holdingsValue: 0,
    netValue: 10000,
    totalFeesPaid: 0,
    hhi: 1,
    coolingOffUntil: null,
    achievements: {},
    achievementCount: 0,
  };

  writeLocalDb(db);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: true };
}

export async function resetAllStudentsAction(): Promise<
  AdminActionResponse<{ count: number }>
> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  let count = 0;

  for (const u of Object.values(db.users)) {
    if (u.role !== "student") continue;
    db.holdings[u.uid] = {};
    db.users[u.uid] = {
      ...u,
      cashBalance: 10000,
      holdingsValue: 0,
      netValue: 10000,
      totalFeesPaid: 0,
      hhi: 1,
      coolingOffUntil: null,
      achievements: {},
      achievementCount: 0,
    };
    count += 1;
  }

  db.tradeHistory = [];
  db.limitOrders = [];
  db.portfolioHistory = [];
  writeLocalDb(db);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: true, data: { count } };
}

export async function createClassGroupAction(args: {
  name: string;
  joinCode: string;
  semester: string;
}): Promise<AdminActionResponse<ClassGroupDoc>> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const cleanName = args.name.trim();
  const cleanCode =
    args.joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ||
    `SGX${Math.floor(100 + Math.random() * 900)}`;

  if (!cleanName) {
    return { success: false, error: "Class group name is required." };
  }

  const db = readLocalDb();
  const newClass: ClassGroupDoc = {
    id: `class-${Date.now()}`,
    name: cleanName,
    joinCode: cleanCode,
    teacherId: gate.uid,
    semester: args.semester.trim() || "2026-S2",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.classGroups[newClass.id] = newClass;
  writeLocalDb(db);

  revalidatePath("/admin");
  return { success: true, data: newClass };
}

export async function createWeeklyChallengeAction(args: {
  classGroupId: string;
  title: string;
  description: string;
  weekStart: string;
  weekEnd: string;
}): Promise<AdminActionResponse<WeeklyChallengeDoc>> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  if (!args.title.trim() || !args.description.trim()) {
    return {
      success: false,
      error: "Both challenge title and description are required.",
    };
  }

  const db = readLocalDb();
  const doc: WeeklyChallengeDoc = {
    id: `challenge-${Date.now()}`,
    classGroupId: args.classGroupId,
    title: args.title.trim(),
    description: args.description.trim(),
    weekStart: args.weekStart,
    weekEnd: args.weekEnd,
    createdBy: gate.uid,
    createdAt: new Date().toISOString(),
  };

  db.weeklyChallenges[doc.id] = doc;
  writeLocalDb(db);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true, data: doc };
}

export async function updateUserRoleAction(
  targetUid: string,
  newRole: UserRole,
): Promise<AdminActionResponse> {
  const gate = await requireTeacherOrAdmin(["superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  if (targetUid === gate.uid) {
    return { success: false, error: "You cannot change your own Superadmin role." };
  }

  const db = readLocalDb();
  const target = db.users[targetUid];
  if (!target) return { success: false, error: "User not found." };

  db.users[targetUid] = { ...target, role: newRole };
  writeLocalDb(db);

  revalidatePath("/admin");
  return { success: true };
}

export interface GoogleSheetsImportRow {
  email: string;
  nickname: string;
  classNameOrCode: string;
  role?: UserRole;
}

export interface GoogleSheetsImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ email: string; message: string }>;
}

/**
 * Fixes Legacy Bug #4: Cleanly imports Google Workspace / Gmail rosters from
 * Google Sheets CSV/TSV without querying non-existent columns.
 */
export async function importGoogleWorkspaceRosterAction(
  rows: GoogleSheetsImportRow[],
): Promise<AdminActionResponse<GoogleSheetsImportResult>> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  const classes = Object.values(db.classGroups).filter((c) => c.isActive);

  const result: GoogleSheetsImportResult = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const row of rows) {
    const email = (row.email ?? "").trim().toLowerCase();
    const nickname = (row.nickname ?? "").trim();
    const classRef = (row.classNameOrCode ?? "").trim();
    const role: UserRole = row.role ?? "student";

    if (!email || !email.includes("@")) {
      result.failed += 1;
      result.errors.push({ email: email || "(blank)", message: "Invalid Google email." });
      continue;
    }

    const matchedClass =
      classes.find(
        (c) =>
          c.name.toLowerCase() === classRef.toLowerCase() ||
          c.joinCode.toUpperCase() === classRef.toUpperCase(),
      ) ?? classes[0];

    const classId = matchedClass?.id ?? "class-sec4-express-a";

    // Pre-authorize for future Google OAuth logins
    db.preauthorizedUsers[email] = {
      email,
      role,
      nickname: nickname || email.split("@")[0],
      classGroupId: classId,
      createdAt: new Date().toISOString(),
    };

    const existing = Object.values(db.users).find(
      (u) => u.email.toLowerCase() === email,
    );

    if (existing) {
      const mergedClasses = existing.classGroupIds.includes(classId)
        ? existing.classGroupIds
        : [...existing.classGroupIds, classId];
      db.users[existing.uid] = {
        ...existing,
        nickname: nickname || existing.nickname,
        role,
        classGroupIds: mergedClasses,
      };
      result.updated += 1;
    } else {
      writeLocalDb(db);
      const createdUser = await provisionOrLoadUser({
        uid: `gmail-${email.replace(/[^a-z0-9]/g, "-")}`,
        email,
        displayName: nickname || email.split("@")[0],
      });
      db.users[createdUser.uid] = createdUser;
      if (!db.holdings[createdUser.uid]) {
        db.holdings[createdUser.uid] = {};
      }
      result.created += 1;
    }
  }

  writeLocalDb(db);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");

  return { success: true, data: result };
}

export async function adminTriggerMarketSyncAction(): Promise<
  AdminActionResponse<{
    liveCount: number;
    fallbackCount: number;
    timestamp: string;
  }>
> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const res = await refreshAllStockQuotes();
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    success: true,
    data: {
      liveCount: res.liveCount,
      fallbackCount: res.fallbackTickers.length,
      timestamp: res.snapshot.updatedAt,
    },
  };
}

export async function adminTakePortfolioSnapshotsAction(): Promise<
  AdminActionResponse<{ count: number; timestamp: string }>
> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  const now = new Date().toISOString();
  let count = 0;

  for (const u of Object.values(db.users)) {
    if (u.role !== "student") continue;
    db.portfolioHistory.push({
      id: `snap-manual-${u.uid}-${Date.now()}-${count}`,
      userId: u.uid,
      netValue: u.netValue,
      cashBalance: u.cashBalance,
      holdingsValue: u.holdingsValue,
      recordedAt: now,
      semester: db.appSettings.currentSemester || "2026-S2",
    });
    count += 1;
  }

  writeLocalDb(db);
  revalidatePath("/portfolio");
  revalidatePath("/admin");

  return { success: true, data: { count, timestamp: now } };
}

export async function distributeClassDividendsAction(
  classId = "ALL",
): Promise<
  AdminActionResponse<{
    studentsCredited: number;
    totalDividendSgd: number;
    timestamp: string;
  }>
> {
  const gate = await requireTeacherOrAdmin(["teacher", "superadmin"]);
  if (!gate.ok) return { success: false, error: gate.error };

  const db = readLocalDb();
  const now = new Date().toISOString();
  let studentsCredited = 0;
  let totalDividendSgd = 0;

  for (const u of Object.values(db.users)) {
    if (u.role !== "student") continue;
    if (classId !== "ALL" && !u.classGroupIds.includes(classId)) continue;

    const userHoldings = Object.values(db.holdings[u.uid] ?? {}).filter(
      (h) => h.shares > 0,
    );
    if (userHoldings.length === 0) continue;

    let studentDividend = 0;
    for (const h of userHoldings) {
      const meta = TICKER_META[h.ticker];
      if (!meta || meta.dividendYieldPct <= 0) continue;
      const quotePx = db.marketSnapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const positionVal = h.shares * quotePx;
      // Quarterly Singapore Tier-1 Tax-Exempt Dividend (Annual Yield / 4)
      const quarterlyDiv = positionVal * (meta.dividendYieldPct / 100 / 4);
      studentDividend += quarterlyDiv;
    }

    const roundedDiv = Number(studentDividend.toFixed(2));
    if (roundedDiv <= 0) continue;

    u.cashBalance = Number((u.cashBalance + roundedDiv).toFixed(2));
    u.netValue = Number((u.cashBalance + u.holdingsValue).toFixed(2));
    db.users[u.uid] = u;
    studentsCredited += 1;
    totalDividendSgd = Number((totalDividendSgd + roundedDiv).toFixed(2));
  }

  writeLocalDb(db);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");

  return {
    success: true,
    data: {
      studentsCredited,
      totalDividendSgd,
      timestamp: now,
    },
  };
}
