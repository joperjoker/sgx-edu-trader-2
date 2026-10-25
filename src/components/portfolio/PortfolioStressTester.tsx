"use client";

import { useState, useTransition } from "react";
import {
  Activity,
  Cpu,
  Flame,
  Landmark,
  Plane,
  Sparkles,
} from "lucide-react";
import {
  runPortfolioStressTestAction,
  type StressScenarioId,
  type StressTestResult,
} from "@/actions/ai";
import { formatSgd } from "@/utils/sgx-market";

const SCENARIOS: Array<{
  id: StressScenarioId;
  shortTitle: string;
  subtitle: string;
  icon: typeof Landmark;
}> = [
  {
    id: "mas_tightening",
    shortTitle: "Stronger SGD & Higher Rates",
    subtitle: "Stronger Singapore Dollar exchange rate & higher global interest rates",
    icon: Landmark,
  },
  {
    id: "semi_capex_surge",
    shortTitle: "AI & Tech Capex Boom",
    subtitle: "Global AI factory spending boosts Singapore precision & chip suppliers",
    icon: Cpu,
  },
  {
    id: "changi_tourism_boom",
    shortTitle: "Changi Aviation Boom",
    subtitle: "Record ASEAN air travel & aircraft maintenance (MRO) demand",
    icon: Plane,
  },
  {
    id: "energy_inflation_shock",
    shortTitle: "Energy & Oil Shock",
    subtitle: "Global oil prices jump +35%, raising transport & electricity costs",
    icon: Flame,
  },
];

export default function PortfolioStressTester() {
  const [selectedId, setSelectedId] =
    useState<StressScenarioId>("mas_tightening");
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRunScenario = (scenarioId: StressScenarioId) => {
    setSelectedId(scenarioId);
    setError(null);
    startTransition(async () => {
      const res = await runPortfolioStressTestAction(scenarioId);
      if (!res.success || !res.data) {
        setError(res.error ?? "Failed to run portfolio stress test.");
        return;
      }
      setResult(res.data);
    });
  };

  const positive = result ? result.estimatedPortfolioDeltaSgd >= 0 : true;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-sgx-blue">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Google Cloud &amp; Gemini Macroeconomic Portfolio Stress-Tester
              </h2>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sgx-blue">
                Socratic Risk Lab
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Simulate how real-world Singapore macroeconomic events impact your
              active SGX holdings across sectors
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Selector Cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const active = selectedId === sc.id && result?.scenarioId === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              disabled={isPending}
              onClick={() => handleRunScenario(sc.id)}
              className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                active
                  ? "border-sgx-blue bg-blue-50/60 shadow-sm ring-2 ring-sgx-blue/15"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-sgx-blue shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase text-sgx-blue">
                  Simulate →
                </span>
              </div>
              <p className="mt-2.5 font-display text-xs font-bold text-slate-900">
                {sc.shortTitle}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{sc.subtitle}</p>
            </button>
          );
        })}
      </div>

      {isPending && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs font-semibold text-sgx-blue">
          <Activity className="h-4 w-4 animate-spin" />
          Running Gemini macroeconomic shock simulation across your
          SGX holdings…
        </div>
      )}

      {error && (
        <p className="mt-4 text-xs font-semibold text-rose-600">{error}</p>
      )}

      {result && !isPending && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Quantitative Impact Table */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Simulated Macro Event
                </p>
                <p className="font-display text-sm font-bold text-slate-900">
                  {result.scenarioTitle}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Est. Net Portfolio Impact
                </p>
                <p
                  className={`font-mono text-sm font-extrabold tabular-nums ${
                    positive ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {positive ? "▲" : "▼"} S$
                  {formatSgd(Math.abs(result.estimatedPortfolioDeltaSgd))}{" "}
                  {positive ? "profit" : "loss"} ({positive ? "+" : ""}
                  {result.estimatedPortfolioDeltaPct.toFixed(2)}%)
                </p>
              </div>
            </div>

            {result.holdingImpacts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                You currently hold 0 SGX stocks (100% cash). Buy stocks from the
                Market Screener to see counter-by-counter stress test impacts.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {result.holdingImpacts.map((h) => {
                  const up = h.estimatedDeltaSgd >= 0;
                  return (
                    <div
                      key={h.ticker}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">
                          {h.companyName}
                        </span>{" "}
                        <span className="font-mono text-[11px] text-slate-500">
                          ({h.ticker} · {h.sector})
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          up ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {up ? "▲" : "▼"} S$
                        {formatSgd(Math.abs(h.estimatedDeltaSgd))}{" "}
                        {up ? "profit" : "loss"} ({up ? "+" : ""}
                        {h.shockPct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Socratic Gemini Commentary */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sgx-blue">
                Gemini Socratic Risk Debrief
              </p>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
                {result.socraticCommentary}
              </p>
            </div>
            <p className="mt-3 border-t border-blue-200/70 pt-2 text-[10px] text-slate-500">
              Educational stress-test model for classroom learning. Actual market
              reactions vary.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
