export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-4">
      <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="text-[11px] leading-relaxed text-slate-500 max-w-4xl">
          SGX Edu-Trader is a paper trading simulation for educational purposes
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
    </footer>
  );
}
