"use server";

import { getMarketSnapshot, getUserProfile } from "@/lib/firebase/store";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import { refreshAllStockQuotes } from "@/lib/stock-provider";

export async function pullLatestMarketDataAction() {
  const sessionUser = await getServerSessionUser();
  const snapshot = await getMarketSnapshot();
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
