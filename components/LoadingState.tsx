export function LoadingState({ message = "Calling Gemini…" }: { message?: string }) {
  return (
    <div className="card p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">{message}</p>
          <p className="text-xs text-fg-muted">
            Reasoning through your scenarios. Usually takes 5–15 seconds.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-9/12" />
        <div className="skeleton h-3 w-10/12" />
        <div className="skeleton h-3 w-8/12" />
      </div>
    </div>
  );
}
