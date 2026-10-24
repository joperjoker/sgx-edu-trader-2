"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createChart,
  ColorType,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  PieChart as PieChartIcon,
  Receipt,
  Send,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cancelLimitOrderAction } from "@/actions/trade";
import { submitWeeklyReflectionAction } from "@/actions/reflection";
import PortfolioStressTester from "@/components/portfolio/PortfolioStressTester";
import SgxContractNoteModal from "@/components/portfolio/SgxContractNoteModal";
import type {
  LimitOrderDoc,
  PortfolioSnapshotDoc,
  ReflectionDoc,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";
import {
  calculateSmartInvestorScore,
  formatSgd,
  formatSgxPrice,
} from "@/utils/sgx-market";
import { TIER_CONFIG, type RiskTier } from "@/utils/tickers";

export interface EnrichedHoldingRow {
  ticker: string;
  companyName: string;
  shortName: string;
  tier: RiskTier;
  sector: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
}

interface Props {
  user: UserProfileDoc;
  holdings: EnrichedHoldingRow[];
  history: PortfolioSnapshotDoc[];
  trades: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
  reflections: ReflectionDoc[];
}

const BADGE_CATALOG = [
  {
    key: "first_trade",
    emoji: "🥇",
    label: "First SGX Order",
    description: "Executed your first board lot trade on SGX",
  },
  {
    key: "first_profit",
    emoji: "💰",
    label: "First Realized Profit",
    description: "Closed a position at a net profit after fees",
  },
  {
    key: "diversified",
    emoji: "🌐",
    label: "Cross-Tier Diversifier",
    description: "Hold stocks across 3 or more SGX Risk Tiers",
  },
  {
    key: "fee_aware",
    emoji: "📚",
    label: "CDP & Fee Strategist",
    description: "Completed 5 total trades while tracking fees",
  },
  {
    key: "ai_analyst",
    emoji: "🔬",
    label: "Gemini Analyst",
    description: "Used Socratic Gemini 2.5 AI research modules",
  },
  {
    key: "fast_mover",
    emoji: "🏃",
    label: "Opening Bell Trader",
    description: "Placed an order during the 09:00 SGT opening hour",
  },
];

function getIsoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function NetWorthCurveChart({
  history,
  startingCapital,
}: {
  history: PortfolioSnapshotDoc[];
  startingCapital: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || history.length < 2) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 240,
      layout: {
        background: { type: ColorType.Solid, color: "#FFFFFF" },
        textColor: "#475569",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#F1F5F9" },
        horzLines: { color: "#F1F5F9" },
      },
      rightPriceScale: {
        borderColor: "#E2E8F0",
      },
      timeScale: {
        borderColor: "#E2E8F0",
      },
    });
    chartRef.current = chart;

    const lastVal = history[history.length - 1]?.netValue ?? startingCapital;
    const isUp = lastVal >= startingCapital;

    const area = chart.addAreaSeries({
      lineColor: isUp ? "#059669" : "#E11D48",
      topColor: isUp ? "rgba(5, 150, 105, 0.22)" : "rgba(225, 29, 72, 0.22)",
      bottomColor: "rgba(255, 255, 255, 0.0)",
      lineWidth: 2,
    });

    const seen = new Set<number>();
    const points: Array<{ time: Time; value: number }> = [];
    history.forEach((h, idx) => {
      const baseSec = Math.floor(new Date(h.recordedAt).getTime() / 1000);
      const uniqueSec = seen.has(baseSec) ? baseSec + idx + 1 : baseSec;
      seen.add(uniqueSec);
      points.push({
        time: uniqueSec as Time,
        value: h.netValue,
      });
    });
    points.sort((a, b) => Number(a.time) - Number(b.time));
    area.setData(points);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect.width) {
        chart.applyOptions({ width: entries[0].contentRect.width });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [history, startingCapital]);

  if (history.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        Your daily portfolio performance curve will appear here after your first
        daily snapshot.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-[240px]" />;
}

