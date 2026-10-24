"use server";

import { GoogleGenAI } from "@google/genai";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getUserHoldings,
  getUserLimitOrders,
  getUserTradeHistory,
} from "@/lib/firebase/store";
import {
  evaluateCopilotTurn,
  type CopilotTurnOutput,
} from "@/lib/copilot-engine";

export async function runSgxCopilotAction(
  prompt: string,
  optionalClientApiKey?: string,
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

  const output = evaluateCopilotTurn(prompt, {
    user,
    settings,
    snapshot,
    holdings,
    trades,
    limitOrders,
  });

  // Optional Gemini LLM enrichment when an API key is configured on server or provided by user
  const apiKey =
    (optionalClientApiKey && optionalClientApiKey.trim()) ||
    process.env.GEMINI_API_KEY;

  if (
    apiKey &&
    !apiKey.includes("your_gemini") &&
    output.toolUsed !== "guardrail_anti_speculation"
  ) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const llmPrompt = `You are the EduFinLit Socratic Copilot for Singapore secondary school and JC students (ages 13-18) and teachers.
Student/Teacher asked: "${prompt}"
Structured SGX Tool Executed: ${output.toolUsed}
Baseline Summary: ${output.explanation}

Rewrite the explanation in 2 to 3 crisp, friendly sentences in plain English (defining any financial term in brackets).
STRICT GUARDRAIL: Never recommend buying or selling a stock, and never predict future prices.`;

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: llmPrompt,
      });
      const text = res.text?.trim();
      if (text && text.length > 20) {
        output.explanation = text;
      }
    } catch {
      // Keep deterministic explanation if API call fails
    }
  }

  return { success: true, data: output };
}
