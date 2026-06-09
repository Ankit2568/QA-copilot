export default function RootLoading() {
  return (
    <main className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">Loading…</p>
            <p className="text-xs text-fg-muted">Preparing the dashboard.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-11/12" />
          <div className="skeleton h-3 w-9/12" />
        </div>
      </div>
    </main>
  );
}
