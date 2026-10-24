"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Bot,
  Briefcase,
  Calculator,
  CheckCircle2,
  Coins,
  Download,
  FileText,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Play,
  Receipt,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { runSgxCopilotAction } from "@/actions/copilot";
import {
  cancelLimitOrderAction,
  executeSgxTradeAction,
  type ExecuteTradeResponse,
} from "@/actions/trade";
import { submitWeeklyReflectionAction } from "@/actions/reflection";
import {
  distributeClassDividendsAction,
  setClassTradingLockAction,
  updateExchangeSettingsAction,
} from "@/actions/admin";
import type {
  CopilotCard,
  CopilotTurnOutput,
} from "@/lib/copilot-engine";
import type {
  AppSettingsDoc,
  HoldingDoc,
  LimitOrderDoc,
  MarketLiveSnapshotDoc,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";
import { formatSgd, formatSgxPrice } from "@/utils/sgx-market";
import { TIER_CONFIG } from "@/utils/tickers";

interface Props {
  initialUser: UserProfileDoc;
  initialSettings: AppSettingsDoc;
  initialSnapshot: MarketLiveSnapshotDoc;
  initialHoldings: HoldingDoc[];
  initialTrades: TradeHistoryDoc[];
  initialLimitOrders: LimitOrderDoc[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  timestamp: string;
  text: string;
  output?: CopilotTurnOutput;
  executedNote?: NonNullable<ExecuteTradeResponse["data"]>;
}

const GEMINI_KEY_STORAGE = "sgx_edu_trader_optional_gemini_key";

const QUICK_CATEGORIES = [
  {
    title: "🛒 Trade & Order Ticket",
    prompts: [
      "Buy 1 lot of DBS (D05.SI)",
      "Buy 2 lots of Sheng Siong (OV8.SI)",
      "Limit buy 100 shares of Singtel at S$4.05",
      "Show my open limit orders",
    ],
  },
  {
    title: "🧪 What-If & Risk Lab",
    prompts: [
      "What if I buy 2 lots of SIA (C6L.SI)?",
      "Analyse my portfolio health & Smart Score",
      "Stress-test my portfolio against an Energy & Oil Shock",
      "Project 5-year DRIP dividends for 5 lots of OCBC",
    ],
  },
  {
    title: "🔍 Compare & Screen SGX",
    prompts: [
      "Compare the 3 Singapore banks (DBS, OCBC, UOB)",
      "Show me Safe Bets on SGX",
      "Show me affordable SGX Board Lots under S$2.50",
      "Compare Singtel and ComfortDelGro",
    ],
  },
  {
    title: "🎓 Learn, Reflect & Guardrails",
    prompts: [
      "Explain Bid vs Ask and 100-share Board Lots",
      "Explain P/E Ratio simply",
      "Help me draft my weekly reflection",
      "Which stock will go up tomorrow? (Test Guardrail)",
    ],
  },
  {
    title: "🛡️ Teacher Controls",
    prompts: [
      "Toggle 1-share odd lots for beginners",
      "Toggle SGX fee mode",
      "Distribute quarterly dividends to class",
      "Export gradebook to Google Sheets CSV",
    ],
  },
];

export default function SgxCopilotClient({
  initialUser,
  initialSettings,
  initialHoldings,
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileDoc>(initialUser);
  const [settings, setSettings] = useState<AppSettingsDoc>(initialSettings);
  const [input, setInput] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [reflectionDraftText, setReflectionDraftText] = useState("");
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExecutingCard, startCardExecution] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const handledUrlPromptRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-msg",
      role: "assistant",
      timestamp: new Date().toLocaleTimeString("en-SG", {
        timeZone: "Asia/Singapore",
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: `Welcome to the Google Cloud & Gemini Agentic SGX Copilot, ${initialUser.nickname}! You currently have S$${formatSgd(initialUser.cashBalance)} in buying power and ${initialHoldings.filter((h) => h.shares > 0).length} active SGX holdings (Net Value: S$${formatSgd(initialUser.netValue)} · Diversification: ${Math.round((1 - (initialUser.hhi ?? 1)) * 100)}%).\n\nAsk me in plain English to buy or sell SGX Board Lots, simulate 'What-If' diversification & fee impacts, compare SGX companies, project tax-free dividends, stress-test your portfolio, or save your weekly reflection!`,
      output: {
        toolUsed: "welcome_assistant",
        headline: "Ready for Natural-Language SGX Orders & Socratic Coaching",
        explanation:
          "Click any quick action on the left or type a command below (e.g., 'Buy 1 lot of DBS', 'What if I buy 200 shares of Sheng Siong?', or 'Compare DBS, OCBC, and UOB').",
        socraticQuestion:
          "Tip: Under MAS educational guardrails, I will never pick stocks for you — instead, I prepare transparent SGX order tickets and comparisons so YOU make the final call.",
        card: null,
        followUpChips: [
          "Buy 1 lot of DBS (D05.SI)",
          "What if I buy 2 lots of Sheng Siong?",
          "Compare the 3 Singapore banks",
          "Analyse my portfolio health",
        ],
      },
    },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GEMINI_KEY_STORAGE);
      if (saved) setGeminiApiKey(saved);
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4500);
  };

  const sendPrompt = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;

    const nowStr = new Date().toLocaleTimeString("en-SG", {
      timeZone: "Asia/Singapore",
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      timestamp: nowStr,
      text: clean,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      const res = await runSgxCopilotAction(clean, geminiApiKey);
      if (!res.success || !res.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            timestamp: nowStr,
            text: res.error ?? "Unable to process request right now.",
          },
        ]);
        return;
      }

      if (res.data.card?.type === "reflection_helper") {
        setReflectionDraftText(res.data.card.suggestedDraft);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          timestamp: nowStr,
          text: res.data!.explanation,
          output: res.data,
        },
      ]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });
  };

  // Auto-run ?prompt=... deep link if navigated from Company or Portfolio page
  useEffect(() => {
    if (handledUrlPromptRef.current || typeof window === "undefined") return;
    const urlPrompt = new URLSearchParams(window.location.search).get("prompt");
    if (urlPrompt && urlPrompt.trim()) {
      handledUrlPromptRef.current = true;
      sendPrompt(urlPrompt.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmOrderCard = (
    msgId: string,
    ticker: string,
    action: "buy" | "sell",
    orderType: "market" | "limit",
    shares: number,
    limitPrice: number | null,
  ) => {
    startCardExecution(async () => {
      const res = await executeSgxTradeAction({
        ticker,
        shares,
        action,
        orderType,
        limitPrice,
      });

      if (!res.success || !res.data) {
        showToast(res.error ?? "Order rejected by SGX matching engine.");
        return;
      }

      const tradeData = res.data;
      setUser((prev) => ({
        ...prev,
        cashBalance: tradeData.cashBalance,
        netValue: tradeData.netValue,
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sgx:balance-updated", {
            detail: {
              cashBalance: tradeData.cashBalance,
              netValue: tradeData.netValue,
            },
          }),
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, executedNote: tradeData } : m,
        ),
      );

      showToast(
        `Executed ${action.toUpperCase()} ${shares} ${ticker} — Contract Note ${tradeData.contractNoteNo} issued!`,
      );
      router.refresh();
    });
  };

  const handleTeacherCardAction = (
    actionKey:
      | "toggle_odd_lots"
      | "toggle_fee_mode"
      | "pause_trading"
      | "resume_trading"
      | "distribute_dividends"
      | "export_gradebook",
  ) => {
    startCardExecution(async () => {
      if (actionKey === "toggle_odd_lots") {
        const res = await updateExchangeSettingsAction({
          allowOddLots: !settings.allowOddLots,
        });
        if (res.success && res.data) {
          setSettings(res.data);
          showToast(
            `Updated Board Lot Rule: ${res.data.allowOddLots ? "1-Share Odd Lots Enabled" : "Strict 100-Share Board Lots"}`,
          );
        }
      } else if (actionKey === "toggle_fee_mode") {
        const nextMode =
          settings.feeMode === "sgx_realistic" ? "flat_10" : "sgx_realistic";
        const res = await updateExchangeSettingsAction({ feeMode: nextMode });
        if (res.success && res.data) {
          setSettings(res.data);
          showToast(
            `Updated Fee Mode: ${nextMode === "sgx_realistic" ? "Authentic SGX + CDP + 9% GST" : "Simplified S$10 Flat Fee"}`,
          );
        }
      } else if (actionKey === "pause_trading") {
        await setClassTradingLockAction("ALL", true);
        showToast("Paused classroom trading for all students.");
      } else if (actionKey === "resume_trading") {
        await setClassTradingLockAction("ALL", false);
        showToast("Resumed classroom trading for all students.");
      } else if (actionKey === "distribute_dividends") {
        const res = await distributeClassDividendsAction("ALL");
        if (res.success && res.data) {
          showToast(
            `Distributed S$${formatSgd(res.data.totalDividendSgd)} in tax-exempt dividends across ${res.data.studentsCredited} students!`,
          );
        }
      } else if (actionKey === "export_gradebook") {
        router.push("/admin");
        showToast("Opened Teacher Console Gradebook Exporter.");
      }
      router.refresh();
    });
  };

  const renderCard = (msg: ChatMessage, card: CopilotCard) => {
    // If this order preview card was already executed, show the official SGX Contract Note!
    if (msg.executedNote) {
      const note = msg.executedNote;
      return (
        <div className="mt-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {note.contractNoteNo} · CDP T+2 Settlement
                </p>
                <p className="font-display text-sm font-bold text-slate-900">
                  {note.status === "filled"
                    ? "Official SGX Contract Note Executed"
                    : "SGX Limit Order Added to Queue"}
                </p>
              </div>
            </div>
            <Receipt className="h-5 w-5 text-emerald-700" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 font-mono">
            <div className="rounded-xl bg-white p-2.5 border border-emerald-200/80">
              <span className="font-sans text-[10px] text-slate-400 block">
                Action &amp; Counter
              </span>
              <strong className="text-slate-900 uppercase">
                {note.action} {note.ticker}
              </strong>
            </div>
            <div className="rounded-xl bg-white p-2.5 border border-emerald-200/80">
              <span className="font-sans text-[10px] text-slate-400 block">
                Quantity &amp; Price
              </span>
              <strong className="text-slate-900">
                {note.shares} @ S${formatSgxPrice(note.executionPrice)}
              </strong>
            </div>
            <div className="rounded-xl bg-white p-2.5 border border-emerald-200/80">
              <span className="font-sans text-[10px] text-slate-400 block">
                SGX + CDP + GST Fees
              </span>
              <strong className="text-amber-700">
                S${formatSgd(note.fees.totalFee)}
              </strong>
            </div>
            <div className="rounded-xl bg-white p-2.5 border border-emerald-200/80">
              <span className="font-sans text-[10px] text-slate-400 block">
                Net Settlement Total
              </span>
              <strong className="text-sgx-blue">
                S${formatSgd(note.fees.netTotal)}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <span className="font-mono text-slate-700">
              Updated Cash Buying Power:{" "}
              <strong>S${formatSgd(note.cashBalance)}</strong>
            </span>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1 font-bold text-sgx-blue hover:underline"
            >
              View Printable T+2 Note in Portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      );
    }

    switch (card.type) {
      case "guardrail_refusal":
        return (
          <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
              {card.ruleTriggered}
            </div>
            <p className="text-amber-900/90 leading-relaxed">
              {card.educationalReason}
            </p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              {card.suggestedExplorations.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendPrompt(s)}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {s} →
                </button>
              ))}
            </div>
          </div>
        );

      case "order_preview": {
        const isBuy = card.action === "buy";
        return (
          <div className="mt-3 rounded-2xl border-2 border-blue-200 bg-slate-50/90 p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sgx-blue">
                  Interactive SGX Order Confirmation Ticket
                </span>
                <h4 className="font-display text-sm font-bold text-slate-900">
                  {card.action.toUpperCase()} {card.shares.toLocaleString()}{" "}
                  Shares ({card.boardLots} Board Lots) · {card.companyName} (
                  {card.ticker})
                </h4>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${
                  isBuy
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {card.orderType} {card.action} @ S$
                {formatSgxPrice(card.effectivePrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono">
              <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Gross Principal
                </span>
                <strong className="text-slate-900">
                  S${formatSgd(card.fees.grossAmount)}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                <span className="font-sans text-[10px] text-slate-400 block">
                  SGX + CDP + 9% GST
                </span>
                <strong className="text-amber-700">
                  S${formatSgd(card.fees.totalFee)} ({card.feeDragPct}%)
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Net {isBuy ? "Total Cost" : "Proceeds"}
                </span>
                <strong className="text-sgx-blue">
                  S${formatSgd(card.fees.netTotal)}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Diversification (1−HHI)
                </span>
                <strong className="text-slate-900">
                  {card.diversificationPctBefore}% →{" "}
                  {card.diversificationPctAfter}%
                </strong>
              </div>
            </div>

            {card.highFeeDragWarning && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{card.highFeeDragWarning}</span>
              </div>
            )}

            {card.validationError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                ⚠️ {card.validationError}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-[11px] text-slate-600">
                  Cash After Trade:{" "}
                  <strong className="text-slate-900">
                    S${formatSgd(Math.max(0, card.cashAfter))}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/company/${card.ticker}`}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Open Pro Chart
                  </Link>
                  <button
                    type="button"
                    disabled={isExecutingCard}
                    onClick={() =>
                      handleConfirmOrderCard(
                        msg.id,
                        card.ticker,
                        card.action,
                        card.orderType,
                        card.shares,
                        card.limitPrice,
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                      isBuy
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isExecutingCard
                      ? "Routing to SGX Engine…"
                      : `Confirm & Execute ${card.action.toUpperCase()} (${card.shares} sh)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "what_if":
        return (
          <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-sgx-blue" />
                Before vs. After Trade Impact Simulation ({card.ticker})
              </span>
              <span className="font-mono text-[11px] font-bold text-sgx-blue">
                Fee Drag: {card.feeDragPct}% (S${formatSgd(card.totalFee)})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Cash Balance
                </span>
                <span className="text-slate-500">
                  S${formatSgd(card.cashBefore)}
                </span>{" "}
                →{" "}
                <strong className="text-slate-900">
                  S${formatSgd(Math.max(0, card.cashAfter))}
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Diversification (1−HHI)
                </span>
                <span className="text-slate-500">
                  {card.diversificationPctBefore}%
                </span>{" "}
                →{" "}
                <strong className="text-sgx-blue">
                  {card.diversificationPctAfter}%
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Smart Investor Score
                </span>
                <span className="text-slate-500">
                  {card.smartScoreBefore.toFixed(2)}
                </span>{" "}
                →{" "}
                <strong className="text-emerald-700">
                  {card.smartScoreAfter.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  sendPrompt(
                    `${card.action} ${card.shares} shares of ${card.ticker}`,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                Stage This Order Ticket ({card.shares} sh {card.ticker}) →
              </button>
            </div>
          </div>
        );

      case "comparison":
      case "screener": {
        const items = card.items;
        return (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">SGX Counter</th>
                  <th className="px-3 py-2.5">Risk Tier</th>
                  <th className="px-3 py-2.5 text-right">Live Price</th>
                  <th className="px-3 py-2.5 text-right">1 Lot (100 sh)</th>
                  <th className="px-3 py-2.5 text-right">P/E Ratio</th>
                  <th className="px-3 py-2.5 text-right">Div Yield</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const tierCfg = TIER_CONFIG[item.tier];
                  return (
                    <tr key={item.ticker} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/company/${item.ticker}`}
                          className="font-bold text-slate-900 hover:text-sgx-blue"
                        >
                          {item.shortName}
                        </Link>
                        <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                          ({item.ticker})
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tierCfg.pillBg} ${tierCfg.pillText} ${tierCfg.pillBorder}`}
                        >
                          {tierCfg.shortLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        S${formatSgxPrice(item.price)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        S${formatSgd(item.lotCostSgd)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        {item.peRatio.toFixed(1)}x
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {item.dividendYieldPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            sendPrompt(`Buy 1 lot of ${item.ticker}`)
                          }
                          className="rounded-lg bg-sgx-blue px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                        >
                          Buy 1 Lot
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      case "portfolio_audit":
        return (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono">
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Net Account Value
                </span>
                <strong className="text-slate-900">
                  S${formatSgd(card.netValue)}
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Diversification (1−HHI)
                </span>
                <strong className="text-sgx-blue">
                  {card.diversificationPct}%
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Smart Investor Score
                </span>
                <strong className="text-emerald-700">
                  {card.smartScore >= 0
                    ? `+${card.smartScore.toFixed(2)}`
                    : card.smartScore.toFixed(2)}
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Total Fees Paid
                </span>
                <strong className="text-amber-700">
                  S${formatSgd(card.totalFeesPaid)} ({card.feeDragOnCapitalPct}
                  %)
                </strong>
              </div>
            </div>
            {card.missingTiers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-2.5">
                <span className="text-slate-700">
                  <strong>Missing SGX Risk Tiers:</strong>{" "}
                  {card.missingTiers.join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    sendPrompt(`Show me ${card.missingTiers[0]} on SGX`)
                  }
                  className="rounded-lg bg-sgx-blue px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  Explore {card.missingTiers[0]} →
                </button>
              </div>
            )}
          </div>
        );

      case "dividend_projection":
        return (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-700" />
                {card.years}-Year Tax-Exempt SGX Dividend Projection (
                {card.companyName})
              </span>
              <span className="font-mono font-bold text-emerald-700">
                Yield: {card.dividendYieldPct.toFixed(2)}% p.a.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="rounded-xl bg-white p-2.5 border border-emerald-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Principal ({card.lots} Lots)
                </span>
                <strong className="text-slate-900">
                  S${formatSgd(card.principalSgd)}
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-emerald-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Total Dividends (With DRIP)
                </span>
                <strong className="text-emerald-700">
                  ▲ S${formatSgd(card.totalDividendsWithDrip)} profit
                </strong>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-emerald-200">
                <span className="font-sans text-[10px] text-slate-400 block">
                  Projected End Value
                </span>
                <strong className="text-sgx-blue">
                  S${formatSgd(card.projectedEndValueWithDrip)}
                </strong>
              </div>
            </div>
          </div>
        );

      case "stress_test": {
        const up = card.estimatedDeltaSgd >= 0;
        return (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">
                {card.scenarioTitle}
              </span>
              <span
                className={`font-mono font-extrabold ${
                  up ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {up ? "▲" : "▼"} S$
                {formatSgd(Math.abs(card.estimatedDeltaSgd))}{" "}
                {up ? "profit" : "loss"} ({up ? "+" : ""}
                {card.estimatedDeltaPct}%)
              </span>
            </div>
            {card.impacts.map((imp) => {
              const itemUp = imp.deltaSgd >= 0;
              return (
                <div
                  key={imp.ticker}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5"
                >
                  <span>
                    <strong>{imp.companyName}</strong> ({imp.ticker} ·{" "}
                    {imp.sector})
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      itemUp ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {itemUp ? "▲" : "▼"} S${formatSgd(Math.abs(imp.deltaSgd))}{" "}
                    {itemUp ? "profit" : "loss"} ({itemUp ? "+" : ""}
                    {imp.shockPct}%)
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case "limit_orders":
        return (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2 text-xs">
            {card.openOrders.length === 0 ? (
              <p className="text-slate-600">
                No active working Limit Orders in the queue.
              </p>
            ) : (
              card.openOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2"
                >
                  <div>
                    <span className="font-mono font-bold uppercase text-slate-900">
                      {o.action} {o.shares} {o.ticker}
                    </span>{" "}
                    <span className="font-mono text-slate-600">
                      @ Limit S${formatSgxPrice(o.limitPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isExecutingCard}
                    onClick={() =>
                      startCardExecution(async () => {
                        await cancelLimitOrderAction(o.id);
                        showToast(`Cancelled Limit Order ${o.id}`);
                        router.refresh();
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        );

      case "glossary":
        return (
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-2 text-xs">
            <p className="font-bold text-sgx-blue">{card.term}</p>
            <p className="text-slate-700">
              <strong>SGX Rule:</strong> {card.sgxRule}
            </p>
            <p className="text-slate-700">
              <strong>Layman Analogy:</strong> {card.laymanAnalogy}
            </p>
            <p className="rounded-xl bg-white border border-blue-100 p-2.5 font-mono text-[11px] text-slate-800">
              Example: {card.exampleMath}
            </p>
          </div>
        );

      case "reflection_helper":
        return (
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 text-xs">
            <p className="font-bold text-slate-900">
              Editable Week {card.weekNumber} Reflection Draft (Synced to
              Teacher Console):
            </p>
            <textarea
              rows={3}
              value={reflectionDraftText}
              onChange={(e) => setReflectionDraftText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 outline-none focus:border-sgx-blue"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isExecutingCard}
                onClick={() =>
                  startCardExecution(async () => {
                    const res = await submitWeeklyReflectionAction({
                      weekNumber: card.weekNumber,
                      promptQuestion:
                        "Weekly SGX Portfolio & Fee Strategy Reflection",
                      responseText: reflectionDraftText,
                    });
                    if (res.success) {
                      showToast(
                        `Saved Week ${card.weekNumber} Reflection to Teacher Console!`,
                      );
                    } else {
                      showToast(res.error ?? "Failed to save reflection.");
                    }
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Reflection to Teacher Console
              </button>
            </div>
          </div>
        );

      case "teacher_action":
        return (
          <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-700" />
                {card.title}
              </span>
              <span className="rounded-full bg-white border border-indigo-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
                {card.canExecute ? "Authorized" : "Teacher Only"}
              </span>
            </div>
            <p className="text-slate-700">{card.summary}</p>
            {card.canExecute && (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isExecutingCard}
                  onClick={() => handleTeacherCardAction(card.actionKey)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  Execute Classroom Command Now
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Copilot Header Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sgx-blue text-white shadow-sm">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
                Google Cloud &amp; Gemini · Agentic SGX Copilot
              </h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                14 Action Tools + MAS Socratic Guardrails Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Execute SGX Board Lot orders, run What-If diversification &amp;
              fee simulations, compare stocks, and manage classroom settings via
              chat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
          >
            <KeyRound className="h-3.5 w-3.5 text-sgx-blue" />
            {geminiApiKey ? "Live Gemini Key Connected" : "Connect Gemini Key (Optional)"}
          </button>
        </div>
      </section>

      {statusToast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {statusToast}
        </div>
      )}

      {showKeyModal && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">
              Optional: Connect Your Google AI Studio Gemini API Key
            </span>
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="text-slate-500 hover:text-slate-900 font-bold"
            >
              Close ✕
            </button>
          </div>
          <p className="text-slate-600">
            All 14 SGX Copilot tools (Order Tickets, What-If Simulator,
            Comparisons, Dividend Calculator, and Stress-Tester) work{" "}
            <strong>100% out of the box with zero API key required</strong>. If
            you optionally paste a Gemini API key below, it is saved locally in
            your browser to enrich Socratic explanations with live Gemini LLM
            generation.
          </p>
          <div className="flex gap-2">
            <input
              id="copilot-gemini-key-input"
              name="geminiApiKey"
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                setGeminiApiKey(e.target.value);
                try {
                  localStorage.setItem(GEMINI_KEY_STORAGE, e.target.value);
                } catch {
                  // ignore
                }
              }}
              placeholder="AIzaSy... (Optional Google Gemini API Key)"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => {
                setShowKeyModal(false);
                showToast("Saved Gemini API key preference.");
              }}
              className="rounded-xl bg-sgx-blue px-4 py-2 font-bold text-white"
            >
              Save
            </button>
          </div>
        </section>
      )}

      {/* Main Two-Column Copilot Layout: Quick Action Launcher (Left 4 cols) + Chat Stream (Right 8 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 4 Cols: Categorized 1-Click Agentic Tool Launcher */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sgx-blue" />
                1-Click Agentic Actions
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Cash: S${formatSgd(user.cashBalance)}
              </span>
            </div>

            <div className="space-y-4">
              {QUICK_CATEGORIES.map((cat) => (
                <div key={cat.title} className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500">
                    {cat.title}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {cat.prompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={isPending}
                        onClick={() => sendPrompt(p)}
                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-sgx-blue hover:bg-blue-50/50 hover:text-sgx-blue disabled:opacity-50"
                      >
                        <span className="truncate">{p}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right 8 Cols: Interactive Conversational Agent Stream */}
        <section className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-8 min-h-[640px]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[660px]">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-sgx-blue mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-4 ${
                      isUser
                        ? "bg-sgx-blue text-white"
                        : "border border-slate-200 bg-white text-slate-800 shadow-sm w-full"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-1">
                      <span className="font-bold uppercase tracking-wider">
                        {isUser
                          ? `${user.nickname} (${user.role})`
                          : `SGX AI Copilot · ${m.output?.toolUsed ?? "assistant"}`}
                      </span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>

                    {m.output?.headline && !isUser && (
                      <h3 className="font-display text-sm font-extrabold text-slate-900 mb-1">
                        {m.output.headline}
                      </h3>
                    )}

                    <p className="text-xs leading-relaxed whitespace-pre-line">
                      {m.text}
                    </p>

                    {/* Render Structured Interactive Card if present */}
                    {!isUser && m.output?.card && renderCard(m, m.output.card)}

                    {/* Socratic Reflection Question Footer */}
                    {!isUser && m.output?.socraticQuestion && (
                      <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-[11px] text-slate-700">
                        <strong className="text-sgx-blue">
                          🤔 Socratic Question:
                        </strong>{" "}
                        {m.output.socraticQuestion}
                      </div>
                    )}

                    {/* Follow-up Suggestion Chips */}
                    {!isUser &&
                      m.output?.followUpChips &&
                      m.output.followUpChips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                          {m.output.followUpChips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => sendPrompt(chip)}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-sgx-blue hover:bg-blue-50 hover:text-sgx-blue"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isPending && (
              <div className="flex items-center gap-2 text-xs font-semibold text-sgx-blue px-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                SGX AI Copilot is running financial calculations &amp; guardrails…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Bottom Natural-Language Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="border-t border-slate-200 bg-slate-50/70 p-4 rounded-b-3xl"
          >
            <div className="flex items-center gap-2">
              <input
                id="copilot-chat-input"
                name="copilotPrompt"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask SGX Copilot to buy/sell lots, simulate What-If trades, compare stocks, or explain concepts…"
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-sgx-blue px-5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>MAS &amp; MOE Educational Guardrail:</strong> SGX AI
                Copilot prepares transparent order tickets and Socratic analysis
                but never recommends which stock to buy or sell.
              </span>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
