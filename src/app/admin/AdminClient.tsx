"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  Cloud,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Unlock,
  Upload,
  Users,
} from "lucide-react";
import {
  adminTakePortfolioSnapshotsAction,
  adminTriggerMarketSyncAction,
  createClassGroupAction,
  createWeeklyChallengeAction,
  distributeClassDividendsAction,
  importGoogleWorkspaceRosterAction,
  resetAllStudentsAction,
  resetSingleStudentAction,
  setClassTradingLockAction,
  updateExchangeSettingsAction,
  updateUserRoleAction,
  type GoogleSheetsImportRow,
} from "@/actions/admin";
import type {
  AppSettingsDoc,
  ClassGroupDoc,
  ReflectionDoc,
  TradeHistoryDoc,
  UserProfileDoc,
  UserRole,
  WeeklyChallengeDoc,
} from "@/types/firestore";
import {
  calculateSmartInvestorScore,
  formatSgd,
  formatSgxPrice,
} from "@/utils/sgx-market";

interface Props {
  currentUser: UserProfileDoc;
  settings: AppSettingsDoc;
  users: UserProfileDoc[];
  classes: ClassGroupDoc[];
  challenges: WeeklyChallengeDoc[];
  trades: TradeHistoryDoc[];
  reflections: ReflectionDoc[];
  marketUpdatedAt: string;
}

type AdminTab =
  | "roster"
  | "google_workspace"
  | "controls"
  | "challenges"
  | "audit"
  | "cloud_health";

