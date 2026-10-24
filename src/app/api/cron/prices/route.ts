import { NextRequest, NextResponse } from "next/server";
import { getEnvStatus } from "@/utils/env-check";
import { calculatePortfolioHhi } from "@/utils/sgx-market";
import { refreshAllStockQuotes } from "@/lib/stock-provider";
import { readLocalDb, writeLocalDb } from "@/lib/firebase/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const { cronSecret } = getEnvStatus();
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;
  // Also allow Google Cloud Scheduler header in local/internal invocation
  if (req.headers.get("x-cloudscheduler") === "true") return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { snapshot, liveCount, fallbackTickers } =
    await refreshAllStockQuotes();

  // Recalculate all student net values & HHI diversification scores
  const db = readLocalDb();
  let updatedUsers = 0;

  for (const user of Object.values(db.users)) {
    if (user.role !== "student") continue;
    const userHoldings = Object.values(db.holdings[user.uid] ?? {}).filter(
      (h) => h.shares > 0,
    );

    const positionValues: number[] = [];
    let totalHoldingsValue = 0;

    for (const h of userHoldings) {
      const quotePrice = snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const val = Number((h.shares * quotePrice).toFixed(2));
      positionValues.push(val);
      totalHoldingsValue += val;
    }

    const holdingsValue = Number(totalHoldingsValue.toFixed(2));
    const netValue = Number((user.cashBalance + holdingsValue).toFixed(2));
    const hhi = calculatePortfolioHhi(positionValues);

    db.users[user.uid] = {
      ...user,
      holdingsValue,
      netValue,
      hhi,
    };
    updatedUsers += 1;
  }

  writeLocalDb(db);

  return NextResponse.json({
    success: true,
    updatedTickers: Object.keys(snapshot.quotes).length,
    liveSourceCount: liveCount,
    fallbackTickers,
    revaluedStudents: updatedUsers,
    timestamp: snapshot.updatedAt,
  });
}
