"use client";

import { useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
} from "@tabler/icons-react";
import { cn, formatCompact } from "@/lib/utils";
import { KPI_SERIES_30D, OVERVIEW_KPIS } from "@/lib/data";
import type { KpiPoint } from "@/lib/types";

// Per-metric config: which series key, color, formatting, and how to aggregate.
type MetricKey = Extract<keyof KpiPoint, "views" | "engagements" | "waitlist" | "watchThru">;

interface MetricConfig {
  key: MetricKey;
  color: string;
  agg: "sum" | "avg";
  aggLabel: string;
  unit: "compact" | "plain" | "percent";
  blurb: string;
}

const METRICS: Record<string, MetricConfig> = {
  "Total Views": {
    key: "views",
    color: "#7c3aed",
    agg: "sum",
    aggLabel: "Total (30d)",
    unit: "compact",
    blurb: "Cross-platform video views across all four Legali brands.",
  },
  Engagements: {
    key: "engagements",
    color: "#db2777",
    agg: "sum",
    aggLabel: "Total (30d)",
    unit: "compact",
    blurb: "Likes, comments, shares and saves combined across platforms.",
  },
  "Avg Watch-thru": {
    key: "watchThru",
    color: "#0891b2",
    agg: "avg",
    aggLabel: "30-day average",
    unit: "percent",
    blurb: "Average share of each video watched, weighted by views.",
  },
  "Waitlist Clicks": {
    key: "waitlist",
    color: "#059669",
    agg: "sum",
    aggLabel: "Total (30d)",
    unit: "plain",
    blurb: "Bio-link clicks attributed to video content (UTM tracked).",
  },
};

function fmt(v: number, unit: MetricConfig["unit"]): string {
  if (unit === "percent") return `${v.toFixed(1)}%`;
  if (unit === "plain") return v.toLocaleString("en-US");
  return formatCompact(v);
}

export function KpiDetailModal({
  metricLabel,
  onClose,
}: {
  metricLabel: string;
  onClose: () => void;
}) {
  // Esc to close + lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const cfg = METRICS[metricLabel];
  const headline = OVERVIEW_KPIS.find((k) => k.label === metricLabel);
  if (!cfg || !headline) return null;

  const series = KPI_SERIES_30D.map((p) => ({
    label: p.label,
    value: p[cfg.key] as number,
  }));
  const values = series.map((s) => s.value);
  const peak = Math.max(...values);
  const low = Math.min(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const aggValue = cfg.agg === "sum" ? sum : avg;
  const peakDay = series.find((s) => s.value === peak)?.label ?? "—";
  const lowDay = series.find((s) => s.value === low)?.label ?? "—";

  const stats = [
    { label: cfg.aggLabel, value: fmt(aggValue, cfg.unit) },
    { label: `Peak · ${peakDay}`, value: fmt(peak, cfg.unit) },
    { label: `Lowest · ${lowDay}`, value: fmt(low, cfg.unit) },
  ];

  const gradId = `kpiGrad-${cfg.key}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${metricLabel} over time`}
    >
      <div
        className="w-full max-w-2xl animate-fade-up overflow-hidden rounded-2xl border border-rule bg-surface shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-rule px-6 py-5">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted">
              <IconChartBar size={13} stroke={1.75} style={{ color: cfg.color }} />
              Metric · 30-day trend
            </div>
            <h3 className="font-display text-2xl font-bold leading-none text-ink">
              {metricLabel}
            </h3>
            <p className="mt-2 max-w-md text-xs text-muted">{cfg.blurb}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        {/* headline value + delta */}
        <div className="flex items-end gap-3 px-6 pt-5">
          <span className="font-display text-[2.4rem] font-bold leading-none text-ink">
            {headline.value}
          </span>
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[0.66rem] font-semibold",
              headline.positive
                ? "bg-success-soft text-success-ink"
                : "bg-warn-soft text-[#b91c1c]",
            )}
          >
            {headline.positive ? (
              <IconTrendingUp size={12} stroke={2} />
            ) : (
              <IconTrendingDown size={12} stroke={2} />
            )}
            {headline.delta.replace(/^[↑↓]\s*/, "")}
          </span>
          <span className="mb-1 font-mono text-[0.66rem] text-muted">
            vs previous 30 days
          </span>
        </div>

        {/* chart */}
        <div className="h-[260px] w-full px-3 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 30, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd9" vertical={false} />
              <XAxis
                dataKey="label"
                interval={0}
                padding={{ left: 6, right: 14 }}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={{ stroke: "#e2ddd9" }}
              />
              <YAxis
                width={44}
                tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  cfg.unit === "percent" ? `${v}%` : formatCompact(v)
                }
              />
              <Tooltip
                cursor={{ stroke: cfg.color, strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border border-[#2d2040] bg-ink px-3 py-2 shadow-card-lg">
                      <div className="font-mono text-[0.62rem] uppercase tracking-wide text-white/45">
                        {label}
                      </div>
                      <div className="mt-0.5 font-display text-base font-bold text-white">
                        {fmt(payload[0].value as number, cfg.unit)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                dot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: cfg.color, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-3 gap-px border-t border-rule bg-rule">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-5 py-3.5">
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                {s.label}
              </div>
              <div className="mt-1 font-display text-lg font-bold leading-none text-ink">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
