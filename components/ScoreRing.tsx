import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 120,
  stroke = 10,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const tone =
    score >= 80 ? "emerald" : score >= 60 ? "yellow" : score >= 40 ? "orange" : "red";

  const colorMap = {
    emerald: { stroke: "#10b981", text: "text-emerald-400", glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" },
    yellow: { stroke: "#eab308", text: "text-yellow-400", glow: "drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" },
    orange: { stroke: "#f97316", text: "text-orange-400", glow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" },
    red: { stroke: "#ef4444", text: "text-red-400", glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" },
  } as const;

  const c = colorMap[tone];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={cn(c.glow)}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1f1f24"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.stroke}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", c.text)}>{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-fg-faint">Coverage</span>
      </div>
    </div>
  );
}
