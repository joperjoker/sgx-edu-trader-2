"use server";

import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getUserHoldings,
  getUserLimitOrders,
  getUserTradeHistory,
} from "@/lib/firebase/store";
import {
  enrichCopilotTurnWithGemini,
  evaluateCopilotTurn,
  type CopilotChatHistoryTurn,
  type CopilotTurnOutput,
} from "@/lib/copilot-engine";

export async function runSgxCopilotAction(
  prompt: string,
  optionalClientApiKey?: string,
  history: CopilotChatHistoryTurn[] = [],
): Promise<{
  success: boolean;
  error?: string;
  data?: CopilotTurnOutput;
}> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Please sign in first." };
  }

  const [settings, snapshot, holdings, trades, limitOrders] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
    getUserHoldings(user.uid),
    getUserTradeHistory(user.uid),
    getUserLimitOrders(user.uid),
  ]);

  const ctx = {
    user,
    settings,
    snapshot,
    holdings,
    trades,
    limitOrders,
  };

  const baseOutput = evaluateCopilotTurn(prompt, ctx);

  const apiKey =
    (optionalClientApiKey && optionalClientApiKey.trim()) ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const enriched = await enrichCopilotTurnWithGemini(
    prompt,
    baseOutput,
    ctx,
    apiKey,
    history,
  );

  return { success: true, data: enriched };
}
