"use server";

import { getMarketSnapshot, getUserProfile } from "@/lib/firebase/store";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { refreshAllStockQuotes } from "@/lib/stock-provider";

const AUTO_REFRESH_STALE_MS = 30_000; // Auto-fetch fresh SGX quotes if snapshot is >= 30s old

export async function pullLatestMarketDataAction() {
  const sessionUser = await getServerSessionUser();
  let snapshot = await getMarketSnapshot();

  const ageMs = Date.now() - (Date.parse(snapshot.updatedAt) || 0);
  if (ageMs >= AUTO_REFRESH_STALE_MS) {
    const refreshed = await refreshAllStockQuotes();
    snapshot = refreshed.snapshot;
  }

  const freshUser = sessionUser
    ? await getUserProfile(sessionUser.uid)
    : null;

  return {
    success: true,
    snapshot,
    user: freshUser,
  };
}

export async function triggerLiveMarketTickAction() {
  const result = await refreshAllStockQuotes();
  const sessionUser = await getServerSessionUser();
  const freshUser = sessionUser
    ? await getUserProfile(sessionUser.uid)
    : null;

  return {
    success: true,
    snapshot: result.snapshot,
    user: freshUser,
  };
}
