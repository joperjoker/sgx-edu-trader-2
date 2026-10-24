"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
  Bell,
  ArrowRight,
  Building2,
} from "lucide-react";
import { completeOnboardingAction } from "@/actions/onboarding";
import type { UserProfileDoc } from "@/types/firestore";

interface Props {
  user: UserProfileDoc | null;
}

export default function OnboardingFlow({ user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"terms" | "welcome" | "done">(() =>
    user && !user.acceptedTermsAt ? "terms" : "done",
  );
  const [agreed, setAgreed] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [joinCode, setJoinCode] = useState("SGX4E1");
  const [error, setError] = useState<string | null>(null);
  const [notifBanner, setNotifBanner] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!user || (user.acceptedTermsAt && step === "done" && !notifBanner)) {
    return null;
  }

  const handleFinishWelcome = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await completeOnboardingAction({
        nickname: nickname.trim() || user.nickname,
        classJoinCode: joinCode.trim(),
      });
      if (!res.success) {
        setError(res.error ?? "Could not save onboarding profile.");
        return;
      }
      setStep("done");
      if (
        typeof window !== "undefined" &&
        !localStorage.getItem("sgx_notif_asked_v2")
      ) {
        setNotifBanner(true);
      }
      router.refresh();
    });
  };

  const handleEnableNotifications = async () => {
    localStorage.setItem("sgx_notif_asked_v2", "true");
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          localStorage.setItem("sgx_notif_enabled", "true");
        }
      } catch {
        // ignore browser permission block
      }
    }
    setNotifBanner(false);
  };

  const handleDismissNotifications = () => {
    localStorage.setItem("sgx_notif_asked_v2", "true");
    setNotifBanner(false);
  };

  return (
    <>
      {step === "terms" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-terms-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl animate-scale-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-sgx-blue">
              <ShieldCheck className="h-4 w-4" />
              SGX Educational Compliance & PDPA Notice
            </div>

            <h2
              id="onboarding-terms-title"
              className="mt-4 font-display text-2xl font-bold text-slate-900"
            >
              Before You Start — Please Read
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                <p className="font-semibold text-slate-900">
                  1. 100% Educational Paper Trading Simulation
                </p>
                <p className="mt-1">
                  You receive <strong className="font-mono text-slate-900">S$10,000.00</strong>{" "}
                  of virtual simulation capital. No real money or actual SGX securities
                  transactions are involved.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                <p className="font-semibold text-slate-900">
                  2. Google Cloud & Privacy Protection
                </p>
                <p className="mt-1">
                  Your Google account email and paper trading activity are stored securely
                  in Google Cloud Firestore. When you use Gemini AI study tools, only public
                  stock market data (never personal information) is sent for analysis.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                <p className="font-semibold text-slate-900">
                  3. Classroom Assessment Visibility
                </p>
                <p className="mt-1">
                  Your school teacher can view your portfolio allocation, contract notes,
                  and weekly learning reflections as part of your financial literacy curriculum.
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 hover:border-blue-300 transition">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sgx-blue focus:ring-sgx-blue"
              />
              <span className="font-medium">
                I understand this is an educational simulation and not real investing or
                financial advice.
              </span>
            </label>

            <button
              type="button"
              disabled={!agreed}
              onClick={() => setStep("welcome")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sgx-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Accept & Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === "welcome" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <form
            onSubmit={handleFinishWelcome}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl animate-scale-in"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Google Workspace Classroom Onboarding
            </div>

            <h2
              id="onboarding-welcome-title"
              className="mt-4 font-display text-2xl font-bold text-slate-900"
            >
              Welcome to EFL · EduFinLit 📈
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Signed in with Google as{" "}
              <span className="font-mono font-medium text-slate-800">
                {user.email}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-mono font-bold text-sgx-blue">S$10,000.00</span>
                <p className="mt-0.5 text-slate-600">
                  <strong>Starter Fund:</strong> Virtual cash to invest across 20 real Singapore companies.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-mono font-bold text-slate-900">100 Shares / Lot</span>
                <p className="mt-0.5 text-slate-600">
                  <strong>SGX Board Lots:</strong> On SGX, shares are bought in standard bundles of 100.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-mono font-bold text-emerald-700">Smart Score</span>
                <p className="mt-0.5 text-slate-600">
                  <strong>How to Win:</strong> Grow your portfolio AND spread risk across different sectors!
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="onboard-nickname"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Display Name / Trader Nickname
                </label>
                <input
                  id="onboard-nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20"
                  placeholder="e.g. Ryan Koh"
                />
              </div>

              <div>
                <label
                  htmlFor="onboard-joincode"
                  className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-sgx-blue" />
                    Class Join Code (Optional)
                  </span>
                  <span className="font-mono text-[11px] font-normal text-slate-500">
                    Default: SGX4E1 or SGXJC1
                  </span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    id="onboard-joincode"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-slate-900 outline-none focus:border-sgx-blue focus:ring-2 focus:ring-sgx-blue/20"
                    placeholder="SGX4E1"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sgx-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? "Setting up your SGX account…" : "I Understand — Let's Trade!"}
            </button>
          </form>
        </div>
      )}

      {notifBanner && (
        <div className="fixed bottom-5 right-5 z-40 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sgx-blue">
              <Bell className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Enable Leaderboard Alerts?
              </p>
              <p className="text-xs text-slate-600">
                Receive an instant browser alert when a classmate overtakes your
                rank on the SGX Leaderboard.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="rounded-lg bg-sgx-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Yes, notify me
                </button>
                <button
                  type="button"
                  onClick={handleDismissNotifications}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
