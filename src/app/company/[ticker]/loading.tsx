export default function CompanyLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 animate-pulse">
      <div className="h-9 w-48 rounded-xl bg-slate-200/70" />
      <div className="h-44 rounded-3xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[460px] rounded-3xl bg-slate-200/70 lg:col-span-7" />
        <div className="h-[460px] rounded-3xl bg-slate-200/70 lg:col-span-5" />
      </div>
    </main>
  );
}
