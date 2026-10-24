import { NextResponse } from "next/server";
import { getAppSettings, getMarketSnapshot } from "@/lib/firebase/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [snapshot, settings] = await Promise.all([
    getMarketSnapshot(),
    getAppSettings(),
  ]);

  return NextResponse.json({
    status: "healthy",
    cloudProvider: "Google Cloud Platform (Firestore + App Hosting)",
    marketUpdatedAt: snapshot.updatedAt,
    isLiveFeed: snapshot.isLive,
    tickersTracked: Object.keys(snapshot.quotes).length,
    semester: settings.currentSemester,
    schoolName: settings.schoolName,
    timestamp: new Date().toISOString(),
  });
}
