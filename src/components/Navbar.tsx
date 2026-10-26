"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  PieChart,
  Trophy,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wallet,
  Briefcase,
  Sparkles,
  Bot,
  BookOpen,
  PlusCircle,
  User as UserIcon,
} from "lucide-react";
import {
  getFirebaseBrowserAuth,
  getFirebaseBrowserDb,
  isFirebaseBrowserConfigured,
} from "@/lib/firebase/client";
import type { UserProfileDoc } from "@/types/firestore";
import { formatSgd } from "@/utils/sgx-market";
import {
  CLASSROOM_SAMPLE_PROFILES,
  type ClassroomSampleProfile,
  findSampleProfile,
} from "@/utils/classroom-profiles";

interface Props {
  initialUser: UserProfileDoc | null;
}

export default function Navbar({ initialUser }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserProfileDoc | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flashTone, setFlashTone] = useState<"bull" | "bear" | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const prevNetRef = useRef<number>(initialUser?.netValue ?? 10000);
  const prevCashRef = useRef<number>(initialUser?.cashBalance ?? 10000);

  // Sync when server props update
  useEffect(() => {
    setUser(initialUser);
    if (initialUser) {
      prevNetRef.current = initialUser.netValue;
      prevCashRef.current = initialUser.cashBalance;
    }
  }, [initialUser]);

  // Fix Legacy Bug #7: Close both user dropdown & mobile drawer on any route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Fix Legacy Bug #7: Outside click closes user dropdown
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const currentUid = user?.uid ?? null;

  // Real-time balance & portfolio updates (Firestore onSnapshot + CustomEvent bridge)
  useEffect(() => {
    if (!currentUid) return;

    const triggerFlashIfChanged = (nextNet: number, nextCash: number) => {
      // Fix Legacy Bug #8: Only flash when values genuinely change
      const netDelta = nextNet - prevNetRef.current;
      const cashDelta = nextCash - prevCashRef.current;
      if (Math.abs(netDelta) < 0.005 && Math.abs(cashDelta) < 0.005) {
        return;
      }
      prevNetRef.current = nextNet;
      prevCashRef.current = nextCash;
      setFlashTone(netDelta >= 0 ? "bull" : "bear");
      const timer = setTimeout(() => setFlashTone(null), 500);
      return () => clearTimeout(timer);
    };

    // Listen to local immediate trade events
    const handleCustomBalanceUpdate = (e: Event) => {
      const detail = (e as CustomEvent<Partial<UserProfileDoc>>).detail;
      if (!detail) return;
      setUser((prev) => {
        if (!prev) return prev;
        const nextNet =
          typeof detail.netValue === "number" ? detail.netValue : prev.netValue;
        const nextCash =
          typeof detail.cashBalance === "number"
            ? detail.cashBalance
            : prev.cashBalance;
        triggerFlashIfChanged(nextNet, nextCash);
        return { ...prev, ...detail };
      });
    };

    window.addEventListener("sgx:balance-updated", handleCustomBalanceUpdate);

    // If Firebase client is configured, attach live Firestore onSnapshot listener
    let unsubscribeFirestore: (() => void) | null = null;
    if (isFirebaseBrowserConfigured()) {
      const db = getFirebaseBrowserDb();
      if (db) {
        const userRef = doc(db, "users", currentUid);
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snap) => {
            if (!snap.exists()) return;
            const data = snap.data() as UserProfileDoc;
            triggerFlashIfChanged(data.netValue, data.cashBalance);
            setUser(data);
          },
          () => {
            // Ignore permission fallback errors in demo mode
          },
        );
      }
    }

    return () => {
      window.removeEventListener(
        "sgx:balance-updated",
        handleCustomBalanceUpdate,
      );
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [currentUid]);

  if (!user || pathname === "/login") {
    return null;
  }

  const startingCapital = user.startingCapital > 0 ? user.startingCapital : 10000;
  const cash = Number(user.cashBalance ?? 0);
  const netValue = Number(user.netValue ?? cash);
  const holdingsValue = Math.max(0, Number((netValue - cash).toFixed(2)));
  const pnlDelta = Number((netValue - startingCapital).toFixed(2));
  // Fix Legacy Bug #5: Use >= 0 so S$10,000.00 starting capital never shows as a red loss
  const isProfit = pnlDelta >= 0;

  const isAdminOrTeacher =
    user.role === "teacher" || user.role === "superadmin";

  const navItems = [
    { href: "/dashboard", label: "SGX Market", icon: LayoutDashboard },
    { href: "/copilot", label: "AI Copilot", icon: Bot },
    { href: "/portfolio", label: "My Portfolio", icon: PieChart },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/handbook", label: "Handbooks & Videos", icon: BookOpen },
    { href: "/launch", label: "Google Launch", icon: Sparkles },
  ];
  if (isAdminOrTeacher) {
    navItems.push({ href: "/admin", label: "Teacher Console", icon: Shield });
  }

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseBrowserAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch {
      // ignore client signout error
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const handleQuickSwitchProfile = async (profile: ClassroomSampleProfile) => {
    try {
      setMenuOpen(false);
      setMobileOpen(false);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoEmail: profile.email,
          demoName: profile.name,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: UserProfileDoc };
        if (data?.user) {
          setUser(data.user);
        }
      }
      window.dispatchEvent(new CustomEvent("sgx:db-mutated"));

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
      console.error(err);
    }
  };

  const activeSampleProfile = findSampleProfile(user);

  const roleBadgeClass =
    user.role === "superadmin"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : user.role === "teacher"
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-blue-50 text-sgx-blue border-blue-200";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: EduFinLit Brand Identity & Main App Logo */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 group focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/efl-logo.png"
              alt="EduFinLit Logo"
              className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-0.5 shadow-sm transition group-hover:border-sgx-blue"
            />
            <span className="font-display text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              EduFinLit
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-blue-50 text-sgx-blue border border-blue-200/80 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Live Cash, Portfolio & P&L Chips + Google User Avatar */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            aria-live="polite"
            className={`hidden sm:flex shrink-0 whitespace-nowrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-xs transition-colors ${
              flashTone === "bull"
                ? "animate-flash-bull border-emerald-300"
                : flashTone === "bear"
                  ? "animate-flash-bear border-rose-300"
                  : ""
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Cash:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                S${formatSgd(cash)}
              </span>
            </div>

            <span className="hidden 2xl:inline-block h-3.5 w-px bg-slate-200" />

            <div className="hidden 2xl:flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Portfolio:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                S${formatSgd(holdingsValue)}
              </span>
            </div>

            <span className="h-3.5 w-px bg-slate-200" />

            {/* Mandatory ▲/▼ symbol AND profit/loss text */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                isProfit
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {isProfit ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
              {isProfit ? "profit" : "loss"}
            </span>
          </div>

          {/* User Avatar & Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300"
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.nickname}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sgx-blue text-xs font-bold text-white">
                  {(user.nickname || user.email || "T").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden lg:inline-block max-w-[110px] truncate">
                {user.nickname}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-scale-in">
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user.nickname}
                  </p>
                  <p className="font-mono text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass}`}
                    >
                      {user.role}
                    </span>
                    {activeSampleProfile && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-sgx-blue">
                        {activeSampleProfile.shortLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-2 text-xs text-slate-600 space-y-1 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span>Net Account Value</span>
                    <span className="font-mono font-bold text-slate-900">
                      S${formatSgd(netValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total SGX Fees Paid</span>
                    <span className="font-mono text-slate-700">
                      S${formatSgd(user.totalFeesPaid)}
                    </span>
                  </div>
                </div>

                {/* Switch Sample Classroom Profile */}
                <div className="py-2.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Switch Sample Profile
                  </p>
                  <div className="space-y-1">
                    {CLASSROOM_SAMPLE_PROFILES.map((profile) => {
                      const isCurrent =
                        user.email.toLowerCase() ===
                          profile.email.toLowerCase() ||
                        user.uid === profile.uid ||
                        user.uid ===
                          `gmail-${profile.email.replace(/[^a-z0-9]/g, "-")}`;
                      return (
                        <button
                          key={profile.email}
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleQuickSwitchProfile(profile)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition ${
                            isCurrent
                              ? "bg-blue-50 font-bold text-sgx-blue border border-blue-200/60"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isCurrent ? "bg-sgx-blue" : "bg-slate-300"
                              }`}
                            />
                            <span className="truncate">{profile.shortLabel}</span>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] font-bold text-sgx-blue shrink-0">
                              Active
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {profile.role}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Personal Gmail Action */}
                <Link
                  href="/login?mode=custom"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sgx-blue hover:text-sgx-blue hover:bg-blue-50/30"
                >
                  <PlusCircle className="h-4 w-4 text-sgx-blue shrink-0" />
                  <span>Sign In with Personal Gmail</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign out of Google Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            className="inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden space-y-3 shadow-lg">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Cash Available:</span>
              <span className="font-mono font-bold text-slate-900">
                S${formatSgd(cash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Portfolio Holdings:</span>
              <span className="font-mono font-bold text-slate-900">
                S${formatSgd(holdingsValue)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500">Total Return:</span>
              <span
                className={`font-mono font-semibold ${
                  isProfit ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isProfit ? "▲" : "▼"} S${formatSgd(Math.abs(pnlDelta))}{" "}
                {isProfit ? "profit" : "loss"}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                    active
                      ? "bg-blue-50 text-sgx-blue"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Profile Switcher & Sign Out */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Sample Profile
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {CLASSROOM_SAMPLE_PROFILES.map((profile) => {
                const isCurrent =
                  user.email.toLowerCase() === profile.email.toLowerCase() ||
                  user.uid === profile.uid ||
                  user.uid ===
                    `gmail-${profile.email.replace(/[^a-z0-9]/g, "-")}`;
                return (
                  <button
                    key={profile.email}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleQuickSwitchProfile(profile)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-blue-50 text-sgx-blue font-bold border border-blue-200"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{profile.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <Link
              href="/login?mode=custom"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
            >
              <PlusCircle className="h-3.5 w-3.5 text-sgx-blue" />
              Sign In with Personal Gmail
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out of Google Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
