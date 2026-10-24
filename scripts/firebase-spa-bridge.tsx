import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

if (typeof window !== "undefined") {
  (window as unknown as { React: typeof React }).React = React;
}
import type {
  AppSettingsDoc,
  ChartTimeframe,
  ClassGroupDoc,
  HoldingDoc,
  LimitOrderDoc,
  LiveQuoteItem,
  MarketLiveSnapshotDoc,
  OhlcvCandle,
  OrderType,
  PortfolioSnapshotDoc,
  PreauthorizedUserDoc,
  ReflectionDoc,
  TradeAction,
  TradeHistoryDoc,
  UserProfileDoc,
  UserRole,
  WeeklyChallengeDoc,
} from "../src/types/firestore";
import { TICKER_META, TIER_CONFIG, VALID_TICKERS } from "../src/utils/tickers";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  formatSgd,
  formatSgxPrice,
  generateDeterministicSparkline,
  getSgxSessionStatus,
  getSgxTickSize,
  roundToSgxTick,
} from "../src/utils/sgx-market";

// Import the actual application UI components from src/
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import OnboardingFlow from "../src/components/OnboardingFlow";
import LoginClient from "../src/app/login/LoginClient";
import DashboardClient from "../src/app/dashboard/DashboardClient";
import PortfolioClient, {
  type EnrichedHoldingRow,
} from "../src/app/portfolio/PortfolioClient";
import LeaderboardClient, {
  type LeaderboardStudentRow,
} from "../src/app/leaderboard/LeaderboardClient";
import AdminClient from "../src/app/admin/AdminClient";
import LaunchClient from "../src/app/launch/LaunchClient";
import SgxCopilotClient from "../src/app/copilot/CopilotClient";
import SgxProChart from "../src/components/company/SgxProChart";
import SgxOrderTicket from "../src/components/company/SgxOrderTicket";
import SgxDividendCalculator from "../src/components/company/SgxDividendCalculator";
import AiCoachSection from "../src/components/ai/AiCoachSection";
import { ArrowLeft, BookOpen, Bot, Briefcase, Building2, CheckCircle2, HelpCircle } from "lucide-react";

declare const __INITIAL_SEED_DB__: {
  appSettings: AppSettingsDoc;
  marketSnapshot: MarketLiveSnapshotDoc;
  users: Record<string, UserProfileDoc>;
  holdings: Record<string, Record<string, HoldingDoc>>;
  tradeHistory: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
  portfolioHistory: PortfolioSnapshotDoc[];
  classGroups: Record<string, ClassGroupDoc>;
  weeklyChallenges: Record<string, WeeklyChallengeDoc>;
  reflections: Record<string, ReflectionDoc>;
  preauthorizedUsers: Record<string, PreauthorizedUserDoc>;
};

const STORAGE_KEY = "sgx_edu_trader_v3_cloud_db";
const SESSION_UID_KEY = "sgx_edu_trader_v3_active_uid";

export function getBrowserDb(): typeof __INITIAL_SEED_DB__ {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.marketSnapshot) {
        if (
          !parsed.marketSnapshot.updatedAt ||
          Date.now() - new Date(parsed.marketSnapshot.updatedAt).getTime() > 120000
        ) {
          parsed.marketSnapshot.updatedAt = new Date().toISOString();
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  const copy = JSON.parse(JSON.stringify(__INITIAL_SEED_DB__));
  if (copy?.marketSnapshot) {
    copy.marketSnapshot.updatedAt = new Date().toISOString();
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch {
    // ignore
  }
  return copy;
}

export function saveBrowserDb(db: typeof __INITIAL_SEED_DB__) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("sgx:db-mutated"));
}

export function getActiveUid(): string {
  try {
    return localStorage.getItem(SESSION_UID_KEY) || "user-student-1";
  } catch {
    return "user-student-1";
  }
}

