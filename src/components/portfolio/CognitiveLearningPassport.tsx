"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Layers,
  Printer,
  Sparkles,
  Target,
} from "lucide-react";
import {
  computeStudentCompetencyProfile,
  RETRIEVAL_PRACTICE_BANK,
  WORKED_EXAMPLES_BANK,
  type CompetencyDimensionResult,
} from "@/utils/learning-science";
import type {
  HoldingDoc,
  LimitOrderDoc,
  ReflectionDoc,
  TradeHistoryDoc,
  UserProfileDoc,
} from "@/types/firestore";

interface Props {
  user: UserProfileDoc;
  holdings: HoldingDoc[];
  trades: TradeHistoryDoc[];
  limitOrders: LimitOrderDoc[];
  reflections: ReflectionDoc[];
}

const RETRIEVAL_STORAGE_KEY = "edufinlit_completed_retrieval_v1";
const WORKED_STORAGE_KEY = "edufinlit_completed_worked_v1";

export default function CognitiveLearningPassport({
  user,
  holdings,
  trades,
  limitOrders,
  reflections,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "rubric" | "worked_examples" | "retrieval"
  >("rubric");
  const [completedRetrievalIds, setCompletedRetrievalIds] = useState<string[]>(
    [],
  );
  const [completedWorkedIds, setCompletedWorkedIds] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [expandedRubricId, setExpandedRubricId] = useState<string | null>("C2");
  const [showPrintReport, setShowPrintReport] = useState(false);

  useEffect(() => {
    try {
      const savedR = localStorage.getItem(
        `${RETRIEVAL_STORAGE_KEY}_${user.uid}`,
      );
      if (savedR) setCompletedRetrievalIds(JSON.parse(savedR));
      const savedW = localStorage.getItem(`${WORKED_STORAGE_KEY}_${user.uid}`);
      if (savedW) setCompletedWorkedIds(JSON.parse(savedW));
    } catch {
      // ignore storage errors
    }
  }, [user.uid]);

  const handleSelectAnswer = (
    itemId: string,
    optionIdx: number,
    correctIdx: number,
    kind: "worked" | "retrieval",
  ) => {
    setSelectedAnswers((prev) => ({ ...prev, [itemId]: optionIdx }));
    if (optionIdx === correctIdx) {
      if (kind === "worked" && !completedWorkedIds.includes(itemId)) {
        const next = [...completedWorkedIds, itemId];
        setCompletedWorkedIds(next);
        try {
          localStorage.setItem(
            `${WORKED_STORAGE_KEY}_${user.uid}`,
            JSON.stringify(next),
          );
        } catch {
          // ignore
        }
      }
      if (kind === "retrieval" && !completedRetrievalIds.includes(itemId)) {
        const next = [...completedRetrievalIds, itemId];
        setCompletedRetrievalIds(next);
        try {
          localStorage.setItem(
            `${RETRIEVAL_STORAGE_KEY}_${user.uid}`,
            JSON.stringify(next),
          );
        } catch {
          // ignore
        }
      }
    }
  };

  const profile = computeStudentCompetencyProfile({
    user,
    holdings,
    trades,
    limitOrders,
    reflections,
    completedRetrievalIds,
    completedWorkedExampleIds: completedWorkedIds,
  });

  const levelBadgeStyle = (lvl: string) => {
    if (lvl.includes("Advanced")) {
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    }
    if (lvl.includes("Proficient")) {
      return "border-blue-300 bg-blue-50 text-sgx-blue";
    }
    if (lvl.includes("Developing")) {
      return "border-amber-300 bg-amber-50 text-amber-800";
    }
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  const barColorStyle = (score: number) => {
    if (score >= 85) return "bg-emerald-600";
    if (score >= 70) return "bg-sgx-blue";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 p-6 shadow-sm space-y-5">
      {/* Header & Executive Mastery Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold text-sgx-blue">
              <Brain className="h-3.5 w-3.5" />
              Cognitive Science Learning Passport · Standards-Aligned Rubric
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
              OECD/PISA · CEE Investing Standards · Bloom&apos;s &amp; SOLO Taxonomy
            </span>
          </div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
            Financial Literacy Competency &amp; Cognitive Mastery Report
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike raw trading games that only track lucky price swings,{" "}
            <strong>EduFinLit</strong> evaluates your demonstrated financial
            literacy across 5 standards-aligned competencies using{" "}
            <strong>Worked Examples (Cognitive Load Theory)</strong>,{" "}
            <strong>Active Retrieval Practice</strong>, and{" "}
            <strong>Metacognitive Calibration</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintReport((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-sgx-blue hover:text-sgx-blue"
          >
            <Printer className="h-3.5 w-3.5 text-sgx-blue" />
            {showPrintReport
              ? "Hide Mastery Transcript"
              : "View / Print Mastery Report"}
          </button>
          <Link
            href="/copilot?prompt=Show+my+Financial+Literacy+Mastery+%26+Learning+Report"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Coach Me in AI Copilot
          </Link>
        </div>
      </div>

      {/* 4 Key Cognitive Telemetry KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Overall Competency Level
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-xl font-extrabold text-slate-900">
              {profile.overallScorePct}%
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeStyle(
                profile.overallLevel,
              )}`}
            >
              {profile.overallLevel}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            SOLO Stage: <strong className="text-slate-700">{profile.overallSoloStage}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Pillars Proficient (≥70%)
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold text-emerald-700">
            {profile.proficientCount} / 5 Pillars
          </p>
          <p className="mt-1 text-[10px] text-slate-500 truncate">
            Top: <strong className="text-slate-700">{profile.strengths[0]}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Worked Examples &amp; Recall
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold text-sgx-blue">
            {completedWorkedIds.length}/{WORKED_EXAMPLES_BANK.length} ·{" "}
            {completedRetrievalIds.length}/{RETRIEVAL_PRACTICE_BANK.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Faded Examples &amp; Retrieval Checks
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cognitive Mastery XP
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold text-indigo-700">
            {profile.cognitiveXp.toLocaleString()} XP
          </p>
          <p className="mt-1 text-[10px] text-slate-500 truncate">
            Focus: <strong className="text-slate-700">{profile.growthAreas[0]}</strong>
          </p>
        </div>
      </div>

      {/* Printable Institutional Student Mastery Transcript (Toggleable) */}
      {showPrintReport && (
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-sgx-blue">
                OFFICIAL EDUFINLIT STUDENT LEARNING OUTCOMES TRANSCRIPT
              </p>
              <h3 className="font-display text-lg font-extrabold text-slate-900">
                {user.nickname} ({user.email}) — {profile.overallLevel} (
                {profile.overallScorePct}%)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">
              Automated Formative Assessment Narrative (For Teacher &amp; Report Card):
            </strong>{" "}
            {profile.teacherReportComment}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-slate-200">
              <thead className="bg-slate-100 text-left font-bold text-slate-700">
                <tr>
                  <th className="px-3 py-2">Code &amp; Competency Pillar</th>
                  <th className="px-3 py-2">Educational Standard</th>
                  <th className="px-3 py-2">Bloom&apos;s / SOLO</th>
                  <th className="px-3 py-2 text-right">Mastery %</th>
                  <th className="px-3 py-2">Proficiency Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {profile.competencies.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-bold text-slate-900">
                      {c.code}: {c.title}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {c.standardAlignment}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      {c.bloomsLevel} · {c.soloLevel}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                      {c.scorePct}%
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${levelBadgeStyle(
                          c.level,
                        )}`}
                      >
                        {c.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation Tabs for the 3 Cognitive Science Modules */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("rubric")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "rubric"
              ? "bg-sgx-blue text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          1. 5-Pillar Competency Rubric &amp; Evidence
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("worked_examples")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "worked_examples"
              ? "bg-sgx-blue text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Layers className="h-4 w-4" />
          2. Worked Examples (Cognitive Load Theory) (
          {completedWorkedIds.length}/{WORKED_EXAMPLES_BANK.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("retrieval")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "retrieval"
              ? "bg-sgx-blue text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Target className="h-4 w-4" />
          3. Active Retrieval Practice Quiz ({completedRetrievalIds.length}/
          {RETRIEVAL_PRACTICE_BANK.length})
        </button>
      </div>

      {/* TAB 1: 5-PILLAR STANDARDS-ALIGNED COMPETENCY RUBRIC */}
      {activeTab === "rubric" && (
        <div className="space-y-3">
          {profile.competencies.map((c: CompetencyDimensionResult) => {
            const isExpanded = expandedRubricId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-blue-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {c.code}
                    </span>
                    <h3 className="font-display text-sm font-extrabold text-slate-900">
                      {c.title}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Bloom&apos;s: {c.bloomsLevel} · SOLO: {c.soloLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${levelBadgeStyle(
                        c.level,
                      )}`}
                    >
                      {c.level} ({c.scorePct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRubricId(isExpanded ? null : c.id)
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {isExpanded ? "Hide Rubric" : "View 4-Band Rubric"}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColorStyle(
                      c.scorePct,
                    )}`}
                    style={{ width: `${c.scorePct}%` }}
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Live Evidence:</strong>{" "}
                    {c.evidenceSummary}
                  </p>
                  <Link
                    href={`/copilot?prompt=${encodeURIComponent(c.nextActionPrompt)}`}
                    className="inline-flex items-center gap-1 font-bold text-sgx-blue hover:underline"
                  >
                    {c.nextActionTip.slice(0, 48)}… →
                  </Link>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>
                        <strong>Standard Alignment:</strong>{" "}
                        {c.standardAlignment}
                      </span>
                      <span>
                        <strong>Cognitive Strategy:</strong>{" "}
                        {c.cognitiveApproach}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                      {[
                        {
                          label: "Level 1: Novice (0–49%)",
                          desc: c.rubricBands.novice,
                          active: c.level.includes("Novice"),
                        },
                        {
                          label: "Level 2: Developing (50–69%)",
                          desc: c.rubricBands.developing,
                          active: c.level.includes("Developing"),
                        },
                        {
                          label: "Level 3: Proficient (70–84%)",
                          desc: c.rubricBands.proficient,
                          active: c.level.includes("Proficient"),
                        },
                        {
                          label: "Level 4: Advanced (85–100%)",
                          desc: c.rubricBands.advanced,
                          active: c.level.includes("Advanced"),
                        },
                      ].map((band) => (
                        <div
                          key={band.label}
                          className={`rounded-xl border p-2.5 ${
                            band.active
                              ? "border-sgx-blue bg-blue-50/70 ring-1 ring-sgx-blue"
                              : "border-slate-200 bg-slate-50/60"
                          }`}
                        >
                          <p
                            className={`text-[10px] font-extrabold uppercase ${
                              band.active ? "text-sgx-blue" : "text-slate-600"
                            }`}
                          >
                            {band.label} {band.active ? "★ Current" : ""}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-700 leading-snug">
                            {band.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: FADED WORKED EXAMPLES (SWELLER'S COGNITIVE LOAD THEORY) */}
      {activeTab === "worked_examples" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {WORKED_EXAMPLES_BANK.map((we) => {
            const chosen = selectedAnswers[we.id];
            const isSolved = completedWorkedIds.includes(we.id);
            return (
              <div
                key={we.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800">
                      Pillar {we.competencyId} · {we.cognitivePrinciple}
                    </span>
                    {isSolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed (+Mastery)
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-sm font-extrabold text-slate-900">
                    {we.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {we.scenario}
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                    <p className="text-slate-800">
                      <strong className="text-sgx-blue">
                        Worked Step 1:
                      </strong>{" "}
                      {we.step1Worked.replace(/^Step 1 \([^)]+\):\s*/, "")}
                    </p>
                    <p className="text-slate-800">
                      <strong className="text-sgx-blue">
                        Worked Step 2:
                      </strong>{" "}
                      {we.step2Worked.replace(/^Step 2 \([^)]+\):\s*/, "")}
                    </p>
                  </div>

                  <p className="font-bold text-slate-900 pt-1">
                    🤔 {we.step3FadedPrompt}
                  </p>

                  <div className="space-y-1.5">
                    {we.options.map((opt, idx) => {
                      const isSelected = chosen === idx;
                      const isRight = idx === we.correctIndex;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            handleSelectAnswer(
                              we.id,
                              idx,
                              we.correctIndex,
                              "worked",
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                            isSelected
                              ? isRight
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold"
                                : "border-rose-300 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-sgx-blue"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {chosen !== undefined && (
                  <div
                    className={`rounded-xl border p-3 text-[11px] leading-relaxed ${
                      chosen === we.correctIndex
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {chosen === we.correctIndex
                      ? we.explanation
                      : "Not quite — review Worked Steps 1 and 2 above and try selecting the mathematical threshold that solves Step 3!"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: SPACED RETRIEVAL PRACTICE (TESTING EFFECT) */}
      {activeTab === "retrieval" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {RETRIEVAL_PRACTICE_BANK.map((rq) => {
            const chosen = selectedAnswers[rq.id];
            const isMastered = completedRetrievalIds.includes(rq.id);
            return (
              <div
                key={rq.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[10px] font-bold text-sgx-blue">
                      Competency {rq.competencyId} · Bloom&apos;s:{" "}
                      {rq.bloomsLevel}
                    </span>
                    {isMastered && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Retrieved (+40 XP)
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-900 leading-relaxed">
                    {rq.question}
                  </p>

                  <div className="space-y-1.5">
                    {rq.options.map((opt, idx) => {
                      const isSelected = chosen === idx;
                      const isRight = idx === rq.correctIndex;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            handleSelectAnswer(
                              rq.id,
                              idx,
                              rq.correctIndex,
                              "retrieval",
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                            isSelected
                              ? isRight
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold"
                                : "border-rose-300 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-sgx-blue"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {chosen !== undefined && (
                  <div
                    className={`rounded-xl border p-3 text-[11px] leading-relaxed ${
                      chosen === rq.correctIndex
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {chosen === rq.correctIndex
                      ? rq.cognitiveFeedback
                      : "Think carefully about SGX market microstructure and try recalling the rule again!"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
