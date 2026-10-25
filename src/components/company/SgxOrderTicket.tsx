"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Lock,
  Minus,
  Plus,
  Receipt,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { executeSgxTradeAction, type ExecuteTradeResponse } from "@/actions/trade";
import { markTutorialCompleteAction } from "@/actions/onboarding";
import AchievementToast from "@/components/AchievementToast";
import type { FeeMode, OrderType, TradeAction } from "@/types/firestore";
import {
  calculateAdminBidAsk,
  calculateSgxTradeFees,
  formatSgd,
  formatSgxPrice,
  generateSgxOrderBook,
  getSgxTickSize,
  roundToSgxTick,
} from "@/utils/sgx-market";
import { PRE_TRADE_THESIS_OPTIONS } from "@/utils/learning-science";

interface Props {
  ticker: string;
  companyName: string;
  livePrice: number;
  liveBid: number;
  liveAsk: number;
  liveVolume: number;
  initialCashBalance: number;
  initialHoldingShares: number;
  initialHoldingAvgPrice: number;
  coolingOffUntil: string | null;
  hasCompletedTutorial: boolean;
  allowOddLots: boolean;
  feeMode: FeeMode;
}

const TUTORIAL_STEPS = [
  "Welcome to the SGX Order Ticket! Real Singapore stocks trade in standard Board Lots of 100 shares.",
  "Notice the live Bid (Sell) and Ask (Buy) prices. Market orders execute immediately at the best Bid/Ask.",
  "Every trade includes an itemized SGX & CDP fee calculation so you learn how transaction costs affect net returns.",
  "Click Review & Submit Order when ready to receive your official SGX Contract Note!",
];

