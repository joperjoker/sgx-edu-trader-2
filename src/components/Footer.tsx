import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/efl-logo.png"
              alt="EduFinLit Logo"
              className="h-6 w-6 rounded-md object-contain border border-slate-200 p-0.5"
            />
            <span className="font-display font-extrabold text-slate-900">
              EduFinLit
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/dashboard" className="hover:text-sgx-blue transition">
              SGX Market
            </Link>
            <Link href="/copilot" className="hover:text-sgx-blue transition">
              AI Copilot
            </Link>
            <Link href="/portfolio" className="hover:text-sgx-blue transition">
              My Portfolio
            </Link>
            <Link href="/leaderboard" className="hover:text-sgx-blue transition">
              Leaderboard
            </Link>
            <Link href="/handbook" className="text-sgx-blue font-bold hover:underline">
              📖 Handbooks &amp; Videos
            </Link>
            <Link href="/launch" className="hover:text-sgx-blue transition">
              Google Launch
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] leading-relaxed text-slate-500 max-w-4xl">
            EduFinLit is a paper trading simulation for educational purposes
            only. No real securities transactions are conducted and no real money is
            involved. Not licensed by the Monetary Authority of Singapore (MAS). Not
            financial advice under the Financial Advisers Act (Cap. 110) or
            Securities and Futures Act (Cap. 289) of Singapore. Not affiliated with
            Singapore Exchange Limited (SGX Group).
          </p>
          <div className="shrink-0 font-mono text-[11px] text-slate-400">
            Powered by Google Cloud · Firestore · Gemini
          </div>
        </div>
      </div>
    </footer>
  );
}
