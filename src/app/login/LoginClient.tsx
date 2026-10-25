"use client";

import { useEffect, useState, useTransition } from "react";
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
} from "lucide-react";
import {
  createGoogleOAuthProvider,
  getFirebaseBrowserAuth,
  isFirebaseBrowserConfigured,
} from "@/lib/firebase/client";
import { getSgxSessionStatus, type SgxSessionStatus } from "@/utils/sgx-market";

const GOOGLE_CLASSROOM_ACCOUNTS = [
  {
    email: "student1@gmail.com",
    name: "Ryan Koh (Sec 4 Student)",
    roleLabel: "Demo Student · S$10,300+ Active Portfolio (4 SGX Stocks)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: GraduationCap,
  },
  {
    email: "chloe.ng@gmail.com",
    name: "Chloe Ng (Sec 4 Student)",
    roleLabel: "Demo Student · Compare Class Leaderboard & Smart Score",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: TrendingUp,
  },
  {
    email: "teacher@sgxedu.sg",
    name: "Ms. Rachel Lim (HOD Finance)",
    roleLabel: "Demo Teacher · View Student Reflections, Dividends & Grades",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: UserCheck,
  },
  {
    email: "admin@sgxedu.sg",
    name: "Dr. Tan (School Superadmin)",
    roleLabel: "Demo Admin · Manage Classes, Trading Rules & Google Sheets",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Award,
  },
];

export default function LoginClient() {
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
  const [activeMode, setActiveMode] = useState<"oauth" | "custom">("oauth");

  const firebaseLive = isFirebaseBrowserConfigured();

  useEffect(() => {
    const updateClock = () => setSessionStatus(getSgxSessionStatus(new Date()));
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  const establishServerSession = async (payload: {
    idToken?: string;
    demoEmail?: string;
    demoName?: string;
    demoPicture?: string | null;
  }) => {
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
    router.push(redirectTarget);
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
        // Instant Google OAuth Classroom Sign-In when running in local sandbox without external Firebase API keys
        await establishServerSession({
          demoEmail: "student1@gmail.com",
          demoName: "Ryan Koh",
        });
      } catch (err: unknown) {
        const firebaseErr = err as { code?: string; message?: string };
        if (firebaseErr?.code === "auth/configuration-not-found") {
          setError(
            "Firebase Authentication is pending 1-click activation in your Firebase Console. Please click 'Get started' in Firebase Console → Authentication, or click any account below to sign in instantly!",
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

  const handleQuickGoogleAccount = (email: string, name: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await establishServerSession({
          demoEmail: email,
          demoName: name.split(" (")[0],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
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
      {/* Top Institutional SGX Ribbon */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/efl-logo.png"
              alt="EduFinLit Logo"
              className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-0.5 shadow-sm"
            />
            <span className="font-display text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              EduFinLit
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${
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
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-slate-600 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {sessionStatus.sgtTimeFormatted}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-12 lg:items-center sm:px-6">
        {/* Left Column: Value Proposition & Authentic SGX Features */}
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-sgx-blue">
            <Sparkles className="h-3.5 w-3.5" />
            Singapore Schools Financial Literacy Simulator · Powered by Google Cloud &amp; Gemini
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-[1.12]">
            Learn How the{" "}
            <span className="text-sgx-blue">Singapore Stock Market</span> Works —
            100% Risk-Free.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-600">
            Every student starts with{" "}
            <strong className="font-mono text-slate-900">S$10,000.00</strong> in
            virtual cash to invest across 20 iconic Singapore companies (like DBS,
            Singtel, SIA, and Sheng Siong). Learn real Singapore Exchange (SGX)
            rules in plain English — with built-in AI coaching for students and
            1-click Google Sheets grading for teachers.
          </p>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sgx-blue">
                <TrendingUp className="h-4 w-4" />
                For Students: Real Charts &amp; AI Coach
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Explore interactive price charts (Candlesticks &amp; Moving Averages
                explained simply), test company dividends, and ask the Socratic
                Gemini AI coach to explain financial news without giving away the
                answers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                For Teachers: Zero-Prep Lesson Ready
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Teach real SGX concepts — <strong>Board Lots</strong> (100-share
                bundles), <strong>Bid/Ask</strong> prices, and{" "}
                <strong>CDP + 9% GST</strong> fees — while grading student weekly
                reflections and diversification scores in one click.
              </p>
            </div>
          </div>

          {/* Live Ticker Preview Strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span className="font-semibold uppercase tracking-wider text-slate-700">
                SGX Blue-Chip Reference Quotes
              </span>
              <span className="font-mono">{sessionStatus.sgtDateFormatted}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { code: "D05.SI", name: "DBS Group", price: "35.50", chg: "+0.85%", up: true },
                { code: "O39.SI", name: "OCBC Bank", price: "14.20", chg: "-0.42%", up: false },
                { code: "S68.SI", name: "SGX Group", price: "10.62", chg: "+0.19%", up: true },
                { code: "C6L.SI", name: "SIA", price: "6.85", chg: "+1.32%", up: true },
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
                  <p className="mt-1 text-[11px] text-slate-500 truncate">{item.name}</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                    S${item.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Google OAuth & Gmail Account Controls Card */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            <div className="text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-sgx-blue">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
                Sign in with Google
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Use your <span className="font-mono text-slate-700">@gmail.com</span> or
                school <span className="font-mono text-slate-700">@*.edu.sg</span>{" "}
                Google Workspace account
              </p>
            </div>

            {/* Primary 1-Click Google OAuth Button */}
            <button
              type="button"
              disabled={isPending}
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
                Viewing inside an embedded Google Site? Open Full-Screen in New Tab ↗
              </a>
            </div>

            {/* Mode Switcher: Quick Classroom Accounts vs Custom Gmail */}
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
                  Quick Classroom Profiles
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
                  Any Gmail Address
                </button>
              </div>

              {activeMode === "oauth" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-500">
                    <strong>Instant Demo Profiles:</strong> Click any role below to
                    explore a pre-loaded Student, Teacher, or Admin account right
                    away (no password needed):
                  </p>
                  {GOOGLE_CLASSROOM_ACCOUNTS.map((acct) => {
                    const Icon = acct.icon;
                    return (
                      <button
                        key={acct.email}
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleQuickGoogleAccount(acct.email, acct.name)
                        }
                        className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-sgx-blue hover:bg-blue-50/40 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-sgx-blue shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {acct.name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 truncate">
                              {acct.email}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded border px-1.5 py-0.2 text-[10px] font-semibold ${acct.badgeClass}`}
                            >
                              {acct.roleLabel}
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
                      Full Name / Nickname
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
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    Sign In with Google Account
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

      {/* Mandatory MAS & SGX Compliance Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4">
        <div className="mx-auto max-w-5xl text-center text-[11px] leading-relaxed text-slate-500">
          EduFinLit is a paper trading simulation for educational purposes
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
