export default function ToolsLoading() {
  return (
    <main className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <div className="card p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-2/5" />
            <div className="skeleton h-3 w-4/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
        <div className="card p-5 space-y-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
        <div className="card p-12">
          <div className="skeleton h-3 w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-9/12" />
          </div>
        </div>
      </div>
    </main>
  );
}