export default function PortfolioClient({
  user,
  holdings,
  history,
  trades,
  limitOrders,
  reflections,
}: Props) {
  const router = useRouter();
  const currentWeek = useMemo(() => getIsoWeekNumber(new Date()), []);
  const existingWeekReflection = reflections.find(
    (r) => r.weekNumber === currentWeek,
  );

  const reflectionPrompt =
    "Review your SGX trades and asset allocation this week. How did diversifying across risk tiers and managing SGX/CDP brokerage fees impact your performance?";

  const [reflectionText, setReflectionText] = useState(
    existingWeekReflection?.responseText ?? "",
  );
  const [reflectionSavedMsg, setReflectionSavedMsg] = useState<string | null>(
    null,
  );
  const [reflectionErr, setReflectionErr] = useState<string | null>(null);
  const [isSavingReflection, startSaveReflection] = useTransition();
  const [isCancellingOrder, startCancelOrder] = useTransition();
  const [selectedTradeNote, setSelectedTradeNote] =
    useState<TradeHistoryDoc | null>(null);

  const startingCapital = user.startingCapital > 0 ? user.startingCapital : 10000;
  const netValue = user.netValue;
  const cashBalance = user.cashBalance;
  const holdingsValue = Math.max(0, Number((netValue - cashBalance).toFixed(2)));
  const pnlDelta = Number((netValue - startingCapital).toFixed(2));
  const pnlPct = Number(((pnlDelta / startingCapital) * 100).toFixed(2));
  const isUp = pnlDelta >= 0;

  const smartScore = calculateSmartInvestorScore(
    netValue,
    startingCapital,
    user.hhi ?? 1,
  );

  // Asset Allocation by Risk Tier
  const tierBreakdown = useMemo(() => {
    const map = new Map<RiskTier, number>();
    holdings.forEach((h) => {
      map.set(h.tier, (map.get(h.tier) ?? 0) + h.marketValue);
    });
    const total = holdingsValue > 0 ? holdingsValue : 1;
    return Array.from(map.entries()).map(([tier, val]) => ({
      tier,
      value: val,
      pct: Math.round((val / total) * 100),
      color: TIER_CONFIG[tier].chartColor,
    }));
  }, [holdings, holdingsValue]);

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    setReflectionErr(null);
    setReflectionSavedMsg(null);

    startSaveReflection(async () => {
      const res = await submitWeeklyReflectionAction({
        weekNumber: currentWeek,
        promptQuestion: reflectionPrompt,
        responseText: reflectionText,
      });
      if (!res.success) {
        setReflectionErr(res.error ?? "Failed to save reflection.");
        return;
      }
      setReflectionSavedMsg(
        "Saved to Google Cloud Firestore! Your teacher can now review your Week " +
          currentWeek +
          " reflection.",
      );
      router.refresh();
    });
  };

  const openLimitOrders = limitOrders.filter((o) => o.status === "open");

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Portfolio Overview Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              SGX Central Depository (CDP) Account Statement
            </span>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900">
              {user.nickname}&apos;s Portfolio
            </h1>
            <p className="font-mono text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs font-semibold text-slate-500">
              Net Account Value
            </span>
            <span className="font-mono text-4xl font-extrabold text-slate-900 tabular-nums">
              S${formatSgd(netValue)}
            </span>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full border px-3 py-0.5 font-mono text-xs font-bold tabular-nums ${
                isUp
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {isUp ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {isUp ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
              {isUp ? "profit" : "loss"} ({isUp ? "+" : ""}
              {pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-5 text-xs">
          <div>
            <p className="text-slate-500">Cash Buying Power</p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              S${formatSgd(cashBalance)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Securities Value</p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              S${formatSgd(holdingsValue)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Cumulative Fees Paid</p>
            <p className="mt-0.5 font-mono text-base font-bold text-amber-700 tabular-nums">
              S${formatSgd(user.totalFeesPaid)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Diversification (1-HHI)</p>
            <p className="mt-0.5 font-mono text-base font-bold text-sgx-blue tabular-nums">
              {Math.round((1 - (user.hhi ?? 1)) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-slate-500">Smart Investor Score</p>
            <p className="mt-0.5 font-mono text-base font-bold text-emerald-700 tabular-nums">
              {smartScore >= 0 ? `+${smartScore.toFixed(2)}` : smartScore.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      {/* Performance Curve + Risk Tier Allocation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Net Worth Performance Curve (SGD)
            </h2>
            <span className="font-mono text-xs text-slate-500">
              Baseline: S$10,000.00
            </span>
          </div>
          <NetWorthCurveChart
            history={history}
            startingCapital={startingCapital}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-sgx-blue" />
              <h2 className="font-display text-base font-bold text-slate-900">
                SGX Risk Tier Allocation
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Distribution of your invested capital across the 4 SGX categories.
            </p>

            {tierBreakdown.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                You are currently 100% in cash (S${formatSgd(cashBalance)}).
                Buy your first SGX board lot to populate your allocation chart.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {tierBreakdown.map((item) => (
                  <div key={item.tier} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.tier}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        S${formatSgd(item.value)} ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-600">
            <strong>Smart Investor Formula:</strong> Your Smart Score rewards
            consistent returns multiplied by your diversification bonus{" "}
            <span className="font-mono text-slate-900">(1 + (1 − HHI))</span>.
          </div>
        </section>
      </div>

      {/* Active Equity Holdings Table */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-sgx-blue" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Current SGX Securities Holdings ({holdings.length})
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-sgx-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Trade SGX Counters
          </Link>
        </div>

        {holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No active stock holdings yet. Head to the{" "}
            <Link href="/dashboard" className="font-semibold text-sgx-blue underline">
              SGX Market Board
            </Link>{" "}
            to place your first order.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Counter</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 text-right">Shares (Lots)</th>
                  <th className="px-4 py-3 text-right">Avg Paid</th>
                  <th className="px-4 py-3 text-right">Last Price</th>
                  <th className="px-4 py-3 text-right">Market Value</th>
                  <th className="px-4 py-3 text-right">Unrealized P&amp;L</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holdings.map((h) => {
                  const up = h.pnl >= 0;
                  const tierCfg = TIER_CONFIG[h.tier];
                  return (
                    <tr key={h.ticker} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link
                          href={`/company/${h.ticker}`}
                          className="font-bold text-slate-900 hover:text-sgx-blue"
                        >
                          {h.companyName}
                        </Link>
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                          {h.ticker}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tierCfg.pillBg} ${tierCfg.pillText} ${tierCfg.pillBorder}`}
                        >
                          {tierCfg.shortLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {h.shares.toLocaleString()} ({(h.shares / 100).toFixed(1)})
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                        S${formatSgxPrice(h.avgPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        S${formatSgxPrice(h.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        S${formatSgd(h.marketValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                          up ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {up ? "▲" : "▼"} S${formatSgd(Math.abs(h.pnl))}{" "}
                        {up ? "profit" : "loss"} ({up ? "+" : ""}
                        {h.pnlPct.toFixed(2)}%)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/company/${h.ticker}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-sgx-blue hover:bg-blue-50"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Open Working Limit Orders (if any) */}
      {openLimitOrders.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Working SGX Limit Orders ({openLimitOrders.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b border-amber-200 text-left uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Counter</th>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2 text-right">Shares</th>
                  <th className="px-3 py-2 text-right">Limit Price</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {openLimitOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 font-mono">{o.id}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">
                      {o.companyName} ({o.ticker})
                    </td>
                    <td className="px-3 py-2 font-mono uppercase font-bold">
                      {o.action}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {o.shares.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      S${formatSgxPrice(o.limitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={isCancellingOrder}
                        onClick={() =>
                          startCancelOrder(async () => {
                            await cancelLimitOrderAction(o.id);
                            router.refresh();
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-rose-600 font-semibold hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Gemini 2.5 Flash Macroeconomic Portfolio Stress-Tester */}
      <PortfolioStressTester />

      {/* Server-Persisted Weekly Learning Reflection + Achievement Badges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Reflection (Fixes Legacy Bug #12: Saved to Firestore, visible to Teacher!) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sgx-blue" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Weekly Investment Reflection (Week {currentWeek})
              </h2>
            </div>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-sgx-blue">
              Synced to Teacher Console
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {reflectionPrompt}
          </p>

          <form onSubmit={handleSaveReflection} className="mt-4 space-y-3">
            <textarea
              rows={4}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write your reflection on diversification, risk tiers, and transaction costs…"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/70 p-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sgx-blue focus:bg-white focus:ring-2 focus:ring-sgx-blue/20"
            />

            {reflectionErr && (
              <p className="text-xs font-medium text-rose-600">{reflectionErr}</p>
            )}
            {reflectionSavedMsg && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {reflectionSavedMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSavingReflection}
              className="inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {isSavingReflection
                ? "Saving to Google Cloud Firestore…"
                : "Save Weekly Reflection"}
            </button>
          </form>
        </section>

        {/* Achievement Badges */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <h2 className="font-display text-base font-bold text-slate-900">
                SGX Investor Milestones (
                {Object.keys(user.achievements ?? {}).length}/
                {BADGE_CATALOG.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {BADGE_CATALOG.map((b) => {
              const unlockedAt = user.achievements?.[b.key];
              const unlocked = Boolean(unlockedAt);
              return (
                <div
                  key={b.key}
                  className={`flex items-start gap-3 rounded-2xl border p-3 ${
                    unlocked
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-200 bg-slate-50/60 opacity-60"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-xl shadow-sm">
                    {unlocked ? b.emoji : <Lock className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{b.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Historical SGX Contract Notes & Trade Ledger */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-4 w-4 text-sgx-blue" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Executed SGX Contract Notes ({trades.length})
          </h2>
        </div>

        {trades.length === 0 ? (
          <p className="text-xs text-slate-500">
            No executed trades yet. Every buy and sell generates an official
            itemized SGX contract note here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Contract Note</th>
                  <th className="px-3 py-2.5">Date/Time (SGT)</th>
                  <th className="px-3 py-2.5">Counter</th>
                  <th className="px-3 py-2.5">Side</th>
                  <th className="px-3 py-2.5 text-right">Shares</th>
                  <th className="px-3 py-2.5 text-right">Price</th>
                  <th className="px-3 py-2.5 text-right">SGX/CDP Fees</th>
                  <th className="px-3 py-2.5 text-right">Net Total</th>
                  <th className="px-3 py-2.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                      <button
                        type="button"
                        onClick={() => setSelectedTradeNote(t)}
                        className="inline-flex items-center gap-1 font-semibold text-sgx-blue hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        {t.contractNoteNo}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {new Date(t.timestamp).toLocaleString("en-SG", {
                        timeZone: "Asia/Singapore",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {t.companyName} ({t.ticker})
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          t.action === "buy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {t.action} · {t.orderType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {t.shares.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                      S${formatSgxPrice(t.executionPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-700 tabular-nums">
                      S${formatSgd(t.totalFee)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      S${formatSgd(t.netTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTradeNote(t)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sgx-blue hover:bg-blue-50"
                      >
                        View T+2 Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SgxContractNoteModal
        trade={selectedTradeNote}
        onClose={() => setSelectedTradeNote(null)}
      />
    </main>
  );
}
