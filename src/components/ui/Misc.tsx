import { cn } from "@/lib/utils";
import type { BrandSlug } from "@/lib/types";
import { BRAND_COLORS, getBrand } from "@/lib/data/brands";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number; // 0–100
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-rule", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-accent to-pink transition-[width] duration-500",
          barClassName,
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({
  label,
  title,
  subtitle,
  actions,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {label && (
          <div className="mb-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-accent">
            {label}
          </div>
        )}
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Brand-colored pill (uses the scheduling-mockup category palette). */
export function BrandChip({
  slug,
  className,
  withEmoji = true,
}: {
  slug: BrandSlug;
  className?: string;
  withEmoji?: boolean;
}) {
  const brand = getBrand(slug);
  const c = BRAND_COLORS[slug];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={{ background: c.soft, color: c.ink }}
    >
      {withEmoji && <span>{brand.emoji}</span>}
      {brand.brandName}
    </span>
  );
}

export function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-rule bg-surface px-3 py-2 text-center shadow-card",
        className,
      )}
    >
      <div className="font-display text-xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
