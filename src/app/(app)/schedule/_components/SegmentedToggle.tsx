"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-rule bg-surface-2 p-0.5 shadow-card",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-secondary",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
