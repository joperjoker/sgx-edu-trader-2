"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          {error.message || "An unexpected error occurred while rendering this view."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry View
        </button>
      </div>
    </main>
  );
}
