import { cn } from "@/lib/utils";

/** Pure-SVG circular score ring (deterministic, no animation deps). */
export function HealthRing({
  value,
  size = 56,
  stroke = 6,
  className,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;

  // Color band by score
  const color =
    clamped >= 90 ? "#059669" : clamped >= 75 ? "#7c3aed" : clamped >= 60 ? "#d97706" : "#dc2626";

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2ddd9"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display text-base font-bold leading-none"
          style={{ color }}
        >
          {clamped}
        </span>
      </div>
    </div>
  );
}
