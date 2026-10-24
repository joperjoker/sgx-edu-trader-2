"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Newspaper,
  Activity,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  analyseCompanyNewsAction,
  analyseFinancialHealthAction,
  analysePricePatternAction,
} from "@/actions/ai";

export default function AiCoachSection({ ticker }: { ticker: string }) {
  const [newsData, setNewsData] = useState<{
    text: string;
    headlines: string[];
  } | null>(null);
  const [patternData, setPatternData] = useState<{
    text: string;
    days: number;
  } | null>(null);
  const [healthData, setHealthData] = useState<{
    rating: "STRONG" | "MODERATE" | "WEAK";
    text: string;
  } | null>(null);

  const [pendingNews, startNews] = useTransition();
  const [pendingPattern, startPattern] = useTransition();
  const [pendingHealth, startHealth] = useTransition();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-[11px] font-bold text-sgx-blue">
            <Sparkles className="h-3.5 w-3.5" />
            Google Gemini 2.5 Flash · Socratic Investment Coach
          </div>
          <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900">
            AI Critical-Thinking Research Modules
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-md">
          Designed for financial literacy: Gemini explains market concepts and
          highlights what AI models <strong>miss</strong> — never telling you
          what to buy or sell.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Module 1: News Impact */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sgx-blue">
              <Newspaper className="h-4 w-4" />
              1. News & Catalyst Analyser
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Summarises recent headlines for {ticker} and identifies real-world
              factors that news sentiment cannot capture.
            </p>

            {newsData && (
              <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                <div className="border-b border-slate-100 pb-2">
                  <p className="font-bold text-slate-900 text-[11px] uppercase">
                    Recent Headlines Analysed:
                  </p>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                    {newsData.headlines.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div>{newsData.text}</div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={pendingNews}
            onClick={() =>
              startNews(async () => {
                const res = await analyseCompanyNewsAction(ticker);
                if (res.success && res.data) setNewsData(res.data);
              })
            }
            className="mt-4 w-full rounded-xl border border-blue-200 bg-white py-2 text-xs font-bold text-sgx-blue shadow-sm hover:bg-blue-50 disabled:opacity-50"
          >
            {pendingNews
              ? "Gemini 2.5 Analysing Headlines…"
              : newsData
                ? "Refresh News Analysis"
                : "Run News Impact Analysis"}
          </button>
        </div>

        {/* Module 2: Price Action & Volatility */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <Activity className="h-4 w-4" />
              2. 30-Day Price Action Coach
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Examines 30-day closing trends, supporting catalysts, and reversal
              risks without directional bias.
            </p>

            {patternData && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {patternData.text}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={pendingPattern}
            onClick={() =>
              startPattern(async () => {
                const res = await analysePricePatternAction(ticker);
                if (res.success && res.data) setPatternData(res.data);
              })
            }
            className="mt-4 w-full rounded-xl border border-indigo-200 bg-white py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:opacity-50"
          >
            {pendingPattern
              ? "Evaluating 30-Day Candles…"
              : patternData
                ? "Refresh Trend Study"
                : "Analyse 30-Day Price Trend"}
          </button>
        </div>

        {/* Module 3: Fundamental Financial Health */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              3. Fundamental Health Explainer
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Translates Market Cap, P/E Ratio, and Dividend Yield into plain
              student-friendly language.
            </p>

            {healthData && (
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                    healthData.rating === "STRONG"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  FUNDAMENTAL PROFILE: {healthData.rating}
                </span>
                <div>{healthData.text}</div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={pendingHealth}
            onClick={() =>
              startHealth(async () => {
                const res = await analyseFinancialHealthAction(ticker);
                if (res.success && res.data) setHealthData(res.data);
              })
            }
            className="mt-4 w-full rounded-xl border border-emerald-200 bg-white py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
          >
            {pendingHealth
              ? "Inspecting Key Ratios…"
              : healthData
                ? "Refresh Fundamentals"
                : "Explain Financial Ratios"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3.5 py-2 text-[11px] text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>Educational Guardrail:</strong> AI outputs are generated by
          Google Gemini 2.5 Flash for classroom discussion only and never
          constitute a buy or sell recommendation.
        </span>
      </div>
    </section>
  );
}
