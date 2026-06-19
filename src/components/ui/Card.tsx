import { cn } from "@/lib/utils";

type Accent = "purple" | "pink" | "blue" | "green" | "amber" | "none";

const ACCENT_BAR: Record<Accent, string> = {
  purple: "before:bg-accent",
  pink: "before:bg-pink",
  blue: "before:bg-cyan",
  green: "before:bg-success",
  amber: "before:bg-warn",
  none: "before:hidden",
};

export function Card({
  accent = "none",
  className,
  children,
}: {
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-rule bg-surface shadow-card",
        "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-['']",
        ACCENT_BAR[accent],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent",
        className,
      )}
    >
      <span>{children}</span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}