export default function SgxOrderTicket({
  ticker,
  companyName,
  livePrice,
  liveBid,
  liveAsk,
  liveVolume,
  initialCashBalance,
  initialHoldingShares,
  initialHoldingAvgPrice,
  coolingOffUntil,
  hasCompletedTutorial,
  allowOddLots,
  feeMode,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<TradeAction>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [sharesInput, setSharesInput] = useState<string>(
    allowOddLots ? "10" : "100",
  );
  const [limitPriceInput, setLimitPriceInput] = useState<string>(() =>
    formatSgxPrice(livePrice),
  );
  const [showFeeDrawer, setShowFeeDrawer] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [cashBalance, setCashBalance] = useState(initialCashBalance);
  const [holdingShares, setHoldingShares] = useState(initialHoldingShares);
  const [holdingAvgPrice, setHoldingAvgPrice] = useState(
    initialHoldingAvgPrice,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contractNoteModal, setContractNoteModal] = useState<
    NonNullable<ExecuteTradeResponse["data"]> | null
  >(null);
  const [achievementKey, setAchievementKey] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(!hasCompletedTutorial);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedThesisId, setSelectedThesisId] = useState<string>(
    PRE_TRADE_THESIS_OPTIONS[0].id,
  );
  const [confidenceLevel, setConfidenceLevel] = useState<number>(4);
  const [isPending, startTransition] = useTransition();
  const lastSubmitRef = useRef<number>(0);

  const lotStep = allowOddLots ? 1 : 100;
  const tickSize = getSgxTickSize(livePrice);
  const fallbackSpread = calculateAdminBidAsk(livePrice, tickSize);
  const bid = liveBid > 0 ? liveBid : fallbackSpread.bid;
  const ask = liveAsk > 0 ? liveAsk : fallbackSpread.ask;

  useEffect(() => {
    setCashBalance(initialCashBalance);
    setHoldingShares(initialHoldingShares);
    setHoldingAvgPrice(initialHoldingAvgPrice);
  }, [initialCashBalance, initialHoldingShares, initialHoldingAvgPrice]);

  const orderBook = useMemo(
    () => generateSgxOrderBook(ticker, livePrice, liveVolume),
    [ticker, livePrice, liveVolume],
  );

  const parsedShares = /^\d+$/.test(sharesInput) ? Number(sharesInput) : 0;
  const effectivePrice =
    orderType === "limit"
      ? Number(limitPriceInput) || livePrice
      : action === "buy"
        ? ask
        : bid;

  const fees = useMemo(
    () =>
      calculateSgxTradeFees(
        parsedShares,
        effectivePrice,
        action === "buy",
        feeMode,
      ),
    [parsedShares, effectivePrice, action, feeMode],
  );

  const isBuy = action === "buy";
  const cashAfter = isBuy
    ? cashBalance - fees.netTotal
    : cashBalance + fees.netTotal;

  const violatesBoardLot =
    !allowOddLots && parsedShares > 0 && parsedShares % 100 !== 0;
  const insufficientCash = isBuy && parsedShares > 0 && fees.netTotal > cashBalance;
  const exceedsHolding = !isBuy && parsedShares > holdingShares;
  const coolingOffActive =
    coolingOffUntil !== null && new Date(coolingOffUntil).getTime() > Date.now();

  const canSubmit =
    !coolingOffActive &&
    !isPending &&
    parsedShares > 0 &&
    !violatesBoardLot &&
    !insufficientCash &&
    !exceedsHolding;

  const stepShares = (deltaLots: number) => {
    const next = Math.max(lotStep, parsedShares + deltaLots * lotStep);
    setSharesInput(String(next));
    setErrorMsg(null);
  };

  const applyQuickAllocation = (fraction: number) => {
    if (isBuy) {
      const budget = cashBalance * fraction - 15;
      if (budget <= 0 || effectivePrice <= 0) return;
      const rawShares = Math.floor(budget / effectivePrice);
      const lotAligned = allowOddLots
        ? Math.max(1, rawShares)
        : Math.max(100, Math.floor(rawShares / 100) * 100);
      setSharesInput(String(lotAligned));
    } else {
      if (holdingShares <= 0) return;
      const rawSell = Math.floor(holdingShares * fraction);
      const lotAligned = allowOddLots
        ? Math.max(1, rawSell)
        : Math.max(100, Math.floor(rawSell / 100) * 100);
      setSharesInput(String(Math.min(holdingShares, lotAligned)));
    }
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() - lastSubmitRef.current < 500) return;
    lastSubmitRef.current = Date.now();
    setErrorMsg(null);

    startTransition(async () => {
      const result = await executeSgxTradeAction({
        ticker,
        shares: parsedShares,
        action,
        orderType,
        limitPrice: orderType === "limit" ? Number(limitPriceInput) : null,
      });

      if (!result.success || !result.data) {
        setErrorMsg(result.error ?? "Order rejected by SGX matching engine.");
        return;
      }

      setCashBalance(result.data.cashBalance);
      setHoldingShares(result.data.holdingShares);
      setHoldingAvgPrice(result.data.holdingAvgPrice);
      setContractNoteModal(result.data);

      if (result.data.achievementUnlocked) {
        setAchievementKey(result.data.achievementUnlocked);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sgx:balance-updated", {
            detail: {
              cashBalance: result.data.cashBalance,
              netValue: result.data.netValue,
            },
          }),
        );
      }

      router.refresh();
    });
  };

  const handleDismissTutorial = async () => {
    setShowTutorial(false);
    await markTutorialCompleteAction();
  };

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Interactive First-Trade Tutorial Overlay */}
      {showTutorial && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-slate-900/60 backdrop-blur-sm p-5">
          <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-white p-5 shadow-2xl animate-scale-in">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-sgx-blue">
              <Sparkles className="h-3 w-3" />
              Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {TUTORIAL_STEPS[tutorialStep]}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDismissTutorial}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Skip
              </button>
              {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setTutorialStep((s) => s + 1)}
                  className="rounded-xl bg-sgx-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Next Tip
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismissTutorial}
                  className="rounded-xl bg-sgx-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Got it — Let&apos;s Trade!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Ticket Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            SGX Order Entry Terminal
          </span>
          <h2 className="font-display text-base font-bold text-slate-900">
            {ticker} · {allowOddLots ? "Odd Lot (1 sh)" : "100-Share Board Lot"}
          </h2>
        </div>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">
          Tick: S${tickSize}
        </span>
      </div>

      {/* Buy / Sell Segmented Tabs */}
      <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
        <button
          type="button"
          onClick={() => {
            setAction("buy");
            setErrorMsg(null);
          }}
          className={`rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider transition ${
            isBuy
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Buy · Ask S${formatSgxPrice(ask)}
        </button>
        <button
          type="button"
          onClick={() => {
            setAction("sell");
            setErrorMsg(null);
          }}
          className={`rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider transition ${
            !isBuy
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sell · Bid S${formatSgxPrice(bid)}
        </button>
      </div>

      {/* Order Type Selector: Market vs Limit */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-1 text-xs">
        {(["market", "limit"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setOrderType(t);
              if (t === "limit") {
                setLimitPriceInput(formatSgxPrice(isBuy ? ask : bid));
              }
            }}
            className={`flex-1 rounded-lg py-1.5 font-semibold capitalize transition ${
              orderType === t
                ? "bg-white text-sgx-blue shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t === "market" ? "Market Order (Instant)" : "Limit Order"}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        {orderType === "market"
          ? "Market Order = Buy/sell immediately at the best available Bid or Ask price."
          : "Limit Order = Set the exact price you want and wait in the queue until the market reaches it."}
      </p>

      {coolingOffActive ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-rose-700">
            <ShieldAlert className="h-4 w-4" />
            Cooling-Off Period Active
          </p>
          <p>
            Order submission resumes at{" "}
            <strong className="font-mono">
              {new Date(coolingOffUntil!).toLocaleTimeString("en-SG", {
                timeZone: "Asia/Singapore",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              SGT
            </strong>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          {/* Quantity / Board Lot Stepper */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="sgx-shares-input"
                className="font-semibold text-slate-700"
              >
                Quantity (Shares)
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {parsedShares > 0
                  ? `${(parsedShares / 100).toFixed(allowOddLots ? 2 : 0)} Board Lot(s)`
                  : "0 Lots"}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepShares(-1)}
                aria-label="Decrease lot quantity"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                id="sgx-shares-input"
                type="number"
                inputMode="numeric"
                min={lotStep}
                step={lotStep}
                value={sharesInput}
                onChange={(e) => {
                  setSharesInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-center font-mono text-base font-bold text-slate-900 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20 tabular-nums"
              />

              <button
                type="button"
                onClick={() => stepShares(1)}
                aria-label="Increase lot quantity"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Buying Power / Position Percentage Buttons */}
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-[11px] font-mono">
              {[
                { label: "1 Lot (100)", fn: () => setSharesInput("100") },
                { label: "25%", fn: () => applyQuickAllocation(0.25) },
                { label: "50%", fn: () => applyQuickAllocation(0.5) },
                { label: "Max", fn: () => applyQuickAllocation(0.98) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.fn}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1 font-semibold text-slate-600 hover:border-sgx-blue hover:bg-blue-50/50 hover:text-sgx-blue transition"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {violatesBoardLot && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                ⚠️ SGX Board Lot Rule: Quantity must be a multiple of 100 shares.
              </p>
            )}
          </div>

          {/* Limit Price Input (when Limit Order selected) */}
          {orderType === "limit" && (
            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="sgx-limit-price"
                  className="font-semibold text-slate-700"
                >
                  Limit Price (SGD)
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  Min Tick: S${tickSize}
                </span>
              </div>
              <input
                id="sgx-limit-price"
                type="number"
                step={tickSize}
                min={tickSize}
                value={limitPriceInput}
                onChange={(e) => setLimitPriceInput(e.target.value)}
                onBlur={() => {
                  const n = Number(limitPriceInput);
                  if (Number.isFinite(n) && n > 0) {
                    setLimitPriceInput(formatSgxPrice(roundToSgxTick(n)));
                  }
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm font-bold text-slate-900 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20 tabular-nums"
              />
            </div>
          )}

          {/* Cost & SGX Fee Summary Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>
                Gross Value ({parsedShares.toLocaleString()} × S$
                {formatSgxPrice(effectivePrice)})
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                S${formatSgd(fees.grossAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <button
                type="button"
                onClick={() => setShowFeeDrawer((v) => !v)}
                className="inline-flex items-center gap-1 font-medium text-sgx-blue hover:underline"
              >
                <Info className="h-3.5 w-3.5" />
                {feeMode === "sgx_realistic"
                  ? "SGX + CDP + 9% GST Fees"
                  : "Classroom Brokerage Fee"}
                {showFeeDrawer ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              <span className="font-mono font-semibold text-amber-700 tabular-nums">
                {isBuy ? "+" : "−"}S${formatSgd(fees.totalFee)}
              </span>
            </div>

            {showFeeDrawer && (
              <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] text-slate-500 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Brokerage (0.08%, min S$10):</span>
                  <span>S${formatSgd(fees.brokerageFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CDP Clearing Fee (0.0325%):</span>
                  <span>S${formatSgd(fees.clearingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGX Trading Fee (0.0075%):</span>
                  <span>S${formatSgd(fees.sgxTradingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Singapore GST (9%):</span>
                  <span>S${formatSgd(fees.gstAmount)}</span>
                </div>
                <p className="pt-1 border-t border-slate-100 font-sans text-[10px] text-slate-500">
                  💡 <strong>Why fees matter:</strong> Because Singapore brokers charge a S$10.00 minimum fee, tiny trades cost a higher % in fees than larger trades!
                </p>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <span>Estimated {isBuy ? "Total Cost" : "Net Proceeds"}</span>
              <span className="font-mono text-base tabular-nums">
                S${formatSgd(fees.netTotal)}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Cash Remaining After Trade</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  cashAfter < 0 ? "text-rose-600" : "text-slate-700"
                }`}
              >
                S${formatSgd(Math.max(0, cashAfter))}
              </span>
            </div>

            {insufficientCash && (
              <p className="text-xs font-semibold text-rose-600">
                ⚠️ Insufficient cash balance for this order (including fees).
              </p>
            )}
            {exceedsHolding && (
              <p className="text-xs font-semibold text-rose-600">
                ⚠️ You currently own {holdingShares.toLocaleString()} shares of{" "}
                {ticker}.
              </p>
            )}
          </div>

          {/* Pre-Trade Metacognitive Calibration (Pillar C5: Think Before You Trade) */}
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-indigo-950 flex items-center gap-1">
                🧠 Pre-Trade Thesis (Metacognitive Check)
              </span>
              <span className="rounded-full bg-white border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
                Rubric C5
              </span>
            </div>
            <select
              id="pre-trade-thesis-select"
              name="preTradeThesis"
              aria-label="Select Pre-Trade Investment Thesis"
              value={selectedThesisId}
              onChange={(e) => setSelectedThesisId(e.target.value)}
              className="w-full rounded-xl border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sgx-blue"
            >
              {PRE_TRADE_THESIS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  [{opt.competencyId}] {opt.label}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-slate-600">
                Confidence Calibration:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConfidenceLevel(lvl)}
                    className={`h-6 w-6 rounded-lg font-mono text-[11px] font-bold transition ${
                      confidenceLevel === lvl
                        ? "bg-sgx-blue text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-sgx-blue"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isBuy
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isPending
              ? "Routing Order to SGX Engine…"
              : `${isBuy ? "BUY" : "SELL"} ${parsedShares.toLocaleString()} SHARES (${orderType.toUpperCase()})`}
          </button>
        </form>
      )}

      {/* Collapsible 5-Level SGX Market Depth (Order Book) */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setShowOrderBook((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-sgx-blue" />
            SGX Market Depth (5-Level Queue)
          </span>
          {showOrderBook ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showOrderBook && (
          <>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Live queue of buyers (<strong className="text-emerald-700">Bids</strong>) and sellers (<strong className="text-rose-700">Asks</strong>). Click any price row to set a Limit Order.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
            {/* Bids Column */}
            <div>
              <div className="flex justify-between text-[10px] font-sans font-semibold uppercase text-slate-400 pb-1 border-b border-slate-100">
                <span>Bid Vol</span>
                <span>Bid (S$)</span>
              </div>
              <div className="mt-1 space-y-1">
                {orderBook.bids.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setOrderType("limit");
                      setLimitPriceInput(formatSgxPrice(b.price));
                    }}
                    className="relative flex cursor-pointer items-center justify-between overflow-hidden rounded px-1.5 py-0.5 hover:bg-emerald-50"
                  >
                    <div
                      className="pointer-events-none absolute right-0 top-0 bottom-0 bg-emerald-500/10"
                      style={{ width: `${b.depthPercent}%` }}
                    />
                    <span className="relative text-slate-600 tabular-nums">
                      {b.shares.toLocaleString()}
                    </span>
                    <span className="relative font-bold text-emerald-700 tabular-nums">
                      {formatSgxPrice(b.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks Column */}
            <div>
              <div className="flex justify-between text-[10px] font-sans font-semibold uppercase text-slate-400 pb-1 border-b border-slate-100">
                <span>Ask (S$)</span>
                <span>Ask Vol</span>
              </div>
              <div className="mt-1 space-y-1">
                {orderBook.asks.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setOrderType("limit");
                      setLimitPriceInput(formatSgxPrice(a.price));
                    }}
                    className="relative flex cursor-pointer items-center justify-between overflow-hidden rounded px-1.5 py-0.5 hover:bg-rose-50"
                  >
                    <div
                      className="pointer-events-none absolute left-0 top-0 bottom-0 bg-rose-500/10"
                      style={{ width: `${a.depthPercent}%` }}
                    />
                    <span className="relative font-bold text-rose-700 tabular-nums">
                      {formatSgxPrice(a.price)}
                    </span>
                    <span className="relative text-slate-600 tabular-nums">
                      {a.shares.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Official SGX Contract Note Confirmation Modal */}
      {contractNoteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setContractNoteModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sgx-blue">
                    {contractNoteModal.contractNoteNo}
                  </p>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {contractNoteModal.status === "filled"
                      ? "SGX Contract Note Executed"
                      : "SGX Limit Order Queued"}
                  </h3>
                </div>
              </div>
              <Receipt className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Counter</span>
                <span className="font-bold text-slate-900">
                  {contractNoteModal.companyName} ({contractNoteModal.ticker})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action & Order Type</span>
                <span
                  className={`font-mono font-bold uppercase ${
                    contractNoteModal.action === "buy"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {contractNoteModal.action} · {contractNoteModal.orderType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity</span>
                <span className="font-mono font-bold text-slate-900">
                  {contractNoteModal.shares.toLocaleString()} shares
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Execution Price</span>
                <span className="font-mono font-bold text-slate-900">
                  S${formatSgxPrice(contractNoteModal.executionPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total SGX/CDP/GST Fees</span>
                <span className="font-mono text-amber-700">
                  S${formatSgd(contractNoteModal.fees.totalFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>
                  Net {contractNoteModal.action === "buy" ? "Settlement Cost" : "Proceeds"}
                </span>
                <span className="font-mono">
                  S${formatSgd(contractNoteModal.fees.netTotal)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Updated Buying Power:</span>
              <span className="font-mono font-bold text-slate-900">
                S${formatSgd(contractNoteModal.cashBalance)}
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5 text-[11px] text-indigo-950">
              <strong>Logged Pre-Trade Thesis (Rubric C5):</strong>{" "}
              {PRE_TRADE_THESIS_OPTIONS.find((o) => o.id === selectedThesisId)
                ?.label ?? "Dividend Yield"}{" "}
              · Confidence: <strong>{confidenceLevel}/5</strong>
            </div>

            <button
              type="button"
              onClick={() => setContractNoteModal(null)}
              className="mt-5 w-full rounded-xl bg-sgx-blue py-2.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {achievementKey && (
        <AchievementToast
          achievementKey={achievementKey}
          onDismiss={() => setAchievementKey(null)}
        />
      )}
    </div>
  );
}
