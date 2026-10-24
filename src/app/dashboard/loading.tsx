export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 animate-pulse">
      <div className="h-12 rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-44 rounded-3xl bg-slate-200/70 lg:col-span-7" />
        <div className="h-44 rounded-3xl bg-slate-200/70 lg:col-span-5" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    </main>
  );
}
