export default function LeaderboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 animate-pulse">
      <div className="h-28 rounded-3xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-52 rounded-3xl bg-slate-200/70" />
        <div className="h-52 rounded-3xl bg-slate-200/70" />
        <div className="h-52 rounded-3xl bg-slate-200/70" />
      </div>
      <div className="h-64 rounded-3xl bg-slate-200/70" />
    </main>
  );
}
