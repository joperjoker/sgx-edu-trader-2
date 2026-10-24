"use client";

import { useState } from "react";
import { Calculator, Coins } from "lucide-react";
import { formatSgd, formatSgxPrice } from "@/utils/sgx-market";

interface Props {
  ticker: string;
  companyName: string;
  livePrice: number;
  dividendYieldPct: number;
}

export default function SgxDividendCalculator({
  ticker,
  companyName,
  livePrice,
  dividendYieldPct,
}: Props) {
  const [lots, setLots] = useState<number>(5);
  const [years, setYears] = useState<number>(3);
  const [reinvest, setReinvest] = useState<boolean>(true);

  const shares = lots * 100;
  const principalSgd = Number((shares * livePrice).toFixed(2));
  const annualYieldRate = Math.max(0, dividendYieldPct) / 100;
  const annualCashDividend = Number((principalSgd * annualYieldRate).toFixed(2));

  const projectedEndValue = reinvest
    ? Number((principalSgd * Math.pow(1 + annualYieldRate, years)).toFixed(2))
    : Number((principalSgd + annualCashDividend * years).toFixed(2));

  const totalDividendsEarned = Number(
    (projectedEndValue - principalSgd).toFixed(2),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">
              SGX Dividend &amp; Compounding Simulator
            </h2>
            <p className="text-[11px] text-slate-500">
              Singapore Tier-1 Corporate Dividends are 100% tax-exempt for retail
              investors
            </p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-xs font-bold text-sgx-blue">
          Indicative Yield: {dividendYieldPct.toFixed(2)}% p.a.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Board Lots Selector */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            SGX Board Lots (100 shares/lot)
          </label>
          <div className="mt-1.5 flex items-center gap-1.5">
            {[1, 5, 10, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLots(preset)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                  lots === preset
                    ? "bg-sgx-blue text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {preset}L
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-slate-600 tabular-nums">
            {shares.toLocaleString()} shares @ S${formatSgxPrice(livePrice)} ={" "}
            <strong className="text-slate-900">S${formatSgd(principalSgd)}</strong>
          </p>
        </div>

        {/* Holding Horizon */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Holding Horizon (Years)
          </label>
          <div className="mt-1.5 flex items-center gap-1.5">
            {[1, 3, 5, 10].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setYears(yr)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                  years === yr
                    ? "bg-sgx-blue text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {yr}Y
              </button>
            ))}
          </div>
          <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={reinvest}
              onChange={(e) => setReinvest(e.target.checked)}
              className="rounded border-slate-300 text-sgx-blue focus:ring-sgx-blue"
            />
            Reinvest dividends (DRIP compounding)
          </label>
        </div>

        {/* Projected Payout Output */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Est. {years}-Year Dividend Income
            </span>
            <Calculator className="h-3.5 w-3.5 text-emerald-700" />
          </div>
          <p className="mt-1 font-mono text-lg font-extrabold text-emerald-700 tabular-nums">
            ▲ S${formatSgd(totalDividendsEarned)} profit
          </p>
          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
            Year 1 Cash Payout:{" "}
            <strong className="text-slate-900">
              S${formatSgd(annualCashDividend)}
            </strong>{" "}
            · End Value:{" "}
            <strong className="text-slate-900">
              S${formatSgd(projectedEndValue)}
            </strong>
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[11px] text-slate-400">
        *Educational projection assuming {companyName} ({ticker}) maintains a
        constant share price of S${formatSgxPrice(livePrice)} and an indicative
        dividend yield of {dividendYieldPct.toFixed(2)}% p.a. Actual SGX
        dividends depend on board declarations and business earnings.
      </p>
    </section>
  );
}
