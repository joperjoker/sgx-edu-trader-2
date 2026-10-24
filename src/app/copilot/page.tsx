import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getUserHoldings,
  getUserLimitOrders,
  getUserTradeHistory,
} from "@/lib/firebase/store";
import SgxCopilotClient from "./CopilotClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Copilot · Agentic Trading & Socratic Coach · EduFinLit",
  description:
    "Natural-language order ticket execution, What-If diversification simulator, and Socratic financial literacy copilot powered by Google Cloud & Gemini.",
};

export default async function CopilotPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, snapshot, holdings, trades, limitOrders] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
    getUserHoldings(user.uid),
    getUserTradeHistory(user.uid),
    getUserLimitOrders(user.uid),
  ]);

  return (
    <SgxCopilotClient
      initialUser={user}
      initialSettings={settings}
      initialSnapshot={snapshot}
      initialHoldings={holdings}
      initialTrades={trades}
      initialLimitOrders={limitOrders}
    />
  );
}
