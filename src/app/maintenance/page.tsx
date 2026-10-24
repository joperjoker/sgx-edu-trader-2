import Link from "next/link";
import { Wrench, ShieldAlert, ArrowLeft } from "lucide-react";
import { getAppSettings } from "@/lib/firebase/store";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getAppSettings();

  return (
    <main className="min-h-screen bg-sgx-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
          <Wrench className="h-7 w-7 animate-spin" style={{ animationDuration: "6s" }} />
        </div>
        <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-widest text-sgx-blue">
          {settings.schoolName}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          Scheduled Exchange Maintenance
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {settings.maintenanceMessage}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Contact your teacher if this persists.</span>
        </div>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
