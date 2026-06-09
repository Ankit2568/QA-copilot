import { AlertTriangle, AlertOctagon, Info, Minus } from "lucide-react";
import type { Severity } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STYLES: Record<
  Severity,
  { cls: string; icon: typeof Info; label: string }
> = {
  critical: {
    cls: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: AlertOctagon,
    label: "Critical",
  },
  high: {
    cls: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon: Info,
    label: "Medium",
  },
  low: {
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: Minus,
    label: "Low",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = STYLES[severity];
  const Icon = s.icon;
  return (
    <span className={cn("chip", s.cls)}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}
