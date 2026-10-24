import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sgx-blue">
          <SearchX className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
          SGX Counter Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The page or SGX stock ticker you requested could not be found on the
          exchange board.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to SGX Market Board
        </Link>
      </div>
    </main>
  );
}
