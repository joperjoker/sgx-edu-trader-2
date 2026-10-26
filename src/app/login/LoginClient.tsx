"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  GraduationCap,
  Award,
  ArrowRight,
  LayoutDashboard,
  BookOpen,
  Loader2,
  User,
} from "lucide-react";
import {
  createGoogleOAuthProvider,
  getFirebaseBrowserAuth,
  isFirebaseBrowserConfigured,
} from "@/lib/firebase/client";
import { getSgxSessionStatus, type SgxSessionStatus } from "@/utils/sgx-market";
import {
  CLASSROOM_SAMPLE_PROFILES,
  type ClassroomSampleProfile,
} from "@/utils/classroom-profiles";

interface LoginClientProps {
  schoolName?: string;
  isFirebaseConfigured?: boolean;
}

const PROFILE_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "student1@gmail.com": GraduationCap,
  "chloe.ng@gmail.com": TrendingUp,
  "teacher@sgxedu.sg": UserCheck,
  "admin@sgxedu.sg": Award,
};

export default function LoginClient({
  schoolName,
  isFirebaseConfigured: propConfigured,
}: LoginClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [sessionStatus, setSessionStatus] = useState<SgxSessionStatus>(() =>
    getSgxSessionStatus(new Date()),
  );
  const [customGmail, setCustomGmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeProfileSigningIn, setActiveProfileSigningIn] = useState<
    string | null
  >(null);

  const initialMode =
    searchParams.get("mode") === "custom" ? "custom" : "oauth";
  const [activeMode, setActiveMode] = useState<"oauth" | "custom">(initialMode);

  const firebaseLive =
    propConfigured !== undefined ? propConfigured : isFirebaseBrowserConfigured();

  // Keep mode in sync if URL query parameter changes
  useEffect(() => {
    if (searchParams.get("mode") === "custom") {
      setActiveMode("custom");
    }
  }, [searchParams]);

  useEffect(() => {
    const updateClock = () => setSessionStatus(getSgxSessionStatus(new Date()));
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  const establishServerSession = async (
    payload: {
      idToken?: string;
      demoEmail?: string;
      demoName?: string;
      demoPicture?: string | null;
    },
    targetRoute = redirectTarget,
  ) => {
    setError(null);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
    };
    if (!res.ok || !data.success) {
      throw new Error(data.error ?? "Google OAuth session handshake failed.");
    }
    window.dispatchEvent(new CustomEvent("sgx:db-mutated"));
    router.push(targetRoute);
    router.refresh();
  };

  const handleGoogleOAuthPopup = () => {
    setError(null);
    startTransition(async () => {
      try {
        const auth = getFirebaseBrowserAuth();
        if (auth && firebaseLive) {
          const provider = createGoogleOAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const idToken = await result.user.getIdToken();
          await establishServerSession({ idToken });
          return;
        }
        // Sandbox fallback
        await establishServerSession({
          demoEmail: "student1@gmail.com",
          demoName: "Ryan Koh",
        });
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        if (firebaseErr?.code === "auth/configuration-not-found") {
          setError(
            "Firebase Authentication is pending 1-click activation in your Firebase Console. Sign in instantly below using any sample classroom profile or custom Gmail!",
          );
          setActiveMode("custom");
          return;
        }
        const msg =
          err instanceof Error ? err.message : "Google Sign-In was cancelled.";
        setError(msg);
      }
    });
  };

  const handleEnterSampleProfile = (profile: ClassroomSampleProfile) => {
    setError(null);
    setActiveProfileSigningIn(profile.email);

    startTransition(async () => {
      try {
        const target =
          redirectTarget !== "/dashboard"
            ? redirectTarget
            : profile.defaultRoute;
        await establishServerSession(
          {
            demoEmail: profile.email,
            demoName: profile.name,
          },
          target,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      } finally {
        setActiveProfileSigningIn(null);
      }
    });
  };

  const handleCustomGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customGmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid @gmail.com or @*.edu.sg Google account.");
      return;
    }
    startTransition(async () => {
      try {
        await establishServerSession({
          demoEmail: cleanEmail,
          demoName: customName.trim() || cleanEmail.split("@")[0],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      }
    });
  };

  return (
    <main className="min-h-screen bg-sgx-canvas text-sgx-ink flex flex-col justify-between">
      {/* Top Institutional SGX Ribbon with Pre-Login Explore Links */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/efl-logo.png"
              alt="EduFinLit Logo"
              className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-0.5 shadow-sm"
            />
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                EduFinLit
              </span>
              {schoolName && (
                <span className="hidden md:inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {schoolName}
                </span>
              )}
            </div>
          </div>

          {/* Pre-login Explore Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-sgx-blue hover:text-sgx-blue transition"
              title="Preview the 20 SGX counters screener and live order books"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-sgx-blue" />
              <span>Explore Live Market</span>
            </Link>

            <Link
              href="/handbook"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-indigo-600 hover:text-indigo-600 transition"
              title="Watch video tutorials and read student handbooks"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Watch</span>
              <span>Video Guides &amp; Handbooks</span>
            </Link>

            {/* Live Exchange Session Pill */}
            <div className="hidden lg:flex items-center gap-2 text-xs pl-2 border-l border-slate-200">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${
                  sessionStatus.isOpen
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : sessionStatus.phase === "MIDDAY_BREAK" ||
                        sessionStatus.phase === "PRE_OPEN" ||
                        sessionStatus.phase === "PRE_CLOSE"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    sessionStatus.isOpen
                      ? "bg-emerald-500 animate-pulse"
                      : sessionStatus.phase === "MIDDAY_BREAK"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                  }`}
                />
                {sessionStatus.shortBadge}
              </span>
              <span className="font-mono text-slate-600 tabular-nums">
                <Clock className="h-3.5 w-3.5 inline text-slate-400 mr-1" />
                {sessionStatus.sgtTimeFormatted}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* 3-Stage User Journey Overview Strip */}
        <section
          aria-label="3-Stage Platform Journey Map"
          className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sgx-blue">
                <Sparkles className="h-4 w-4" />
                How EduFinLit Works · 3-Stage Educational Pathway
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Authentic SGX Market Microstructure for Singapore Schools
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-500">
              Pre-Login &amp; Classroom Onboarding Journey
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Stage 1 */}
            <div className="relative rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition hover:bg-blue-50/70">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sgx-blue text-xs font-black text-white shadow-sm">
                  1
                </span>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Pick Sample Profile or Google Sign-In
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Instantly enter as <strong>Ryan</strong> (Student), <strong>Chloe</strong> (#1 Leader), <strong>Ms. Lim</strong> (Teacher), or <strong>Dr. Tan</strong> (Admin), or connect your personal <strong>@gmail.com</strong> account with fresh <strong>S$10,000.00</strong> capital.
              </p>
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sgx-blue">
                <span>1-Click Entry · Zero Setup Required</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="relative rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white shadow-sm">
                  2
                </span>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Trade 20 Real SGX Stocks with AI Coach
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Experience authentic <strong>100-share Board Lots</strong>, <strong>Bid/Ask spreads</strong>, and <strong>CDP clearing + 9% GST</strong>. Run DRIP compound math and bounce trade theses against Socratic Gemini AI.
              </p>
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-700">
                <span>DBS, Singtel, SIA, Keppel &amp; More</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="relative rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 transition hover:bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-sm">
                  3
                </span>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Audit 5-Pillars &amp; Google Sheets Export
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Students earn 5-Pillar Passport competencies (Fee Drag, Diversification, Risk). Educators view class <strong>SOLO taxonomy heatmaps</strong>, credit quarterly dividends, and export grades to Google Sheets.
              </p>
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-indigo-700">
                <span>1 − HHI Diversification · SOLO Rubrics</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Main Section: Persona Showcase (Left) + Google Auth Card (Right) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: 4 Sample Classroom Profiles Showcase + Blue-Chip Strip */}
          <div className="space-y-6 lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Sample Classroom Profiles Showcase
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-sgx-blue border border-blue-200">
                  4 Interactive Roles
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experience EduFinLit from any perspective. Click any classroom persona below to launch their pre-configured portfolio, teacher tools, or school governance controls immediately:
              </p>
            </div>

            {/* 4 Sample Profile Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {CLASSROOM_SAMPLE_PROFILES.map((profile) => {
                const Icon = PROFILE_ICON_MAP[profile.email] || User;
                const isSigningIn = activeProfileSigningIn === profile.email;

                return (
                  <div
                    key={profile.email}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sgx-blue hover:shadow-md"
                  >
                    <div>
                      {/* Top Header of Persona Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-sgx-blue">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display text-sm font-bold text-slate-900">
                              {profile.name}
                            </h3>
                            <span className="font-mono text-[11px] text-slate-500">
                              {profile.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Role Badge & Live Cohort Metric */}
                      <div className="mt-2.5 space-y-1">
                        <span className="inline-block rounded-md border border-blue-200 bg-blue-50/70 px-2 py-0.5 text-[10px] font-bold text-sgx-blue">
                          {profile.roleBadge}
                        </span>
                        <p className="font-mono text-xs font-extrabold text-slate-800">
                          {profile.statHighlight}
                        </p>
                      </div>

                      {/* Persona Summary */}
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {profile.summary}
                      </p>

                      {/* 3 Guided Highlights */}
                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Signature Experience
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {profile.journeySteps.map((step) => (
                            <li
                              key={step.step}
                              className="flex items-center gap-1.5"
                            >
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                                {step.step}
                              </span>
                              <span className="truncate">{step.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      type="button"
                      disabled={Boolean(activeProfileSigningIn) || isPending}
                      onClick={() => handleEnterSampleProfile(profile)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50/70 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-sgx-blue hover:bg-sgx-blue hover:text-white disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Launching {profile.name}…</span>
                        </>
                      ) : (
                        <>
                          <span>Enter as {profile.name.split(" ")[0]}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Live Blue-Chip Reference Quotes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                <span className="font-bold uppercase tracking-wider text-slate-700">
                  SGX Blue-Chip Reference Quotes
                </span>
                <span className="font-mono">{sessionStatus.sgtDateFormatted}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    code: "D05.SI",
                    name: "DBS Group",
                    price: "35.50",
                    chg: "+0.85%",
                    up: true,
                  },
                  {
                    code: "O39.SI",
                    name: "OCBC Bank",
                    price: "14.20",
                    chg: "-0.42%",
                    up: false,
                  },
                  {
                    code: "S68.SI",
                    name: "SGX Group",
                    price: "10.62",
                    chg: "+0.19%",
                    up: true,
                  },
                  {
                    code: "C6L.SI",
                    name: "SIA",
                    price: "6.85",
                    chg: "+1.32%",
                    up: true,
                  },
                ].map((item) => (
                  <div
                    key={item.code}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.code}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          item.up
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.up ? "▲" : "▼"} {item.chg}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 truncate">
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                      S${item.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Personal Google OAuth & Custom Account Sign-In Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5 sticky top-20">
              <div className="text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-sgx-blue shadow-2xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
                  Sign in with Google
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Use your personal{" "}
                  <span className="font-mono text-slate-700">@gmail.com</span> or
                  school{" "}
                  <span className="font-mono text-slate-700">@*.edu.sg</span>{" "}
                  Google Workspace account
                </p>
              </div>

              {/* Primary 1-Click Google OAuth Button */}
              <button
                type="button"
                disabled={isPending || Boolean(activeProfileSigningIn)}
                onClick={handleGoogleOAuthPopup}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sgx-blue hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-sgx-blue/30 disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
                  />
                </svg>
                <span>
                  {isPending
                    ? "Connecting to Google Identity…"
                    : "Continue with Google (Gmail)"}
                </span>
              </button>

              <div className="mt-2 text-center">
                <a
                  href="https://sgx-edu-trader-2-sg.web.app/login"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-sgx-blue hover:underline"
                >
                  Viewing inside Google Sites? Open Full-Screen ↗
                </a>
              </div>

              {/* Mode Switcher: Sample Classroom Profiles vs Custom Gmail */}
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveMode("oauth")}
                    className={`rounded-lg py-2 transition ${
                      activeMode === "oauth"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Classroom Profiles
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("custom")}
                    className={`rounded-lg py-2 transition ${
                      activeMode === "custom"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Custom Gmail
                  </button>
                </div>

                {activeMode === "oauth" ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      <strong>Instant Classroom Demo:</strong> Click any profile to
                      test their live portfolio and role permissions immediately:
                    </p>
                    {CLASSROOM_SAMPLE_PROFILES.map((profile) => {
                      const Icon = PROFILE_ICON_MAP[profile.email] || User;
                      const isTarget =
                        activeProfileSigningIn === profile.email;

                      return (
                        <button
                          key={profile.email}
                          type="button"
                          disabled={
                            isPending || Boolean(activeProfileSigningIn)
                          }
                          onClick={() => handleEnterSampleProfile(profile)}
                          className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-sgx-blue hover:bg-blue-50/40 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-sgx-blue shadow-sm">
                              {isTarget ? (
                                <Loader2 className="h-4 w-4 animate-spin text-sgx-blue" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {profile.name}
                              </p>
                              <p className="font-mono text-[11px] text-slate-500 truncate">
                                {profile.email}
                              </p>
                              <span className="mt-1 inline-block rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-sgx-blue">
                                {profile.roleBadge}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sgx-blue shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <form
                    onSubmit={handleCustomGmailSubmit}
                    className="mt-3 space-y-3"
                    noValidate
                  >
                    <p className="text-[11px] text-slate-500">
                      Sign in with your personal Google or school email address. You will receive <strong>S$10,000.00</strong> starting capital.
                    </p>
                    <div>
                      <label
                        htmlFor="gmail-input"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Google / Gmail Address
                      </label>
                      <input
                        id="gmail-input"
                        type="email"
                        required
                        value={customGmail}
                        onChange={(e) => setCustomGmail(e.target.value)}
                        placeholder="yourname@gmail.com or student@school.edu.sg"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gmail-name"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Full Name / Student Nickname
                      </label>
                      <input
                        id="gmail-name"
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Ethan Lim"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPending || Boolean(activeProfileSigningIn)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      <span>
                        {isPending ? "Signing In…" : "Sign In with Google Account"}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                >
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory MAS & SGX Educational Disclaimer Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 mt-8">
        <div className="mx-auto max-w-5xl text-center text-[11px] leading-relaxed text-slate-500">
          SGX Edu-Trader is a paper trading simulation for educational purposes
          only. No real securities transactions are conducted and no real money is
          involved. Not licensed by the Monetary Authority of Singapore (MAS). Not
          financial advice under the Financial Advisers Act (Cap. 110) or
          Securities and Futures Act (Cap. 289) of Singapore. Not affiliated with
          Singapore Exchange Limited (SGX Group).
        </div>
      </footer>
    </main>
  );
}
