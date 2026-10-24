import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import {
  getAppSettings,
  getMarketSnapshot,
  getUserHoldings,
} from "@/lib/firebase/store";
import { getTickerCandles } from "@/lib/stock-provider";
import {
  formatSgd,
  formatSgxPrice,
  getSgxSessionStatus,
} from "@/utils/sgx-market";
import { TICKER_META, TIER_CONFIG, VALID_TICKERS } from "@/utils/tickers";
import SgxProChart from "@/components/company/SgxProChart";
import SgxOrderTicket from "@/components/company/SgxOrderTicket";
import SgxDividendCalculator from "@/components/company/SgxDividendCalculator";
import AiCoachSection from "@/components/ai/AiCoachSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { ticker: string };
}): Promise<Metadata> {
  const ticker = params.ticker.toUpperCase();
  const meta = TICKER_META[ticker];
  return {
    title: `${meta?.name ?? ticker} (${ticker}) · SGX Edu-Trader 2.0`,
    description: `Live SGX candlestick chart, order book depth, and paper trading terminal for ${meta?.name ?? ticker}.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: { ticker: string };
}) {
  const ticker = params.ticker.toUpperCase();
  if (!VALID_TICKERS.includes(ticker)) {
    redirect("/dashboard");
  }

  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [settings, snapshot, holdings, initialCandles] = await Promise.all([
    getAppSettings(),
    getMarketSnapshot(),
    getUserHoldings(user.uid),
    getTickerCandles(ticker, "1M"),
  ]);

  const meta = TICKER_META[ticker];
  const tierCfg = TIER_CONFIG[meta.tier];
  const quote = snapshot.quotes[ticker];

  const livePrice = quote?.price ?? meta.refPrice;
  const changePct = quote?.changePct ?? meta.refChangePct;
  const changeAmt = quote?.change ?? 0;
  const bid = quote?.bid ?? livePrice;
  const ask = quote?.ask ?? livePrice;
  const dayHigh = quote?.dayHigh ?? livePrice;
  const dayLow = quote?.dayLow ?? livePrice;
  const openPrice = quote?.open ?? livePrice;
  const prevClose = quote?.prevClose ?? livePrice;
  const volume = quote?.volume ?? meta.refVolume;
  const up = changePct >= 0;

  const myHolding = holdings.find((h) => h.ticker === ticker);
  const holdingShares = myHolding?.shares ?? 0;
  const holdingAvgPrice = myHolding?.avgPrice ?? 0;
  const holdingMarketValue = Number((holdingShares * livePrice).toFixed(2));
  const holdingCostBasis = Number((holdingShares * holdingAvgPrice).toFixed(2));
  const holdingPnl = Number((holdingMarketValue - holdingCostBasis).toFixed(2));
  const holdingPnlPct =
    holdingCostBasis > 0
      ? Number(((holdingPnl / holdingCostBasis) * 100).toFixed(2))
      : 0;
  const holdingUp = holdingPnl >= 0;

  const sessionStatus = getSgxSessionStatus(new Date());

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Breadcrumb & Market Phase Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-sgx-blue hover:text-sgx-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to SGX Market Screener
        </Link>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
            sessionStatus.isOpen
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              sessionStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {sessionStatus.label}
        </span>
      </div>

      {/* Company Institutional Header Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                SGX: {ticker}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tierCfg.pillBg} ${tierCfg.pillText} ${tierCfg.pillBorder}`}
              >
                {tierCfg.badgeText}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Building2 className="h-3 w-3" />
                {meta.sector}
              </span>
            </div>

            <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {meta.name}
            </h1>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-600">
              {meta.description}
            </p>
          </div>

          {/* Live Price & Change Display */}
          <div className="flex flex-col lg:items-end">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl font-extrabold text-slate-900 tabular-nums">
                S${formatSgxPrice(livePrice)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 font-mono text-xs font-bold tabular-nums ${
                  up
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {up ? "▲" : "▼"} S${formatSgxPrice(Math.abs(changeAmt))}{" "}
                {up ? "profit" : "loss"} ({up ? "+" : ""}
                {changePct.toFixed(2)}%)
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-slate-500">
              Bid (Sell Now):{" "}
              <strong className="text-emerald-700">
                S${formatSgxPrice(bid)}
              </strong>{" "}
              · Ask (Buy Now):{" "}
              <strong className="text-rose-700">S${formatSgxPrice(ask)}</strong>{" "}
              · Board Lot: <strong className="text-slate-800">100 shares</strong>
            </p>
          </div>
        </div>

        {/* Key SGX Exchange Statistics Bar */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 lg:grid-cols-8 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Open</p>
            <p className="font-mono font-bold text-slate-900">
              S${formatSgxPrice(openPrice)}
            </p>
            <p className="text-[10px] text-slate-400">9:00 AM start price</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Prev Close</p>
            <p className="font-mono font-bold text-slate-900">
              S${formatSgxPrice(prevClose)}
            </p>
            <p className="text-[10px] text-slate-400">Yesterday&apos;s end price</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Day High</p>
            <p className="font-mono font-bold text-emerald-700">
              S${formatSgxPrice(dayHigh)}
            </p>
            <p className="text-[10px] text-slate-400">Highest price today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Day Low</p>
            <p className="font-mono font-bold text-rose-700">
              S${formatSgxPrice(dayLow)}
            </p>
            <p className="text-[10px] text-slate-400">Lowest price today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Volume</p>
            <p className="font-mono font-bold text-slate-900">
              {volume.toLocaleString("en-SG")}
            </p>
            <p className="text-[10px] text-slate-400">Shares traded today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Market Cap</p>
            <p className="font-mono font-bold text-slate-900">
              {meta.marketCapB}
            </p>
            <p className="text-[10px] text-slate-400">Total company value</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">P/E Ratio</p>
            <p className="font-mono font-bold text-slate-900">
              {meta.peRatio.toFixed(1)}x
            </p>
            <p className="text-[10px] text-slate-400">Price per S$1 profit</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Div Yield</p>
            <p className="font-mono font-bold text-sgx-blue">
              {meta.dividendYieldPct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400">Annual cash payout %</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Terminal Layout: Chart + Holdings (Left 7 cols) | SGX Order Ticket (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* Pro TradingView Chart */}
          <SgxProChart
            ticker={ticker}
            initialCandles={initialCandles}
            livePrice={livePrice}
          />

          {/* Interactive SGX Dividend & Compounding Simulator */}
          <SgxDividendCalculator
            ticker={ticker}
            companyName={meta.name}
            livePrice={livePrice}
            dividendYieldPct={meta.dividendYieldPct}
          />

          {/* Student Position Card on this Stock */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Briefcase className="h-4 w-4 text-sgx-blue" />
                My Position in {meta.shortName} ({ticker})
              </h2>
              {holdingShares > 0 && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sgx-blue">
                  {(holdingShares / 100).toFixed(2)} Lots Owned
                </span>
              )}
            </div>

            {holdingShares > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[11px] text-slate-500">Shares Owned</p>
                  <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    {holdingShares.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Avg Entry Price</p>
                  <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    S${formatSgxPrice(holdingAvgPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Market Value</p>
                  <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    S${formatSgd(holdingMarketValue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Unrealized P&amp;L</p>
                  <p
                    className={`font-mono text-sm font-bold tabular-nums ${
                      holdingUp ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {holdingUp ? "▲" : "▼"} S${formatSgd(Math.abs(holdingPnl))}{" "}
                    {holdingUp ? "profit" : "loss"} ({holdingUp ? "+" : ""}
                    {holdingPnlPct.toFixed(2)}%)
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                You do not currently hold any shares in {meta.name}. Use the SGX
                Order Entry Terminal on the right to place a Market or Limit buy
                order.
              </p>
            )}
          </section>

          {/* Learning Objective & Pre-Trade Checklist */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sgx-blue">
                <BookOpen className="h-4 w-4" />
                SGX Case Study Question
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                {meta.learningObjective}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <HelpCircle className="h-4 w-4 text-emerald-600" />
                Smart Investor Pre-Trade Check
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  How does this company earn its core revenue?
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  Does this trade improve my portfolio diversification?
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  What could cause my investment thesis to be wrong?
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Right 5 Columns: Sticky SGX Order Ticket */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <SgxOrderTicket
              ticker={ticker}
              companyName={meta.name}
              livePrice={livePrice}
              liveBid={bid}
              liveAsk={ask}
              liveVolume={volume}
              initialCashBalance={user.cashBalance}
              initialHoldingShares={holdingShares}
              initialHoldingAvgPrice={holdingAvgPrice}
              coolingOffUntil={user.coolingOffUntil}
              hasCompletedTutorial={user.hasCompletedTutorial}
              allowOddLots={settings.allowOddLots}
              feeMode={settings.feeMode}
            />
          </div>
        </div>
      </div>

      {/* Gemini 2.5 Flash Socratic AI Coach */}
      <AiCoachSection ticker={ticker} />
    </main>
  );
}
