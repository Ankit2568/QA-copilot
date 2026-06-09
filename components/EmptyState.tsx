import { ArrowLeft, type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border grid place-items-center mb-4">
        <Icon className="w-6 h-6 text-fg-muted" />
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      <p className="text-sm text-fg-muted max-w-md mb-4">{description}</p>
      <p className="flex items-center gap-1.5 text-xs text-fg-faint">
        <ArrowLeft className="w-3 h-3" />
        Fill in the form on the left and hit Run
      </p>
    </div>
  );
}
