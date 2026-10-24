import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getUserHoldings,
  getUserLimitOrders,
  getUserPortfolioHistory,
  getUserReflections,
  getUserTradeHistory,
} from "@/lib/firebase/store";
import { TICKER_META } from "@/utils/tickers";
import PortfolioClient, { type EnrichedHoldingRow } from "./PortfolioClient";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [
    settings,
    snapshot,
    rawHoldings,
    history,
    trades,
    limitOrders,
    reflections,
  ] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
    getUserHoldings(user.uid),
    getUserPortfolioHistory(user.uid),
    getUserTradeHistory(user.uid),
    getUserLimitOrders(user.uid),
    getUserReflections(user.uid),
  ]);

  if (
    settings.maintenanceMode &&
    user.role !== "teacher" &&
    user.role !== "superadmin"
  ) {
    redirect("/maintenance");
  }

  const enrichedHoldings: EnrichedHoldingRow[] = rawHoldings.map((h) => {
    const meta = TICKER_META[h.ticker];
    const quote = snapshot.quotes[h.ticker];
    const currentPrice = quote?.price ?? meta?.refPrice ?? h.avgPrice;
    const marketValue = Number((h.shares * currentPrice).toFixed(2));
    const costBasis = Number((h.shares * h.avgPrice).toFixed(2));
    const pnl = Number((marketValue - costBasis).toFixed(2));
    const pnlPct =
      costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

    return {
      ticker: h.ticker,
      companyName: meta?.name ?? h.ticker,
      shortName: meta?.shortName ?? h.ticker,
      tier: meta?.tier ?? "Safe Bets",
      sector: meta?.sector ?? "SGX Mainboard",
      shares: h.shares,
      avgPrice: h.avgPrice,
      currentPrice,
      marketValue,
      costBasis,
      pnl,
      pnlPct,
    };
  });

  return (
    <PortfolioClient
      user={user}
      holdings={enrichedHoldings}
      history={history}
      trades={trades}
      limitOrders={limitOrders}
      reflections={reflections}
    />
  );
}