export default function AdminClient({
  currentUser,
  settings: initialSettings,
  users,
  classes,
  challenges,
  trades,
  reflections,
  marketUpdatedAt,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("roster");
  const [settings, setSettings] = useState<AppSettingsDoc>(initialSettings);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // New Class Form
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassSemester, setNewClassSemester] = useState(
    settings.currentSemester || "2026-S2",
  );

  // Google Sheets CSV/TSV Paste Box
  const [sheetsText, setSheetsText] = useState(
    "ethan.lim@gmail.com, Ethan Lim, SGX4E1\npriya.nair@gmail.com, Priya Nair, SGX4E1\nlucas.tan@gmail.com, Lucas Tan, SGXJC1",
  );

  // Weekly Challenge Form
  const [challClassId, setChallClassId] = useState(
    classes[0]?.id ?? "class-sec4-express-a",
  );
  const [challTitle, setChallTitle] = useState("");
  const [challDesc, setChallDesc] = useState("");
  const [challStart, setChallStart] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [challEnd, setChallEnd] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );

  const students = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "student" &&
          (selectedClassId === "ALL" ||
            u.classGroupIds.includes(selectedClassId)),
      ),
    [users, selectedClassId],
  );

  const notify = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 5000);
  };

  // Export Classroom Gradebook to Google Sheets (CSV)
  const handleExportGoogleSheetsCsv = () => {
    const header = [
      "Email (Google Account)",
      "Nickname",
      "Class Group",
      "Net Value (S$)",
      "Cash Balance (S$)",
      "Holdings Value (S$)",
      "Total Return (%)",
      "Diversification (%)",
      "Smart Investor Score",
      "Total Fees Paid (S$)",
      "Reflections Submitted",
    ];

    const classLookup = new Map<string, string>();
    classes.forEach((c) => classLookup.set(c.id, c.name));

    const rows = students.map((s) => {
      const base = s.startingCapital || 10000;
      const retPct = (((s.netValue - base) / base) * 100).toFixed(2);
      const divPct = Math.round((1 - (s.hhi ?? 1)) * 100);
      const smart = calculateSmartInvestorScore(
        s.netValue,
        base,
        s.hhi ?? 1,
      ).toFixed(2);
      const reflCount = reflections.filter((r) => r.userId === s.uid).length;
      const className =
        s.classGroupIds.map((id) => classLookup.get(id) ?? id).join("; ") ||
        "Unassigned";

      return [
        s.email,
        `"${s.nickname.replace(/"/g, '""')}"`,
        `"${className}"`,
        s.netValue.toFixed(2),
        s.cashBalance.toFixed(2),
        s.holdingsValue.toFixed(2),
        retPct,
        String(divPct),
        smart,
        s.totalFeesPaid.toFixed(2),
        String(reflCount),
      ].join(",");
    });

    const csvContent = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SGX-EduTrader-GoogleSheets-Gradebook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Exported Google Sheets Gradebook CSV.");
  };

  const handleImportRoster = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = sheetsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: GoogleSheetsImportRow[] = lines.map((line) => {
      const parts = line.split(/\t|,/).map((p) => p.trim());
      return {
        email: parts[0] ?? "",
        nickname: parts[1] ?? "",
        classNameOrCode: parts[2] ?? "SGX4E1",
      };
    });

    startTransition(async () => {
      const res = await importGoogleWorkspaceRosterAction(parsed);
      if (res.success && res.data) {
        notify(
          `Google Roster Sync Complete: ${res.data.created} created, ${res.data.updated} updated, ${res.data.failed} failed.`,
        );
        router.refresh();
      } else {
        notify(res.error ?? "Import failed.");
      }
    });
  };

  const handleToggleSetting = (patch: Partial<AppSettingsDoc>, label: string) => {
    startTransition(async () => {
      const res = await updateExchangeSettingsAction(patch);
      if (res.success && res.data) {
        setSettings(res.data);
        notify(`Updated ${label}.`);
        router.refresh();
      }
    });
  };

  const TABS: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
    { id: "roster", label: "Classroom & Reflections", icon: Users },
    {
      id: "google_workspace",
      label: "Google Workspace & Sheets",
      icon: FileSpreadsheet,
    },
    { id: "controls", label: "SGX Market Controls", icon: Sliders },
    { id: "challenges", label: "Weekly Challenges", icon: Award },
    { id: "audit", label: "Contract Note Audit", icon: BookOpen },
    { id: "cloud_health", label: "Google Cloud Health", icon: Cloud },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Command Center Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-[11px] font-bold text-indigo-700">
            <Shield className="h-3.5 w-3.5" />
            Teacher & Superadmin Command Console · {currentUser.role.toUpperCase()}
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {settings.schoolName} — SGX Classroom Administration
          </h1>
          <p className="text-xs text-slate-500">
            No finance degree required: manage student rosters, review weekly reflections, customize classroom trading rules, and export grades to Google Sheets in 1 click.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportGoogleSheetsCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          Export Gradebook for Google Sheets
        </button>
      </section>

      {/* Teacher 3-Step Quick-Start Classroom Guide */}
      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 text-xs text-slate-700 md:grid-cols-3">
        <div>
          <strong className="text-indigo-950">Step 1 · Onboard Your Class:</strong>{" "}
          Share your Class Join Code (e.g. <code className="font-mono font-bold text-indigo-800">SGX4E1</code>) or paste student emails in the <em>Google Workspace &amp; Sheets</em> tab.
        </div>
        <div>
          <strong className="text-indigo-950">Step 2 · Run Weekly Lessons:</strong>{" "}
          Students invest S$10,000 across 20 Singapore companies and submit a short weekly reflection right from their Portfolio page.
        </div>
        <div>
          <strong className="text-indigo-950">Step 3 · Grade &amp; Debrief:</strong>{" "}
          Click <em>Export Gradebook for Google Sheets</em> above to download every student&apos;s Net Value, Diversification %, Smart Score, and Reflection count.
        </div>
      </section>

      {statusBanner && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {statusBanner}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? "bg-sgx-blue text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLASSROOM ROSTER & WEEKLY REFLECTIONS */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Student Portfolio Roster ({students.length})
                </h2>
                <select
                  aria-label="Filter by class group"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sgx-blue"
                >
                  <option value="ALL">All Class Groups</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Code: {c.joinCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await setClassTradingLockAction(selectedClassId, true);
                      notify("Locked trading for selected class.");
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Pause Class Trading
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await setClassTradingLockAction(selectedClassId, false);
                      notify("Unlocked trading for selected class.");
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Resume Class Trading
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Google Account</th>
                    <th className="px-3 py-3 text-right">Net Value</th>
                    <th className="px-3 py-3 text-right">Cash</th>
                    <th className="px-3 py-3 text-right">Smart Score</th>
                    <th className="px-3 py-3 text-right">Fees Paid</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const base = s.startingCapital || 10000;
                    const smart = calculateSmartInvestorScore(
                      s.netValue,
                      base,
                      s.hhi ?? 1,
                    );
                    const up = s.netValue >= base;
                    return (
                      <tr key={s.uid} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-bold text-slate-900">
                          {s.nickname}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500">
                          {s.email}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-mono font-bold tabular-nums ${
                            up ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          S${formatSgd(s.netValue)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-700 tabular-nums">
                          S${formatSgd(s.cashBalance)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-sgx-blue tabular-nums">
                          {smart >= 0 ? `+${smart.toFixed(2)}` : smart.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600 tabular-nums">
                          S${formatSgd(s.totalFeesPaid)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {s.tradingLocked ? (
                            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Locked
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                await resetSingleStudentAction(s.uid);
                                notify(`Reset ${s.nickname} to S$10,000.00.`);
                                router.refresh();
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset S$10k
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Submitted Student Weekly Reflections */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900 mb-3">
              Submitted Student Weekly Reflections ({reflections.length})
            </h2>
            {reflections.length === 0 ? (
              <p className="text-xs text-slate-500">
                No student reflections submitted yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {reflections.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {r.userNickname}{" "}
                        <span className="font-mono font-normal text-slate-500">
                          ({r.userEmail})
                        </span>
                      </span>
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sgx-blue">
                        Week {r.weekNumber}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 bg-white rounded-xl border border-slate-200/80 p-3">
                      {r.responseText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: GOOGLE WORKSPACE & GOOGLE SHEETS PROVISIONING */}
      {activeTab === "google_workspace" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Class Groups & Join Codes */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Class Groups & Google Join Codes
            </h2>
            <p className="text-xs text-slate-500">
              Students signing in with Gmail enter these Join Codes during
              onboarding to link to your class.
            </p>

            <div className="space-y-2">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Semester: {c.semester}
                    </p>
                  </div>
                  <span className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-xs font-extrabold text-sgx-blue">
                    {c.joinCode}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await createClassGroupAction({
                    name: newClassName,
                    joinCode: newClassCode,
                    semester: newClassSemester,
                  });
                  if (res.success && res.data) {
                    setNewClassName("");
                    setNewClassCode("");
                    notify(
                      `Created class "${res.data.name}" with Join Code ${res.data.joinCode}.`,
                    );
                    router.refresh();
                  }
                });
              }}
              className="border-t border-slate-100 pt-4 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Create New Class Group
              </p>
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class Name (e.g. Sec 4 Express 4E2)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-sgx-blue"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                  placeholder="Join Code (e.g. SGX4E2)"
                  className="rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs uppercase outline-none focus:border-sgx-blue"
                />
                <input
                  type="text"
                  value={newClassSemester}
                  onChange={(e) => setNewClassSemester(e.target.value)}
                  placeholder="2026-S2"
                  className="rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-sgx-blue"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sgx-blue py-2.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Class Group
              </button>
            </form>
          </section>

          {/* Google Sheets Roster Sync & Role Controls */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Google Sheets / CSV Student Roster Sync
              </h2>
              <p className="text-xs text-slate-500">
                Copy & paste rows directly from Google Sheets (Format:{" "}
                <code className="font-mono text-slate-800">
                  email@gmail.com, Full Name, ClassJoinCode
                </code>
                ). Accounts are pre-provisioned with S$10,000.00 and linked to
                their Gmail login.
              </p>
            </div>

            <form onSubmit={handleImportRoster} className="space-y-3">
              <textarea
                rows={5}
                value={sheetsText}
                onChange={(e) => setSheetsText(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs text-slate-900 outline-none focus:border-sgx-blue focus:bg-white"
              />
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                Sync Google Workspace Roster
              </button>
            </form>

            {/* User Role Management (Superadmin) */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Google Account Role Assignment
              </h3>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                {users.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{u.nickname}</p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {u.email}
                      </p>
                    </div>
                    <select
                      aria-label={`Role for ${u.email}`}
                      value={u.role}
                      disabled={
                        currentUser.role !== "superadmin" ||
                        u.uid === currentUser.uid
                      }
                      onChange={(e) =>
                        startTransition(async () => {
                          await updateUserRoleAction(
                            u.uid,
                            e.target.value as UserRole,
                          );
                          notify(`Updated role for ${u.email}.`);
                          router.refresh();
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 disabled:opacity-50"
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: SGX MARKET & EXCHANGE CONTROLS */}
      {activeTab === "controls" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold text-slate-900">
            SGX Simulation Rules & Classroom Controls
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Board Lot Rule */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  SGX Board Lot Size Rule
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Standard SGX requires 100-share board lots. Enable Odd Lots to
                  allow beginners to trade 1 share at a time.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggleSetting(
                    { allowOddLots: !settings.allowOddLots },
                    "SGX Board Lot Rule",
                  )
                }
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  settings.allowOddLots
                    ? "bg-amber-600 text-white"
                    : "bg-sgx-blue text-white"
                }`}
              >
                {settings.allowOddLots
                  ? "Odd Lots Enabled (1 sh)"
                  : "Strict 100-Share Lots"}
              </button>
            </div>

            {/* Fee Structure Mode */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  SGX Transaction Fee Structure
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Choose between authentic SGX Brokerage + CDP Clearing + 9% GST
                  or a simplified S$10.00 flat fee.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggleSetting(
                    {
                      feeMode:
                        settings.feeMode === "sgx_realistic"
                          ? "flat_10"
                          : "sgx_realistic",
                    },
                    "Fee Structure Mode",
                  )
                }
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                {settings.feeMode === "sgx_realistic"
                  ? "Authentic SGX + CDP + GST"
                  : "Simplified S$10 Flat Fee"}
              </button>
            </div>

            {/* Exchange Hours Mode */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  SGX Trading Hours Enforcement
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  24/7 Classroom Practice allows homework trading after 17:00
                  SGT. Strict Mode restricts trades to live SGX hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggleSetting(
                    { strictExchangeHours: !settings.strictExchangeHours },
                    "Trading Hours Mode",
                  )
                }
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white ${
                  settings.strictExchangeHours
                    ? "bg-rose-600"
                    : "bg-emerald-600"
                }`}
              >
                {settings.strictExchangeHours
                  ? "Strict SGX Hours Only"
                  : "24/7 Classroom Practice"}
              </button>
            </div>

            {/* Leaderboard Privacy Mode */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Leaderboard Display Mode
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Toggle whether student nicknames are visible or masked as
                  &quot;SGX Trader #N&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggleSetting(
                    {
                      leaderboardMode:
                        settings.leaderboardMode === "named"
                          ? "anonymous"
                          : "named",
                    },
                    "Leaderboard Privacy Mode",
                  )
                }
                className="shrink-0 rounded-xl bg-sgx-blue px-4 py-2 text-xs font-bold text-white"
              >
                {settings.leaderboardMode === "named"
                  ? "Named Leaderboard"
                  : "Anonymous Leaderboard"}
              </button>
            </div>
          </div>

          {/* SGX Cash Dividend Payout Simulator */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-900">
                SGX Quarterly Cash Dividend Distribution (Tier-1 Tax-Exempt)
              </p>
              <p className="text-xs text-emerald-800">
                Credits quarterly SGD cash dividends directly to all student
                accounts holding dividend-paying SGX shares based on each
                counter&apos;s annual dividend yield.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await distributeClassDividendsAction(
                    selectedClassId,
                  );
                  if (res.success && res.data) {
                    notify(
                      `Distributed S$${formatSgd(res.data.totalDividendSgd)} in tax-exempt SGX cash dividends across ${res.data.studentsCredited} student portfolios.`,
                    );
                    router.refresh();
                  }
                })
              }
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
            >
              Distribute Quarterly Dividends
            </button>
          </div>

          {/* Semester Reset Danger Zone */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-rose-800">
                New Semester Reset (All Students)
              </p>
              <p className="text-xs text-rose-700">
                Resets every student account back to S$10,000.00 cash and clears
                holdings & trade history.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await resetAllStudentsAction();
                  if (res.success) {
                    notify(
                      `Reset all ${res.data?.count ?? 0} students to S$10,000.00.`,
                    );
                    router.refresh();
                  }
                })
              }
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              Reset All Students to S$10,000
            </button>
          </div>
        </section>
      )}

      {/* TAB 4: WEEKLY CHALLENGES */}
      {activeTab === "challenges" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Publish Weekly Challenge
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await createWeeklyChallengeAction({
                    classGroupId: challClassId,
                    title: challTitle,
                    description: challDesc,
                    weekStart: challStart,
                    weekEnd: challEnd,
                  });
                  if (res.success) {
                    setChallTitle("");
                    setChallDesc("");
                    notify("Published new Weekly Challenge.");
                    router.refresh();
                  }
                });
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700">
                  Target Class Group
                </label>
                <select
                  value={challClassId}
                  onChange={(e) => setChallClassId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">
                  Challenge Title
                </label>
                <input
                  type="text"
                  required
                  value={challTitle}
                  onChange={(e) => setChallTitle(e.target.value)}
                  placeholder="e.g. Dividend Yield vs Growth Week"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">
                  Instructions & Learning Goal
                </label>
                <textarea
                  rows={3}
                  required
                  value={challDesc}
                  onChange={(e) => setChallDesc(e.target.value)}
                  placeholder="Describe what students should research and execute…"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={challStart}
                    onChange={(e) => setChallStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={challEnd}
                    onChange={(e) => setChallEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-sgx-blue py-2.5 font-bold text-white hover:bg-blue-700"
              >
                Publish Challenge
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Active & Past Challenges ({challenges.length})
            </h2>
            {challenges.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{c.title}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {c.weekStart} → {c.weekEnd}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{c.description}</p>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* TAB 5: SCHOOL-WIDE CONTRACT NOTE AUDIT TRAIL */}
      {activeTab === "audit" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-4">
            School-Wide SGX Contract Note Audit Log ({trades.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Contract Note</th>
                  <th className="px-3 py-2.5">Timestamp (SGT)</th>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Counter</th>
                  <th className="px-3 py-2.5">Side</th>
                  <th className="px-3 py-2.5 text-right">Shares</th>
                  <th className="px-3 py-2.5 text-right">Price</th>
                  <th className="px-3 py-2.5 text-right">Fees</th>
                  <th className="px-3 py-2.5 text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                      {t.contractNoteNo}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {new Date(t.timestamp).toLocaleString("en-SG", {
                        timeZone: "Asia/Singapore",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {t.userNickname}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                      {t.ticker}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          t.action === "buy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {t.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {t.shares.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      S${formatSgxPrice(t.executionPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-700">
                      S${formatSgd(t.totalFee)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                      S${formatSgd(t.netTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 6: GOOGLE CLOUD SYSTEM HEALTH & SCHEDULER TRIGGERS */}
      {activeTab === "cloud_health" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Google Cloud Infrastructure & Scheduler Telemetry
              </h2>
              <p className="text-xs text-slate-500">
                100% Google Cloud Stack: Firebase App Hosting (Cloud Run), Cloud
                Firestore, Firebase Auth (Google OAuth), and Gemini 2.5 Flash.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <Activity className="h-3.5 w-3.5" />
              All Google Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-slate-500">Database & Realtime Engine</span>
              <p className="mt-1 font-display text-base font-bold text-slate-900">
                Google Cloud Firestore
              </p>
              <p className="mt-1 font-mono text-[11px] text-emerald-700">
                Single-Doc Snapshot Fanout Active
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-slate-500">Identity Provider</span>
              <p className="mt-1 font-display text-base font-bold text-slate-900">
                Google Identity / Gmail OAuth2
              </p>
              <p className="mt-1 font-mono text-[11px] text-sgx-blue">
                HTTP-Only __session Cookie SSR
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-slate-500">Last SGX Price Broadcast</span>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                {new Date(marketUpdatedAt).toLocaleString("en-SG", {
                  timeZone: "Asia/Singapore",
                })}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                20/20 SGX Mainboard Counters
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await adminTriggerMarketSyncAction();
                  if (res.success && res.data) {
                    notify(
                      `Synced all 20 SGX prices (${res.data.liveCount} live Yahoo quotes, ${res.data.fallbackCount} simulated ticks).`,
                    );
                    router.refresh();
                  }
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              Trigger SGX Market Price Sync Now
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await adminTakePortfolioSnapshotsAction();
                  if (res.success && res.data) {
                    notify(
                      `Recorded daily net-worth snapshot for ${res.data.count} students.`,
                    );
                    router.refresh();
                  }
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Record Daily Portfolio Snapshots
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
