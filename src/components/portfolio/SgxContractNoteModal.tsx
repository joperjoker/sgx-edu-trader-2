"use client";

import { Building2, CheckCircle2, FileText, Printer, X } from "lucide-react";
import type { TradeHistoryDoc } from "@/types/firestore";
import { formatSgd, formatSgxPrice } from "@/utils/sgx-market";

interface Props {
  trade: TradeHistoryDoc | null;
  onClose: () => void;
}

function getTPlus2Date(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  let businessDaysAdded = 0;
  while (businessDaysAdded < 2) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      businessDaysAdded += 1;
    }
  }
  return d.toLocaleDateString("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SgxContractNoteModal({ trade, onClose }: Props) {
  if (!trade) return null;

  const isBuy = trade.action === "buy";
  const tradeDateStr = new Date(trade.timestamp).toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const settlementDateStr = getTPlus2Date(trade.timestamp);
  const boardLots = (trade.shares / 100).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Institutional Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sgx-blue text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-sgx-blue">
                  SGX-ST Electronic Contract Note
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  CDP Cleared (Simulated)
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-slate-900">
                {trade.contractNoteNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Printer className="h-3.5 w-3.5 text-sgx-blue" />
              Print / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close Contract Note"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contract Note Body */}
        <div className="p-6 space-y-5">
          {/* Counter & Participant Metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Holder
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-900">
                {trade.userNickname}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {trade.userEmail}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Trade Execution (SGT)
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                {tradeDateStr}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CDP Settlement (T+2)
              </p>
              <p className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                {settlementDateStr}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Exchange & Currency
              </p>
              <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">
                SGX Mainboard · SGD
              </p>
            </div>
          </div>

          {/* Security & Order Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 font-mono text-xs font-extrabold text-sgx-blue">
                {trade.ticker.replace(".SI", "")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {trade.companyName}
                  </h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                    {trade.ticker}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Order Type:{" "}
                  <span className="font-semibold uppercase text-slate-700">
                    {trade.orderType}
                  </span>
                  {trade.limitPrice
                    ? ` (Limit S$${formatSgxPrice(trade.limitPrice)})`
                    : " (Immediate Market Fill)"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-xl border px-3 py-1 font-mono text-xs font-extrabold uppercase ${
                  isBuy
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {isBuy ? "BUY CONTRACT" : "SELL CONTRACT"}
              </span>
              <p className="mt-1 font-mono text-xs text-slate-600 tabular-nums">
                {trade.shares.toLocaleString()} shares ({boardLots} Board Lots) @{" "}
                <strong className="text-slate-900">
                  S${formatSgxPrice(trade.executionPrice)}
                </strong>
              </p>
            </div>
          </div>

          {/* Itemized SGX + CDP + 9% GST Fee Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Itemized SGX-ST & CDP Settlement Statement
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>
                  Gross Principal ({trade.shares.toLocaleString()} × S$
                  {formatSgxPrice(trade.executionPrice)})
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  S${formatSgd(trade.grossAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Brokerage Commission (0.08%, Min S$10.00)</span>
                <span className="font-mono tabular-nums">
                  S${formatSgd(trade.brokerageFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>CDP Clearing Fee (0.0325% of Principal)</span>
                <span className="font-mono tabular-nums">
                  S${formatSgd(trade.clearingFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>SGX Trading Access Fee (0.0075% of Principal)</span>
                <span className="font-mono tabular-nums">
                  S${formatSgd(trade.sgxTradingFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Singapore Goods & Services Tax (9% GST on Fees)</span>
                <span className="font-mono tabular-nums">
                  S${formatSgd(trade.gstAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-amber-800">
                <span>Total Transaction Costs & Statutory Levies</span>
                <span className="font-mono tabular-nums">
                  S${formatSgd(trade.totalFee)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t-2 border-slate-300 pt-2.5 text-sm font-extrabold text-slate-900">
                <span>
                  {isBuy
                    ? "Net Total Debited from Cash Account"
                    : "Net Proceeds Credited to Cash Account"}
                </span>
                <span className="font-mono text-base text-sgx-blue tabular-nums">
                  S${formatSgd(trade.netTotal)}
                </span>
              </div>
              {trade.realizedPnl !== null && (
                <div className="flex items-center justify-between pt-1 text-xs font-bold">
                  <span className="text-slate-600">
                    Net Realized Profit / Loss (After Fees)
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      trade.realizedPnl >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {trade.realizedPnl >= 0 ? "▲" : "▼"} S$
                    {formatSgd(Math.abs(trade.realizedPnl))}{" "}
                    {trade.realizedPnl >= 0 ? "profit" : "loss"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Educational & Regulatory Footnote */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] text-slate-600">
            <Building2 className="h-4 w-4 shrink-0 text-sgx-blue mt-0.5" />
            <p>
              <strong>Educational Contract Note:</strong> Issued by SGX Edu-Trader
              2.0 Classroom Simulator. On the real Singapore Exchange, Central
              Depository (CDP) settlement occurs on <strong>T+2</strong> (two
              business days after trade execution). No real money or securities
              are involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