export function setActiveUid(uid: string | null) {
  try {
    if (!uid) {
      localStorage.removeItem(SESSION_UID_KEY);
    } else {
      localStorage.setItem(SESSION_UID_KEY, uid);
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("sgx:db-mutated"));
}

export function generateClientCandles(
  ticker: string,
  timeframe: ChartTimeframe,
  currentPrice: number,
  baseVolume: number,
): OhlcvCandle[] {
  const tick = getSgxTickSize(currentPrice);
  const decimals = tick < 0.01 ? 3 : 2;
  let count = 60;
  let stepSeconds = 300;
  if (timeframe === "1D") {
    count = 78;
    stepSeconds = 300;
  } else if (timeframe === "5D") {
    count = 96;
    stepSeconds = 900;
  } else if (timeframe === "1M") {
    count = 30;
    stepSeconds = 86400;
  } else if (timeframe === "6M") {
    count = 120;
    stepSeconds = 86400;
  } else {
    count = 220;
    stepSeconds = 86400;
  }

  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 41 + ticker.charCodeAt(i)) % 10007;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const alignedNow = Math.floor(nowSec / stepSeconds) * stepSeconds;
  const closes: number[] = new Array(count);
  closes[count - 1] = currentPrice;

  for (let i = count - 2; i >= 0; i--) {
    const wave =
      Math.sin((i + (seed % 19)) * 0.27) * 0.0045 +
      Math.cos((i * 1.7 + (seed % 13)) * 0.41) * 0.0035;
    const prev = closes[i + 1] / (1 + wave);
    closes[i] = Number(Math.max(tick * 5, roundToSgxTick(prev)).toFixed(decimals));
  }

  const candles: OhlcvCandle[] = [];
  for (let i = 0; i < count; i++) {
    const time = alignedNow - (count - 1 - i) * stepSeconds;
    const close = closes[i];
    const open =
      i === 0
        ? Number(roundToSgxTick(close * 0.996).toFixed(decimals))
        : closes[i - 1];
    const wick = 1 + ((seed + i * 7) % 4);
    const high = Number((Math.max(open, close) + wick * tick).toFixed(decimals));
    const low = Number(
      Math.max(tick, Math.min(open, close) - wick * tick).toFixed(decimals),
    );
    const volFactor = 0.5 + (((seed + i * 23) % 110) / 100);
    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.max(100, Math.round((baseVolume / 25) * volFactor)),
    });
  }
  return candles;
}

// Intercept fetch calls for /api/auth/session and /api/market/chart/* in static hosting mode
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (urlStr.includes("/api/auth/session")) {
    const method = (init?.method ?? "GET").toUpperCase();
    const db = getBrowserDb();
    if (method === "DELETE") {
      setActiveUid(null);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (method === "POST" && init?.body) {
      const body = JSON.parse(String(init.body)) as {
        demoEmail?: string;
        demoName?: string;
      };
      const email = (body.demoEmail ?? "student1@gmail.com").toLowerCase().trim();
      let found = Object.values(db.users).find(
        (u) => u.email.toLowerCase() === email,
      );
      if (!found) {
        const now = new Date().toISOString();
        const role: UserRole =
          email.includes("admin") || email.includes("medthilda")
            ? "superadmin"
            : email.includes("teacher")
              ? "teacher"
              : "student";
        const uid = `gmail-${email.replace(/[^a-z0-9]/g, "-")}`;
        found = {
          uid,
          email,
          nickname: body.demoName || email.split("@")[0] || "Trader",
          photoURL: null,
          role,
          classGroupIds: ["class-sec4-express-a"],
          startingCapital: 10000,
          cashBalance: 10000,
          holdingsValue: 0,
          netValue: 10000,
          totalFeesPaid: 0,
          hhi: 1,
          tradingLocked: false,
          coolingOffUntil: null,
          hasCompletedTutorial: true,
          acceptedTermsAt: now,
          achievementCount: 0,
          achievements: {},
          createdAt: now,
          lastLoginAt: now,
        };
        db.users[uid] = found;
        db.holdings[uid] = {};
        saveBrowserDb(db);
      }
      setActiveUid(found.uid);
      return new Response(JSON.stringify({ success: true, user: found }), {
        status: 200,
      });
    }
    const uid = getActiveUid();
    const user = uid ? db.users[uid] ?? null : null;
    return new Response(
      JSON.stringify({ authenticated: Boolean(user), user }),
      { status: 200 },
    );
  }

  if (urlStr.includes("/api/market/chart/")) {
    const u = new URL(urlStr, window.location.origin);
    const parts = u.pathname.split("/");
    const ticker = decodeURIComponent(parts[parts.length - 1] || "D05.SI").toUpperCase();
    const range = (u.searchParams.get("range") || "1M") as ChartTimeframe;
    const db = getBrowserDb();
    const quote = db.marketSnapshot.quotes[ticker];
    const meta = TICKER_META[ticker] ?? TICKER_META["D05.SI"];
    const candles = generateClientCandles(
      ticker,
      range,
      quote?.price ?? meta.refPrice,
      quote?.volume ?? meta.refVolume,
    );
    return new Response(
      JSON.stringify({ success: true, ticker, timeframe: range, candles }),
      { status: 200 },
    );
  }

  return originalFetch(input, init);
};

