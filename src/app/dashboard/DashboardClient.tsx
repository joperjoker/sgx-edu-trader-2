"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Layers,
  Award,
  BarChart3,
} from "lucide-react";
import {
  getFirebaseBrowserDb,
  isFirebaseBrowserConfigured,
} from "@/lib/firebase/client";
import type {
  LiveQuoteItem,
  MarketLiveSnapshotDoc,
  UserProfileDoc,
  WeeklyChallengeDoc,
} from "@/types/firestore";
import {
  RISK_TIER_ORDER,
   formatVolumeShort,
} from "./helpers";
import {
  formatSgd,
  formatSgxPrice,
  getSgxSessionStatus,
  type SgxSessionStatus,
} from "@/utils/sgx-market";
import {
  TICKER_META,
  TIER_CONFIG,
  VALID_TICKERS,
  type RiskTier,
} from "@/utils/tickers";
import {
  pullLatestMarketDataAction,
  triggerLiveMarketTickAction,
} from "./actions";

interface Props {
  initialUser: UserProfileDoc;
  initialSnapshot: MarketLiveSnapshotDoc;
  activeChallenge: WeeklyChallengeDoc | null;
}

function MiniSparkline({
  points,
  isUp,
}: {
  points: number[];
  isUp: boolean;
}) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 92;
  const height = 28;

  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={isUp ? "#059669" : "#E11D48"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export default function DashboardClient({
  initialUser,
  initialSnapshot,
  activeChallenge,
}: Props) {
  const [user, setUser] = useState<UserProfileDoc>(initialUser);
  const [snapshot, setSnapshot] =
    useState<MarketLiveSnapshotDoc>(initialSnapshot);
  const [activeTier, setActiveTier] = useState<RiskTier | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [flashedTickers, setFlashedTickers] = useState<
    Record<string, "bull" | "bear">
  >({});
  const [sessionStatus, setSessionStatus] = useState<SgxSessionStatus>(() =>
    getSgxSessionStatus(new Date()),
  );
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, startRefresh] = useTransition();

  // Clock & seconds-since-update ticker
  useEffect(() => {
    const tick = () => {
      setSessionStatus(getSgxSessionStatus(new Date()));
      const updatedMs = Date.parse(snapshot.updatedAt) || Date.now();
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - updatedMs) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [snapshot.updatedAt]);

  const applyNewSnapshot = useCallback(
    (nextSnap: MarketLiveSnapshotDoc) => {
      setSnapshot((prev) => {
        const flashes: Record<string, "bull" | "bear"> = {};
        for (const [ticker, nextQuote] of Object.entries(nextSnap.quotes)) {
          const oldPrice = prev.quotes[ticker]?.price;
          if (
            typeof oldPrice === "number" &&
            Math.abs(nextQuote.price - oldPrice) > 0.0001
          ) {
            flashes[ticker] = nextQuote.price >= oldPrice ? "bull" : "bear";
          }
        }
        if (Object.keys(flashes).length > 0) {
          setFlashedTickers(flashes);
          setTimeout(() => setFlashedTickers({}), 500);
        }
        return nextSnap;
      });
    },
    [],
  );

  // Attach real-time Firestore listener to `market/live_snapshot` (1 doc read per update!)
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    if (isFirebaseBrowserConfigured()) {
      const db = getFirebaseBrowserDb();
      if (db) {
        unsubscribeSnapshot = onSnapshot(
          doc(db, "market", "live_snapshot"),
          (snap) => {
            if (!snap.exists()) return;
            applyNewSnapshot(snap.data() as MarketLiveSnapshotDoc);
          },
          () => {
            // fallback polling handles local emulator mode
          },
        );
      }
    }

    const pollId = setInterval(async () => {
      const res = await pullLatestMarketDataAction();
      if (res.success && res.snapshot) {
        applyNewSnapshot(res.snapshot);
      }
      if (res.user) {
        setUser(res.user);
      }
    }, 15000);

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      clearInterval(pollId);
    };
  }, [applyNewSnapshot]);

  const handleManualRefresh = () => {
    startRefresh(async () => {
      const res = await triggerLiveMarketTickAction();
      if (res.success && res.snapshot) {
        applyNewSnapshot(res.snapshot);
      }
      if (res.user) {
        setUser(res.user);
      }
    });
  };

  const startingCapital = user.startingCapital > 0 ? user.startingCapital : 10000;
  const netValue = user.netValue;
  const cashBalance = user.cashBalance;
  const holdingsValue = Math.max(0, Number((netValue - cashBalance).toFixed(2)));
  const pnlDelta = Number((netValue - startingCapital).toFixed(2));
  const pnlPct = Number(((pnlDelta / startingCapital) * 100).toFixed(2));
  const isProfit = pnlDelta >= 0;

  // Market breadth stats across all 20 SGX counters
  const marketStats = useMemo(() => {
    const quotesList = Object.values(snapshot.quotes);
    const advancers = quotesList.filter((q) => q.changePct > 0).length;
    const decliners = quotesList.filter((q) => q.changePct < 0).length;
    const unchanged = quotesList.length - advancers - decliners;
    const avgChangePct =
      quotesList.reduce((acc, q) => acc + q.changePct, 0) /
      (quotesList.length || 1);
    return { advancers, decliners, unchanged, avgChangePct };
  }, [snapshot.quotes]);

  const filteredTickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VALID_TICKERS.filter((ticker) => {
      const meta = TICKER_META[ticker];
      const quote = snapshot.quotes[ticker];
      if (activeTier !== "ALL" && meta.tier !== activeTier) {
        return false;
      }
      if (!q) return true;
      return (
        ticker.toLowerCase().includes(q) ||
        meta.name.toLowerCase().includes(q) ||
        meta.shortName.toLowerCase().includes(q) ||
        meta.sector.toLowerCase().includes(q) ||
        (quote?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [activeTier, searchQuery, snapshot.quotes]);

  const coolingOffActive =
    user.coolingOffUntil !== null &&
    new Date(user.coolingOffUntil).getTime() > Date.now();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Cooling-off Circuit Breaker Banner */}
      {coolingOffActive && (
        <section
          role="alert"
          className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-800">
                🛑 SGX Cooling-Off Circuit Breaker Active
              </p>
              <p className="mt-1 text-xs text-rose-700">
                A significant portfolio drawdown was detected in the last 24
                hours. To prevent emotional revenge trading, order submission is
                paused until{" "}
                <span className="font-mono font-bold">
                  {new Date(user.coolingOffUntil!).toLocaleTimeString("en-SG", {
                    timeZone: "Asia/Singapore",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  SGT
                </span>
                .
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Top SGX Market Status & Breadth Ribbon */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
              sessionStatus.isOpen
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : sessionStatus.phase === "MIDDAY_BREAK"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-slate-100 text-slate-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sessionStatus.isOpen
                  ? "bg-emerald-500 animate-pulse"
                  : sessionStatus.phase === "MIDDAY_BREAK"
                    ? "bg-amber-500"
                    : "bg-slate-400"
              }`}
            />
            {sessionStatus.label}
          </span>

          <span className="hidden lg:inline-block text-xs text-slate-500">
            {sessionStatus.detail}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500">SGX Breadth:</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              ▲ {marketStats.advancers} Up
            </span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">
              ▼ {marketStats.decliners} Down
            </span>
          </div>

          <span className="inline-flex items-center gap-1 font-mono text-slate-500 tabular-nums">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Updated {secondsAgo}s ago
          </span>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sgx-blue hover:text-sgx-blue disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-sgx-blue" : ""}`}
            />
            {isRefreshing ? "Syncing SGX…" : "Simulate Market Tick"}
          </button>
        </div>
      </section>

      {/* Portfolio Hero Summary Grid */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          aria-live="polite"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Net Portfolio Value (SGD)
              </p>
              <p className="mt-1 font-mono text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl tabular-nums">
                S${formatSgd(netValue)}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 font-mono text-sm font-bold tabular-nums ${
                isProfit
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isProfit ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
                {isProfit ? "profit" : "loss"} ({isProfit ? "+" : ""}
                {pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Buying Power (Cash)
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                S${formatSgd(cashBalance)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Invested Holdings
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                S${formatSgd(holdingsValue)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                SGX & CDP Fees Paid
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                S${formatSgd(user.totalFeesPaid)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Diversification (1-HHI)
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-sgx-blue tabular-nums">
                {Math.round((1 - (user.hhi ?? 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Right Hero Card: Active Classroom Challenge */}
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/60 p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sgx-blue shadow-sm">
              <Award className="h-3.5 w-3.5" />
              This Week&apos;s Classroom Challenge
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-slate-900">
              {activeChallenge?.title ??
                "Cross-Tier SGX Portfolio Construction"}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {activeChallenge?.description ??
                "Build a diversified portfolio across at least 3 SGX Risk Tiers while keeping total transaction fees under 1.5% of invested capital."}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-3 text-xs">
            <span className="font-mono text-slate-500">
              Board Lot Standard: <strong className="text-slate-800">100 shares</strong>
            </span>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1 font-semibold text-sgx-blue hover:underline"
            >
              View Portfolio & Reflection
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SGX Market Screener & Tier Filter Bar */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Tier Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTier("ALL")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTier === "ALL"
                  ? "bg-sgx-blue text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              All 20 SGX Counters
            </button>

            {RISK_TIER_ORDER.map((tierName) => {
              const cfg = TIER_CONFIG[tierName];
              const isSelected = activeTier === tierName;
              return (
                <button
                  key={tierName}
                  type="button"
                  onClick={() => setActiveTier(tierName)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  {cfg.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company, or sector…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sgx-blue focus:bg-white focus:ring-2 focus:ring-sgx-blue/20"
            />
          </div>
        </div>

        {activeTier !== "ALL" && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between">
            <span>{TIER_CONFIG[activeTier].blurb}</span>
            {TIER_CONFIG[activeTier].beginnerFriendly && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                🟢 Recommended for First Trade
              </span>
            )}
          </div>
        )}

        {/* 20 SGX Company Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTickers.map((ticker) => {
            const meta = TICKER_META[ticker];
            const quote: LiveQuoteItem | undefined = snapshot.quotes[ticker];
            const tierCfg = TIER_CONFIG[meta.tier];

            const price = quote?.price ?? meta.refPrice;
            const changePct = quote?.changePct ?? meta.refChangePct;
            const changeAmt = quote?.change ?? 0;
            const volume = quote?.volume ?? meta.refVolume;
            const bid = quote?.bid ?? price;
            const ask = quote?.ask ?? price;
            const dayLow = quote?.dayLow ?? price * 0.99;
            const dayHigh = quote?.dayHigh ?? price * 1.01;
            const up = changePct >= 0;
            const flash = flashedTickers[ticker];

            const rangeSpan = Math.max(0.001, dayHigh - dayLow);
            const rangePos = Math.min(
              100,
              Math.max(0, Math.round(((price - dayLow) / rangeSpan) * 100)),
            );

            return (
              <Link
                key={ticker}
                href={`/company/${ticker}`}
                className={`group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sgx-blue hover:shadow-md ${
                  flash === "bull"
                    ? "animate-flash-bull"
                    : flash === "bear"
                      ? "animate-flash-bear"
                      : ""
                }`}
              >
                <div>
                  {/* Header: Ticker Pill & Tier Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {ticker}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tierCfg.pillBg} ${tierCfg.pillText} ${tierCfg.pillBorder}`}
                    >
                      {tierCfg.shortLabel}
                    </span>
                  </div>

                  {/* Company Name & Sector */}
                  <h3 className="mt-2.5 font-display text-sm font-bold text-slate-900 group-hover:text-sgx-blue transition line-clamp-1">
                    {meta.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">{meta.sector}</p>

                  {/* Price, Change Pill & Mini Sparkline */}
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
                        S${formatSgxPrice(price)}
                      </p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                          up
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {up ? "▲" : "▼"} {up ? "+" : ""}
                        {changePct.toFixed(2)}% ({up ? "+" : ""}
                        {formatSgxPrice(changeAmt)})
                      </span>
                    </div>

                    <MiniSparkline
                      points={quote?.sparkline ?? [price, price]}
                      isUp={up}
                    />
                  </div>
                </div>

                {/* Bottom SGX Market Micro-Stats (Bid/Ask, Day Range, Volume) */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-[11px]">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-emerald-700">
                      Bid: <strong>S${formatSgxPrice(bid)}</strong>
                    </span>
                    <span className="text-rose-700">
                      Ask: <strong>S${formatSgxPrice(ask)}</strong>
                    </span>
                  </div>

                  {/* Day Low - High Progress Bar */}
                  <div>
                    <div className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span>L: S${formatSgxPrice(dayLow)}</span>
                      <span>H: S${formatSgxPrice(dayHigh)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          up ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${rangePos}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-slate-400" />
                      Vol: <strong className="font-mono text-slate-700">{formatVolumeShort(volume)}</strong>
                    </span>
                    <span className="font-semibold text-sgx-blue group-hover:underline">
                      Trade Lot →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
