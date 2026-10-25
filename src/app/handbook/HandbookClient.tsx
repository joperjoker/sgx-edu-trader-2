"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Printer,
  Copy,
  Download,
  Check,
  GraduationCap,
  Users,
  Shield,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Video,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import InteractiveVideoPlayer from "@/components/video/InteractiveVideoPlayer";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import {
  ROLE_HANDBOOKS,
  HandbookRole,
  EPISODES_DATA,
} from "@/data/handbook-and-video-content";

export default function HandbookClient() {
  const [selectedRole, setSelectedRole] = useState<HandbookRole>("student");
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const currentHandbook = ROLE_HANDBOOKS[selectedRole];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = (role: HandbookRole) => {
    const hb = ROLE_HANDBOOKS[role];
    const text = `# ${hb.title}\n## ${hb.subtitle}\n**Target Audience:** ${hb.targetAudience} | **Edition:** ${hb.version}\n\n` +
      hb.sections
        .map(
          (s) =>
            `## Section ${s.number}: ${s.title}\n*${s.summary}*\n\n${s.contentMarkdown}\n`,
        )
        .join("\n---\n\n");

    navigator.clipboard.writeText(text);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const handleDownloadMarkdown = (role: HandbookRole) => {
    const hb = ROLE_HANDBOOKS[role];
    const text = `# ${hb.title}\n## ${hb.subtitle}\n**Target Audience:** ${hb.targetAudience} | **Edition:** ${hb.version}\n\n` +
      hb.sections
        .map(
          (s) =>
            `## Section ${s.number}: ${s.title}\n*${s.summary}*\n\n${s.contentMarkdown}\n`,
        )
        .join("\n---\n\n");

    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EduFinLit_${role.toUpperCase()}_HANDBOOK.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-sgx-canvas pb-20">
      {/* Print-Only Header Block */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-900">
              EduFinLit · Student Growth &amp; SGX Paper Trading Platform
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-1">
              Ministry &amp; School IT Approved 100% Google Cloud Architecture
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-500">
            {currentHandbook.version}
            <br />
            Singapore Secondary &amp; JC Edition
          </div>
        </div>
      </div>

      {/* Hero Banner (Screen Only) */}
      <section className="print:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-sgx-blue">
                  <BookOpen className="h-3.5 w-3.5" />
                  Official Field Documentation &amp; Creator Video Series
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {currentHandbook.version}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Handbooks &amp; Video Walkthroughs
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Master the Singapore Exchange (SGX) paper trading simulator, 5-Pillar
                Cognitive Science Rubrics, Socratic AI Copilot, and Google Sites
                classroom deployment.
              </p>
            </div>

            {/* Quick Actions (Print, Copy, Download) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={() => handleCopyMarkdown(selectedRole)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                {copiedRole === selectedRole ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" />
                    Copy Markdown
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadMarkdown(selectedRole)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                Download .MD
              </button>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="mt-6 flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              {
                id: "student" as HandbookRole,
                label: "Student Field Handbook",
                badge: "Ep 1 · 2 · 3",
                icon: GraduationCap,
              },
              {
                id: "teacher" as HandbookRole,
                label: "Teacher & HOD Implementation Manual",
                badge: "Ep 4 · 5",
                icon: Users,
              },
              {
                id: "admin" as HandbookRole,
                label: "Superadmin & School IT Guide",
                badge: "Ep 6",
                icon: Shield,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRole(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                    isActive
                      ? "border-sgx-blue text-sgx-blue bg-blue-50/50 rounded-t-xl"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.2 font-mono text-[10px] font-bold ${
                      isActive
                        ? "bg-blue-100 text-sgx-blue"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-8">
        {/* Section 1: Playable Creator Video Studio (Screen Only) */}
        <section className="print:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-sgx-blue font-bold text-xs">
                🎬
              </span>
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Interactive Video Walkthroughs
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Click Play to watch simulated visual screen cues with live voiceover narration
            </span>
          </div>

          <InteractiveVideoPlayer
            initialEpisodeId={
              selectedRole === "admin"
                ? "ep6"
                : selectedRole === "teacher"
                ? "ep4"
                : "ep1"
            }
            onRoleChange={(role) => setSelectedRole(role)}
          />
        </section>

        {/* Section 2: Comprehensive Role-Based Handbook Content */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Handbook Header */}
          <div className="border-b border-slate-200 pb-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 font-mono text-xs font-bold text-sgx-blue uppercase">
                {currentHandbook.role} EDITION
              </span>
              <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-sgx-blue">
                {currentHandbook.targetAudience}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              {currentHandbook.title}
            </h2>
            <p className="text-sm font-semibold text-sgx-blue">
              {currentHandbook.subtitle}
            </p>
          </div>

          {/* Table of Contents Pill Bar */}
          <div className="print:hidden rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Table of Contents:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentHandbook.sections.map((s) => (
                <a
                  key={s.number}
                  href={`#sec-${s.number.replace(".", "-")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-sgx-blue hover:text-sgx-blue transition"
                >
                  <span className="font-mono text-sgx-blue">{s.number}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Handbook Sections Body */}
          <div className="space-y-8 pt-2">
            {currentHandbook.sections.map((section) => (
              <article
                key={section.number}
                id={`sec-${section.number.replace(".", "-")}`}
                className="scroll-mt-24 space-y-3 border-b border-slate-100 pb-8 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-extrabold text-sgx-blue border border-blue-200">
                    {section.number}
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900">
                    {section.title}
                  </h3>
                </div>

                <p className="text-xs font-semibold text-slate-500 italic">
                  {section.summary}
                </p>

                {/* Section Content Markdown Body */}
                <div className="pt-2">
                  <MarkdownRenderer content={section.contentMarkdown} />
                </div>
              </article>
            ))}
          </div>

          {/* Handbook Bottom Footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-500">
              Source file in repository:{" "}
              <code className="font-mono text-slate-800 font-bold">
                docs/EDUFINLIT_HANDBOOK_AND_VIDEO_GUIDE.md
              </code>
            </div>

            <div className="print:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print Full Manual
              </button>
              <Link
                href="/launch"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Go to Google Launch Center
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
