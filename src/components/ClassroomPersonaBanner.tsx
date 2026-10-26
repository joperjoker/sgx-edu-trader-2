"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  Award,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  PlusCircle,
  Loader2,
} from "lucide-react";
import type { UserProfileDoc } from "@/types/firestore";
import {
  CLASSROOM_SAMPLE_PROFILES,
  PERSONAL_ACCOUNT_JOURNEY_STEPS,
  findSampleProfile,
  type ClassroomSampleProfile,
} from "@/utils/classroom-profiles";

interface ClassroomPersonaBannerProps {
  initialUser: UserProfileDoc | null;
}

const PROFILE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "student1@gmail.com": GraduationCap,
  "chloe.ng@gmail.com": TrendingUp,
  "teacher@sgxedu.sg": ShieldCheck,
  "admin@sgxedu.sg": Award,
};

export default function ClassroomPersonaBanner({
  initialUser,
}: ClassroomPersonaBannerProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserProfileDoc | null>(initialUser);
  const [showTour, setShowTour] = useState(true);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync with server props
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Load tour collapse preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sgx_journey_tour_open");
      if (saved !== null) {
        setShowTour(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for local mutations & balance updates
  useEffect(() => {
    const handleDbMutated = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = (await res.json()) as { user?: UserProfileDoc };
          if (data?.user) {
            setUser(data.user);
          }
        }
      } catch {
        // ignore
      }
    };

    const handleBalanceUpdated = (e: Event) => {
      const detail = (e as CustomEvent<Partial<UserProfileDoc>>).detail;
      if (!detail) return;
      setUser((prev) => (prev ? { ...prev, ...detail } : prev));
    };

    window.addEventListener("sgx:db-mutated", handleDbMutated);
    window.addEventListener("sgx:balance-updated", handleBalanceUpdated);

    return () => {
      window.removeEventListener("sgx:db-mutated", handleDbMutated);
      window.removeEventListener("sgx:balance-updated", handleBalanceUpdated);
    };
  }, []);

  const toggleTour = () => {
    setShowTour((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sgx_journey_tour_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Hide on login or if no user, and always hide in print
  if (!user || pathname === "/login") {
    return null;
  }

  const activeSample = findSampleProfile(user);
  const journeySteps = activeSample
    ? activeSample.journeySteps
    : PERSONAL_ACCOUNT_JOURNEY_STEPS;

  const handleSwitchProfile = (profile: ClassroomSampleProfile) => {
    if (switchingEmail) return;
    setSwitchingEmail(profile.email);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            demoEmail: profile.email,
            demoName: profile.name,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to switch profile");
        }

        const data = (await res.json()) as { user?: UserProfileDoc };
        if (data?.user) {
          setUser(data.user);
        }

        window.dispatchEvent(new CustomEvent("sgx:db-mutated"));

        // Intelligent routing transitions based on role
        if (profile.role === "teacher") {
          if (pathname !== "/admin" && !pathname.startsWith("/admin")) {
            router.push("/admin");
          }
        } else if (profile.role === "superadmin") {
          if (
            pathname !== "/admin" &&
            pathname !== "/launch" &&
            !pathname.startsWith("/admin")
          ) {
            router.push("/admin");
          }
        } else if (profile.email === "chloe.ng@gmail.com") {
          if (
            pathname === "/admin" ||
            pathname === "/launch" ||
            pathname.startsWith("/admin")
          ) {
            router.push("/leaderboard");
          }
        } else if (profile.email === "student1@gmail.com") {
          if (
            pathname === "/admin" ||
            pathname === "/launch" ||
            pathname.startsWith("/admin")
          ) {
            router.push("/dashboard");
          }
        }

        router.refresh();
      } catch (err) {
        console.error("Profile switch error:", err);
      } finally {
        setSwitchingEmail(null);
      }
    });
  };

  return (
    <aside
      aria-label="Sample Classroom Profiles & Guided Tour Ribbon"
      className="print:hidden border-b border-slate-200/90 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/90 shadow-2xs"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
        {/* Top Row: Classroom Profiles Switcher & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Persona Switcher Label & Pills */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold tracking-tight text-white shadow-2xs shrink-0">
              {activeSample ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
                  <span>Sample Classroom</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Personal Account</span>
                </>
              )}
            </div>

            {/* 4 Sample Classroom Profile Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CLASSROOM_SAMPLE_PROFILES.map((profile) => {
                const Icon = PROFILE_ICONS[profile.email] || User;
                const isActive = activeSample?.email === profile.email;
                const isTarget = switchingEmail === profile.email;

                return (
                  <button
                    key={profile.email}
                    type="button"
                    disabled={Boolean(switchingEmail)}
                    onClick={() => handleSwitchProfile(profile)}
                    title={`${profile.name} · ${profile.roleBadge} — ${profile.statHighlight}`}
                    className={`group inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition shadow-2xs ${
                      isActive
                        ? "bg-white border-2 border-sgx-blue text-sgx-blue shadow-sm font-bold ring-2 ring-blue-100"
                        : "border border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900"
                    } disabled:opacity-60`}
                  >
                    {isTarget ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-sgx-blue" />
                    ) : (
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          isActive
                            ? "text-sgx-blue"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                    )}
                    <span>{profile.shortLabel}</span>
                    {isActive && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-sgx-blue" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Personal Account Link + Tour Accordion Toggle */}
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <Link
              href="/login?mode=custom"
              className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white/70 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:bg-white hover:text-sgx-blue transition"
              title="Sign in with your personal Gmail address to trade with fresh S$10,000.00 capital"
            >
              <PlusCircle className="h-3.5 w-3.5 text-sgx-blue" />
              <span>+ My Own Gmail / Login</span>
            </Link>

            <button
              type="button"
              onClick={toggleTour}
              aria-expanded={showTour}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title={showTour ? "Hide guided journey tour" : "Show guided journey tour"}
            >
              <Compass className="h-3.5 w-3.5 text-sgx-blue" />
              <span className="hidden sm:inline">
                {showTour ? "Hide Tour" : "Guided Tour"}
              </span>
              {showTour ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Dynamic 3-Step Guided Journey & Role Summary (when open) */}
        {showTour && (
          <div className="mt-2.5 border-t border-slate-200/70 pt-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sgx-blue">
                  <Sparkles className="h-3 w-3" />
                  What to Explore as {activeSample ? activeSample.name : user.nickname}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {activeSample
                    ? activeSample.statHighlight
                    : "S$10,000.00 Virtual Capital · 20 SGX Stocks"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 max-w-xl truncate">
                {activeSample
                  ? activeSample.summary
                  : "Explore the live SGX order book, test your investment thesis with AI Copilot, and earn 5-Pillar mastery badges."}
              </p>
            </div>

            {/* 3 Step Cards */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {journeySteps.map((step) => {
                const isActiveStep =
                  pathname === step.href ||
                  (step.href !== "/dashboard" &&
                    pathname.startsWith(`${step.href}/`));

                return (
                  <Link
                    key={step.step}
                    href={step.href}
                    className={`group relative flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                      isActiveStep
                        ? "border-sgx-blue bg-white shadow-sm ring-2 ring-blue-100"
                        : "border-slate-200/80 bg-white/70 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                        isActiveStep
                          ? "bg-sgx-blue text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-sgx-blue"
                      }`}
                    >
                      {step.step}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActiveStep ? "text-sgx-blue" : "text-slate-900"
                          }`}
                        >
                          {step.label}
                        </span>
                        {isActiveStep ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sgx-blue shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                            Here
                          </span>
                        ) : (
                          <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-sgx-blue group-hover:translate-x-0.5 transition shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500 line-clamp-1">
                        {step.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
