import { NextRequest, NextResponse } from "next/server";
import { getEnvStatus } from "@/utils/env-check";
import { readLocalDb, writeLocalDb } from "@/lib/firebase/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const { cronSecret } = getEnvStatus();
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-cloudscheduler") === "true") return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = readLocalDb();
  const now = new Date().toISOString();
  const semester = db.appSettings.currentSemester || "2026-S2";
  let recorded = 0;

  for (const user of Object.values(db.users)) {
    if (user.role !== "student") continue;
    db.portfolioHistory.push({
      id: `snap-${user.uid}-${Date.now()}-${recorded}`,
      userId: user.uid,
      netValue: user.netValue,
      cashBalance: user.cashBalance,
      holdingsValue: user.holdingsValue,
      recordedAt: now,
      semester,
    });
    recorded += 1;
  }

  // Purge snapshots older than 365 days
  const cutoff = Date.now() - 365 * 86400000;
  db.portfolioHistory = db.portfolioHistory.filter(
    (s) => new Date(s.recordedAt).getTime() >= cutoff,
  );

  writeLocalDb(db);

  return NextResponse.json({
    success: true,
    snapshotsRecorded: recorded,
    timestamp: now,
  });
}
