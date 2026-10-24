"use client";

import { useEffect } from "react";
import { Award, X } from "lucide-react";

const ACHIEVEMENT_META: Record<
  string,
  { emoji: string; title: string; subtitle: string }
> = {
  first_trade: {
    emoji: "🥇",
    title: "First SGX Order Executed",
    subtitle: "You placed your first board lot trade on the Singapore Exchange.",
  },
  first_profit: {
    emoji: "💰",
    title: "First Realized Profit",
    subtitle: "You closed a position above your average entry cost after fees.",
  },
  diversified: {
    emoji: "🌐",
    title: "Cross-Tier Diversifier",
    subtitle: "Your portfolio spans 3 or more SGX Risk Tiers simultaneously.",
  },
  fee_aware: {
    emoji: "📚",
    title: "CDP & Fee Strategist",
    subtitle: "Completed 5+ trades while managing brokerage and clearing fees.",
  },
  ai_analyst: {
    emoji: "🔬",
    title: "Gemini Research Analyst",
    subtitle: "Consulted all 3 Socratic Gemini AI research modules on a stock.",
  },
  fast_mover: {
    emoji: "🏃",
    title: "SGX Opening Bell Trader",
    subtitle: "Executed a trade within the first hour of SGX market open (09:00 SGT).",
  },
};

export default function AchievementToast({
  achievementKey,
  onDismiss,
}: {
  achievementKey: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const info = ACHIEVEMENT_META[achievementKey] ?? {
    emoji: "🏆",
    title: "Achievement Unlocked!",
    subtitle: "Keep building disciplined SGX trading habits.",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3.5 rounded-2xl border border-amber-300 bg-white p-4 shadow-2xl animate-fade-up"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-2xl">
        {info.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          <Award className="h-3 w-3" />
          SGX Achievement Unlocked
        </div>
        <p className="mt-0.5 font-display text-sm font-bold text-slate-900">
          {info.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">{info.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close achievement notification"
        className="text-slate-400 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
