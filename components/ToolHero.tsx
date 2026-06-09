import { type ToolMeta, colorClasses } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolHero({ tool }: { tool: ToolMeta }) {
  const c = colorClasses(tool.color);
  const Icon = tool.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border p-6 lg:p-8",
        "bg-gradient-to-br",
        c.gradient,
        "bg-bg-surface"
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-xl grid place-items-center border",
            c.bg,
            c.border,
            c.glow
          )}
        >
          <Icon className={cn("w-6 h-6", c.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-semibold text-fg tracking-tight">
            {tool.name}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted max-w-2xl">
            {tool.longDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
