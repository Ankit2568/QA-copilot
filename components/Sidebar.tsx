"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import { ModelBadge } from "@/components/ModelPicker";
import { TOOL_LIST, colorClasses } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-border bg-bg-subtle"
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 h-16 border-b border-border hover:bg-bg-elevated/40 transition-colors"
      >
        <div className="relative w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center shadow-glow">
          <span className="text-xs font-bold text-white">Q</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-fg leading-tight">
            QA Copilot
          </span>
          <span className="text-[10px] uppercase tracking-wider text-fg-faint leading-tight">
            v1.0
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <NavItem
            href="/"
            active={pathname === "/"}
            icon={<Home className="w-4 h-4" />}
            label="Dashboard"
          />
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-fg-faint font-semibold">
            Tools
          </div>
          <div className="space-y-1">
            {TOOL_LIST.map((t) => {
              const c = colorClasses(t.color);
              const active = pathname.startsWith(`/tools/${t.slug}`);
              const Icon = t.icon;
              return (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    active
                      ? "bg-bg-elevated text-fg"
                      : "text-fg-muted hover:bg-bg-elevated/60 hover:text-fg"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md grid place-items-center border transition-colors",
                      active ? cn(c.bg, c.border) : "bg-bg-elevated border-border"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", active ? c.text : "text-fg-muted")} />
                  </div>
                  <span className="font-medium">{t.shortName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <ModelBadge />
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
        active
          ? "bg-bg-elevated text-fg"
          : "text-fg-muted hover:bg-bg-elevated/60 hover:text-fg"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
