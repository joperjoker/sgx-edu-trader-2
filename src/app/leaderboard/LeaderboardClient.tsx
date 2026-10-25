"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bot,
  Crown,
  Medal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { LeaderboardMode } from "@/types/firestore";
import {
  calculateSmartInvestorScore,
  formatSgd,
} from "@/utils/sgx-market";

export interface LeaderboardStudentRow {
  uid: string;
  nickname: string;
  netValue: number;
  startingCapital: number;
  totalFeesPaid: number;
  hhi: number;
  achievementCount: number;
}

interface Props {
  students: LeaderboardStudentRow[];
  currentUserId: string;
  mode: LeaderboardMode;
}

export default function LeaderboardClient({
  students,
  currentUserId,
  mode,
}: Props) {
  const [sortMode, setSortMode] = useState<"value" | "score">("value");

  // Fix Legacy Bug #6: Sort the entire student list by the active sort mode FIRST,
  // so both the Top-3 Podium and the table rows (#4, #5, #6...) reflect the active sort!
  const sortedStudents = useMemo(() => {
    const copy = [...students];
    if (sortMode === "value") {
      copy.sort((a, b) => b.netValue - a.netValue);
    } else {
      copy.sort(
        (a, b) =>
          calculateSmartInvestorScore(
            b.netValue,
            b.startingCapital,
            b.hhi,
          ) -
          calculateSmartInvestorScore(
            a.netValue,
            a.startingCapital,
            a.hhi,
          ),
      );
    }
    return copy;
  }, [students, sortMode]);

  const anonymousIdMap = useMemo(() => {
    const byValue = [...students].sort((a, b) => b.netValue - a.netValue);
    const map = new Map<string, number>();
    byValue.forEach((s, i) => map.set(s.uid, i + 1));
    return map;
  }, [students]);

  const formatName = (s: LeaderboardStudentRow) => {
    if (mode === "named") return s.nickname || "SGX Trader";
    return `SGX Trader #${anonymousIdMap.get(s.uid) ?? 1}`;
  };

  const hasPodium = sortedStudents.length >= 3;
  const top3 = hasPodium ? sortedStudents.slice(0, 3) : [];
  const remainingRows = hasPodium ? sortedStudents.slice(3) : sortedStudents;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Sort Mode Toggle */}
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-[11px] font-bold text-sgx-blue">
            <Trophy className="h-3.5 w-3.5" />
            SGX Classroom Rankings · {mode === "named" ? "Named Mode" : "Anonymous Mode"}
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            SGX Investor Leaderboard
          </h1>
          <p className="text-xs text-slate-500">
            Compare raw portfolio returns against risk-adjusted Smart Investor
            Scores that reward diversified investing.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSortMode("value")}
            className={`rounded-xl px-4 py-2.5 transition ${
              sortMode === "value"
                ? "bg-sgx-blue text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            By Portfolio Net Value
          </button>
          <button
            type="button"
            onClick={() => setSortMode("score")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 transition ${
              sortMode === "score"
                ? "bg-sgx-blue text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            By Smart Investor Score
          </button>
        </div>
      </section>

      {/* Plain-English Teacher & Student Guide to Leaderboard Scoring */}
      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-xs text-slate-700 sm:grid-cols-3 items-center">
        <div>
          <strong className="text-slate-900">1. Portfolio Net Value (Raw Wealth):</strong>{" "}
          Your uninvested cash plus the current market value of all SGX shares you own (started at S$10,000.00).
        </div>
        <div>
          <strong className="text-sgx-blue">2. Smart Investor Score (Risk-Adjusted Grade):</strong>{" "}
          Combines your % return with your <strong>Diversification Score (1 − HHI)</strong> so spreading risk across multiple companies beats gambling everything on one stock.
        </div>
        <div className="flex sm:justify-end">
          <Link
            href="/copilot?prompt=How+should+I+allocate+my+remaining+cash+across+sectors%3F"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Bot className="h-3.5 w-3.5" />
            Boost Smart Score in AI Copilot →
          </Link>
        </div>
      </section>

      {/* Top 3 Podium Cards */}
      {hasPodium && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {top3.map((student, idx) => {
            const rank = idx + 1;
            const base =
              student.startingCapital > 0 ? student.startingCapital : 10000;
            const pnlDelta = Number((student.netValue - base).toFixed(2));
            const pnlPct = Number(((pnlDelta / base) * 100).toFixed(2));
            const up = pnlDelta >= 0;
            const smart = calculateSmartInvestorScore(
              student.netValue,
              base,
              student.hhi,
            );
            const isSelf = student.uid === currentUserId;

            const rankTheme =
              rank === 1
                ? {
                    border: "border-amber-300",
                    bg: "bg-gradient-to-b from-amber-50/80 to-white",
                    badge: "bg-amber-100 text-amber-800 border-amber-300",
                    icon: Crown,
                  }
                : rank === 2
                  ? {
                      border: "border-slate-300",
                      bg: "bg-gradient-to-b from-slate-50/90 to-white",
                      badge: "bg-slate-200 text-slate-800 border-slate-300",
                      icon: Medal,
                    }
                  : {
                      border: "border-orange-200",
                      bg: "bg-gradient-to-b from-orange-50/60 to-white",
                      badge: "bg-orange-100 text-orange-800 border-orange-200",
                      icon: Award,
                    };

            const Icon = rankTheme.icon;

            return (
              <div
                key={student.uid}
                className={`rounded-3xl border-2 ${rankTheme.border} ${rankTheme.bg} p-6 shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-extrabold ${rankTheme.badge}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      RANK #{rank}
                    </span>
                    {isSelf && (
                      <span className="rounded-full bg-sgx-blue px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        You
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 font-display text-xl font-extrabold text-slate-900 truncate">
                    {formatName(student)}
                  </h2>

                  <p className="mt-2 font-mono text-3xl font-extrabold text-slate-900 tabular-nums">
                    S${formatSgd(student.netValue)}
                  </p>

                  <p
                    className={`mt-1 inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums ${
                      up ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {up ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
                    {up ? "profit" : "loss"} ({up ? "+" : ""}
                    {pnlPct.toFixed(2)}%)
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200/70 pt-3 text-[11px]">
                  <div>
                    <span className="text-slate-400">Smart Score</span>
                    <p className="font-mono font-bold text-sgx-blue">
                      {smart >= 0 ? `+${smart.toFixed(2)}` : smart.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Diversified</span>
                    <p className="font-mono font-bold text-slate-800">
                      {Math.round((1 - student.hhi) * 100)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Fees Paid</span>
                    <p className="font-mono font-bold text-slate-700">
                      S${formatSgd(student.totalFeesPaid)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Full Leaderboard Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Rank</th>
                <th className="px-4 py-3.5">Trader</th>
                <th className="px-4 py-3.5 text-right">Portfolio Value (S$)</th>
                <th className="px-4 py-3.5 text-right">Total P&amp;L</th>
                <th className="px-4 py-3.5 text-right">Diversification</th>
                <th className="px-4 py-3.5 text-right">Smart Score</th>
                <th className="px-4 py-3.5 text-right">SGX Fees Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStudents.map((s, idx) => {
                const rank = idx + 1;
                const base = s.startingCapital > 0 ? s.startingCapital : 10000;
                const pnlDelta = Number((s.netValue - base).toFixed(2));
                const pnlPct = Number(((pnlDelta / base) * 100).toFixed(2));
                const up = pnlDelta >= 0;
                const smart = calculateSmartInvestorScore(
                  s.netValue,
                  base,
                  s.hhi,
                );
                const isSelf = s.uid === currentUserId;

                return (
                  <tr
                    key={s.uid}
                    className={`transition ${
                      isSelf
                        ? "bg-blue-50/60 font-semibold"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      #{rank}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <span className="font-bold">{formatName(s)}</span>
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-sgx-blue px-2 py-0.5 text-[10px] font-bold text-white">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      S${formatSgd(s.netValue)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                        up ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {up ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
                      {up ? "profit" : "loss"} ({up ? "+" : ""}
                      {pnlPct.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                      {Math.round((1 - s.hhi) * 100)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sgx-blue tabular-nums">
                      {smart >= 0 ? `+${smart.toFixed(2)}` : smart.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                      S${formatSgd(s.totalFeesPaid)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {remainingRows.length === 0 && !hasPodium && (
          <p className="p-6 text-center text-xs text-slate-500">
            No student accounts registered yet.
          </p>
        )}
      </section>
    </main>
  );
}