// Router Context
interface RouterContextValue {
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
  refresh: () => void;
}

export const RouterCtx = createContext<RouterContextValue>({
  pathname: "/dashboard",
  searchParams: new URLSearchParams(),
  navigate: () => {},
  refresh: () => {},
});

function CompanyView({
  ticker,
  user,
  db,
}: {
  ticker: string;
  user: UserProfileDoc;
  db: typeof __INITIAL_SEED_DB__;
}) {
  const cleanTicker = VALID_TICKERS.includes(ticker) ? ticker : "D05.SI";
  const meta = TICKER_META[cleanTicker];
  const tierCfg = TIER_CONFIG[meta.tier];
  const quote = db.marketSnapshot.quotes[cleanTicker];
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

  const userHoldings = db.holdings[user.uid] ?? {};
  const myHolding = userHoldings[cleanTicker];
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
  const initialCandles = generateClientCandles(
    cleanTicker,
    "1M",
    livePrice,
    volume,
  );
  const { navigate } = useContext(RouterCtx);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-sgx-blue hover:text-sgx-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to SGX Market Screener
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/copilot?prompt=${encodeURIComponent(`What if I buy 1 lot of ${cleanTicker}?`)}`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-sgx-blue shadow-sm hover:bg-blue-100"
          >
            <Bot className="h-3.5 w-3.5" />
            Ask AI Copilot to Simulate or Trade {cleanTicker} →
          </button>
        </div>

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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                SGX: {cleanTicker}
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
              <strong className="text-emerald-700">S${formatSgxPrice(bid)}</strong>{" "}
              · Ask (Buy Now): <strong className="text-rose-700">S${formatSgxPrice(ask)}</strong>{" "}
              · Board Lot: <strong className="text-slate-800">100 shares</strong>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 lg:grid-cols-8 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Open</p>
            <p className="font-mono font-bold text-slate-900">S${formatSgxPrice(openPrice)}</p>
            <p className="text-[10px] text-slate-400">9:00 AM start price</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Prev Close</p>
            <p className="font-mono font-bold text-slate-900">S${formatSgxPrice(prevClose)}</p>
            <p className="text-[10px] text-slate-400">Yesterday&apos;s end price</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Day High</p>
            <p className="font-mono font-bold text-emerald-700">S${formatSgxPrice(dayHigh)}</p>
            <p className="text-[10px] text-slate-400">Highest price today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Day Low</p>
            <p className="font-mono font-bold text-rose-700">S${formatSgxPrice(dayLow)}</p>
            <p className="text-[10px] text-slate-400">Lowest price today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Volume</p>
            <p className="font-mono font-bold text-slate-900">{volume.toLocaleString("en-SG")}</p>
            <p className="text-[10px] text-slate-400">Shares traded today</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Market Cap</p>
            <p className="font-mono font-bold text-slate-900">{meta.marketCapB}</p>
            <p className="text-[10px] text-slate-400">Total company value</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">P/E Ratio</p>
            <p className="font-mono font-bold text-slate-900">{meta.peRatio.toFixed(1)}x</p>
            <p className="text-[10px] text-slate-400">Price per S$1 profit</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Div Yield</p>
            <p className="font-mono font-bold text-sgx-blue">{meta.dividendYieldPct.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400">Annual cash payout %</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <SgxProChart
            ticker={cleanTicker}
            initialCandles={initialCandles}
            livePrice={livePrice}
          />

          <SgxDividendCalculator
            ticker={cleanTicker}
            companyName={meta.name}
            livePrice={livePrice}
            dividendYieldPct={meta.dividendYieldPct}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Briefcase className="h-4 w-4 text-sgx-blue" />
                My Position in {meta.shortName} ({cleanTicker})
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

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <SgxOrderTicket
              ticker={cleanTicker}
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
              allowOddLots={db.appSettings.allowOddLots}
              feeMode={db.appSettings.feeMode}
            />
          </div>
        </div>
      </div>

      <AiCoachSection ticker={cleanTicker} />
    </main>
  );
}

function AppShell() {
  const [pathname, setPathname] = useState<string>(() => {
    const p = window.location.pathname;
    return p === "/" ? "/dashboard" : p;
  });
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    () => new URLSearchParams(window.location.search),
  );
  const [tickVersion, setTickVersion] = useState(0);

  useEffect(() => {
    const onPop = () => {
      setPathname(window.location.pathname === "/" ? "/dashboard" : window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };
    const onMutate = () => setTickVersion((v) => v + 1);
    window.addEventListener("popstate", onPop);
    window.addEventListener("sgx:db-mutated", onMutate);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("sgx:db-mutated", onMutate);
    };
  }, []);

  const navigate = (to: string) => {
    const u = new URL(to, window.location.origin);
    window.history.pushState({}, "", u.pathname + u.search);
    setPathname(u.pathname === "/" ? "/dashboard" : u.pathname);
    setSearchParams(new URLSearchParams(u.search));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = () => setTickVersion((v) => v + 1);

  const db = getBrowserDb();
  const activeUid = getActiveUid();
  const currentUser =
    db.users[activeUid] ?? db.users["user-student-1"] ?? Object.values(db.users)[0];

  // Build views based on pathname
  let content: React.ReactNode = null;

  if (pathname === "/login") {
    content = (
      <LoginClient
        schoolName={db.appSettings.schoolName}
        isFirebaseConfigured={true}
      />
    );
  } else if (pathname === "/copilot") {
    const rawHoldings = Object.values(db.holdings[currentUser.uid] ?? {}).filter(
      (h) => h.shares > 0,
    );
    const userTrades = db.tradeHistory.filter(
      (t) => t.userId === currentUser.uid,
    );
    const userLimits = db.limitOrders.filter(
      (o) => o.userId === currentUser.uid,
    );
    content = (
      <SgxCopilotClient
        key={pathname + searchParams.toString()}
        initialUser={currentUser}
        initialSettings={db.appSettings}
        initialSnapshot={db.marketSnapshot}
        initialHoldings={rawHoldings}
        initialTrades={userTrades}
        initialLimitOrders={userLimits}
      />
    );
  } else if (pathname.startsWith("/company/")) {
    const ticker = decodeURIComponent(
      pathname.replace("/company/", "").split("/")[0] || "D05.SI",
    ).toUpperCase();
    content = <CompanyView ticker={ticker} user={currentUser} db={db} />;
  } else if (pathname === "/portfolio") {
    const rawHoldings = Object.values(db.holdings[currentUser.uid] ?? {}).filter(
      (h) => h.shares > 0,
    );
    const enriched: EnrichedHoldingRow[] = rawHoldings.map((h) => {
      const meta = TICKER_META[h.ticker] ?? TICKER_META["D05.SI"];
      const currentPrice =
        db.marketSnapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const marketValue = Number((h.shares * currentPrice).toFixed(2));
      const costBasis = Number((h.shares * h.avgPrice).toFixed(2));
      const pnl = Number((marketValue - costBasis).toFixed(2));
      const pnlPct =
        costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;
      return {
        ticker: h.ticker,
        companyName: meta.name,
        shortName: meta.shortName,
        tier: meta.tier,
        sector: meta.sector,
        shares: h.shares,
        avgPrice: h.avgPrice,
        currentPrice,
        marketValue,
        costBasis,
        pnl,
        pnlPct,
      };
    });
    const userTrades = db.tradeHistory.filter(
      (t) => t.userId === currentUser.uid,
    );
    const userLimits = db.limitOrders.filter(
      (o) => o.userId === currentUser.uid,
    );
    const userHist = db.portfolioHistory.filter(
      (p) => p.userId === currentUser.uid,
    );
    const userRefls = Object.values(db.reflections).filter(
      (r) => r.userId === currentUser.uid,
    );
    content = (
      <PortfolioClient
        user={currentUser}
        holdings={enriched}
        history={userHist}
        trades={userTrades}
        limitOrders={userLimits}
        reflections={userRefls}
      />
    );
  } else if (pathname === "/leaderboard") {
    const students = Object.values(db.users).filter((u) => u.role === "student");
    const studentRows: LeaderboardStudentRow[] = students.map((s) => ({
      uid: s.uid,
      nickname: s.nickname || s.email.split("@")[0] || "Trader",
      netValue: s.netValue,
      startingCapital: s.startingCapital || 10000,
      totalFeesPaid: s.totalFeesPaid || 0,
      hhi: s.hhi ?? 1,
      achievementCount: s.achievementCount || 0,
    }));
    content = (
      <LeaderboardClient
        students={studentRows}
        currentUserId={currentUser.uid}
        mode={db.appSettings.leaderboardMode || "named"}
      />
    );
  } else if (pathname === "/admin") {
    const adminUser =
      currentUser.role === "teacher" || currentUser.role === "superadmin"
        ? currentUser
        : db.users["user-superadmin-1"] ?? currentUser;
    content = (
      <AdminClient
        currentUser={adminUser}
        settings={db.appSettings}
        users={Object.values(db.users)}
        classes={Object.values(db.classGroups)}
        challenges={Object.values(db.weeklyChallenges)}
        trades={db.tradeHistory}
        reflections={Object.values(db.reflections)}
        marketUpdatedAt={db.marketSnapshot.updatedAt}
      />
    );
  } else if (pathname === "/launch") {
    content = (
      <LaunchClient
        schoolName={db.appSettings.schoolName}
        semester={db.appSettings.currentSemester}
        tickersCount={Object.keys(db.marketSnapshot.quotes).length}
        classCodes={Object.values(db.classGroups).map((c) => ({
          name: c.name,
          code: c.joinCode,
        }))}
      />
    );
  } else {
    const challenge = Object.values(db.weeklyChallenges)[0] ?? null;
    content = (
      <DashboardClient
        initialUser={currentUser}
        initialSnapshot={db.marketSnapshot}
        activeChallenge={challenge}
      />
    );
  }

  return (
    <RouterCtx.Provider
      value={{
        pathname,
        searchParams,
        navigate,
        refresh,
      }}
    >
      <div className="min-h-screen flex flex-col bg-sgx-canvas text-sgx-ink">
        {pathname !== "/login" && (
          <>
            <Navbar initialUser={currentUser} />
            <OnboardingFlow user={currentUser} />
          </>
        )}
        <div className="flex-1">{content}</div>
        <Footer />
      </div>
    </RouterCtx.Provider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<AppShell />);
}
