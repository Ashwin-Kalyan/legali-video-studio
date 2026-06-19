import { cn } from "@/lib/utils";

type TagTone =
  | "p0"
  | "p1"
  | "p2"
  | "feature"
  | "infra"
  | "ux"
  | "new"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "neutral";

const TONES: Record<TagTone, string> = {
  p0: "bg-danger-soft text-danger border border-red-200",
  p1: "bg-warn-soft text-[#c2410c] border border-orange-200",
  p2: "bg-yellow-50 text-[#a16207] border border-yellow-200",
  feature: "bg-accent-soft text-accent-ink border border-violet-200",
  infra: "bg-success-soft text-success-ink border border-emerald-200",
  ux: "bg-cyan-soft text-cyan-ink border border-cyan-200",
  new: "bg-fuchsia-50 text-[#7e22ce] border border-fuchsia-200",
  success: "bg-success-soft text-success-ink border border-emerald-200",
  warn: "bg-warn-soft text-[#92400e] border border-amber-200",
  danger: "bg-danger-soft text-danger-ink border border-red-200",
  info: "bg-cyan-soft text-cyan-ink border border-cyan-200",
  neutral: "bg-surface-2 text-muted border border-rule",
};

export function Tag({
  tone = "neutral",
  children,
  className,
}: {
  tone?: TagTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[0.7rem] font-medium leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
