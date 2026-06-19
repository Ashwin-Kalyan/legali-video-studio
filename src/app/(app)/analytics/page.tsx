"use client";

import { useState } from "react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChevronDown,
  IconSparkles,
  IconArrowRight,
  IconEye,
  IconBolt,
  IconExternalLink,
  IconUsers,
  IconLink,
  IconCircleCheck,
  IconCheck,
} from "@tabler/icons-react";
import { cn, formatCompact } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/Card";
import { PageHeader, BrandChip } from "@/components/ui/Misc";
import { Tag } from "@/components/ui/Tag";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import {
  OVERVIEW_KPIS,
  KPI_SERIES_30D,
  BRAND_HEALTH,
  CONTENT_TYPE_STATS,
  PLATFORM_SPLIT,
  WAITLIST_FUNNEL,
  AI_INSIGHT,
  ANALYTICS_SNAPSHOTS,
  BRAND_BY_SLUG,
} from "@/lib/data";
import type { BrandSlug } from "@/lib/types";
import { TrendChart } from "./_components/TrendChart";
import { PlatformDonut } from "./_components/PlatformDonut";
import { HealthRing } from "./_components/HealthRing";

// ---------------------------------------------------------------------------
const RANGES = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

const BRAND_FILTERS: { id: BrandSlug | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "All brands", emoji: "✦" },
  { id: "lea", label: "Lea by Legali", emoji: "🐰" },
  { id: "my", label: "MyLegali", emoji: "⚖️" },
  { id: "team", label: "TeamLegali", emoji: "💼" },
  { id: "learn", label: "LegaliLearn", emoji: "📚" },
];

const TYPE_TONE: Record<string, "feature" | "info" | "success" | "warn" | "neutral"> = {
  reel: "feature",
  tiktok: "neutral",
  carousel: "info",
  static: "warn",
  story: "success",
  short: "neutral",
};

// ---------------------------------------------------------------------------
export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeId>("30d");
  const [brand, setBrand] = useState<BrandSlug | "all">("all");
  const [brandOpen, setBrandOpen] = useState(false);

  const activeBrand = BRAND_FILTERS.find((b) => b.id === brand)!;

  const topPosts = [...ANALYTICS_SNAPSHOTS]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Module 1 — Analytics"
        title="Performance Overview"
        subtitle="Cross-platform reach, engagement & waitlist attribution across all four Legali brands."
        actions={
          <div className="flex items-center gap-2">
            {/* Time-range segmented control */}
            <div className="flex items-center rounded-lg border border-rule bg-surface p-0.5 shadow-card">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors",
                    range === r.id
                      ? "bg-ink text-paper shadow-sm"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Brand filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setBrandOpen((o) => !o)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm font-medium shadow-card transition-colors",
                  brandOpen || brand !== "all"
                    ? "border-accent/40 text-ink"
                    : "border-rule text-secondary hover:border-accent/40",
                )}
              >
                <span>{activeBrand.emoji}</span>
                <span>{activeBrand.label}</span>
                <IconChevronDown
                  size={15}
                  stroke={1.75}
                  className={cn(
                    "text-muted transition-transform",
                    brandOpen && "rotate-180",
                  )}
                />
              </button>
              {brandOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setBrandOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 animate-fade-up overflow-hidden rounded-xl border border-rule bg-surface p-1 shadow-card-lg">
                    {BRAND_FILTERS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBrand(b.id);
                          setBrandOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                          brand === b.id
                            ? "bg-accent-soft text-accent-ink"
                            : "text-secondary hover:bg-surface-2",
                        )}
                      >
                        <span className="text-base">{b.emoji}</span>
                        <span className="flex-1 font-medium">{b.label}</span>
                        {brand === b.id && (
                          <IconCheck size={15} stroke={2} className="text-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* ===== KPI ROW ===== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OVERVIEW_KPIS.map((kpi) => (
          <Card key={kpi.label} accent={kpi.positive ? "purple" : "amber"}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                  {kpi.label}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[0.64rem] font-semibold",
                    kpi.positive
                      ? "bg-success-soft text-success-ink"
                      : "bg-warn-soft text-[#b91c1c]",
                  )}
                >
                  {kpi.positive ? (
                    <IconTrendingUp size={12} stroke={2} />
                  ) : (
                    <IconTrendingDown size={12} stroke={2} />
                  )}
                  {kpi.delta.replace(/^[↑↓]\s*/, "")}
                </span>
              </div>
              <div className="mt-3 font-display text-[2.1rem] font-bold leading-none tracking-tight text-ink">
                {kpi.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ===== TREND CHART + PLATFORM SPLIT ===== */}
      <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <div>
              <SectionLabel className="mb-1">Reach Trend</SectionLabel>
              <h3 className="font-display text-lg font-bold text-ink">
                Views & engagement over time
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-muted">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-accent to-pink" />
                Views
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[0.68rem] text-muted">
                <span className="h-0 w-3.5 border-t-2 border-dashed border-pink" />
                Engagements
              </span>
            </div>
          </div>
          <div className="px-3 py-4">
            <TrendChart data={KPI_SERIES_30D} />
          </div>
        </Card>

        <Card>
          <div className="border-b border-rule px-5 py-4">
            <SectionLabel className="mb-1">Distribution</SectionLabel>
            <h3 className="font-display text-lg font-bold text-ink">
              Platform split
            </h3>
          </div>
          <div className="px-5 py-5">
            <PlatformDonut data={PLATFORM_SPLIT} />
          </div>
        </Card>
      </div>

      {/* ===== AI INSIGHT — HERO ===== */}
      <div className="mt-8">
        <SectionLabel>AI Insight Feed · Claude-powered</SectionLabel>
        <AiInsightPanel />
      </div>

      {/* ===== BRAND HEALTH ===== */}
      <div className="mt-9">
        <SectionLabel>Brand Health Scorecards</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND_HEALTH.map((b) => {
            const dimmed = brand !== "all" && brand !== b.slug;
            const up = b.trend >= 0;
            return (
              <Card
                key={b.slug}
                className={cn(
                  "transition-all duration-300 hover:shadow-card-lg",
                  dimmed && "opacity-45",
                )}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <BrandChip slug={b.slug} />
                    <HealthRing value={b.health} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3">
                    <Metric
                      label="Views"
                      value={formatCompact(b.views)}
                    />
                    <Metric
                      label="Eng. rate"
                      value={`${b.engagementRate}%`}
                    />
                    <div>
                      <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                        Trend
                      </div>
                      <div
                        className={cn(
                          "mt-1 inline-flex items-center gap-0.5 font-display text-lg font-bold leading-none",
                          up ? "text-success" : "text-[#b91c1c]",
                        )}
                      >
                        {up ? (
                          <IconTrendingUp size={15} stroke={2.25} />
                        ) : (
                          <IconTrendingDown size={15} stroke={2.25} />
                        )}
                        {up ? "+" : ""}
                        {b.trend}%
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                        Brand kit
                      </div>
                      <div className="mt-1 font-display text-lg font-bold leading-none text-ink">
                        {b.consistency}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rule">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        b.consistency >= 90
                          ? "bg-success"
                          : b.consistency >= 80
                            ? "bg-accent"
                            : "bg-warn",
                      )}
                      style={{ width: `${b.consistency}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ===== CONTENT-TYPE ATTRIBUTION + WAITLIST FUNNEL ===== */}
      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* Attribution table */}
        <div>
          <SectionLabel>Content-Type Attribution</SectionLabel>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink text-paper">
                    <th className="px-4 py-3 text-left font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Type
                    </th>
                    <th className="px-3 py-3 text-right font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Avg Views
                    </th>
                    <th className="px-3 py-3 text-right font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Saves
                    </th>
                    <th className="px-3 py-3 text-right font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Shares
                    </th>
                    <th className="px-3 py-3 text-right font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Profile Visits
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em]">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_TYPE_STATS.map((row, i) => (
                    <tr
                      key={row.type}
                      className={cn(
                        "border-t border-rule transition-colors hover:bg-accent-soft/40",
                        i % 2 === 1 && "bg-surface-2",
                      )}
                    >
                      <td className="px-4 py-3">
                        <Tag tone={TYPE_TONE[row.type] ?? "neutral"}>
                          {row.label}
                        </Tag>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                        {formatCompact(row.avgViews)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-secondary">
                        {formatCompact(row.avgSaves)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-secondary">
                        {formatCompact(row.avgShares)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-secondary">
                        {formatCompact(row.avgProfileVisits)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-secondary">
                        {row.bestFor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Waitlist funnel */}
        <div>
          <SectionLabel>Waitlist Funnel · Lea</SectionLabel>
          <Card accent="pink">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted">
                <span className="text-base">🐰</span>
                <span>
                  Last-touch attribution from bio link UTM tracking
                </span>
              </div>
              <div className="space-y-2.5">
                {WAITLIST_FUNNEL.map((step, i) => {
                  const width = [100, 62, 38, 18][i];
                  const Icon = [IconEye, IconUsers, IconLink, IconCircleCheck][i];
                  return (
                    <div key={step.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                          <Icon size={13} stroke={1.75} className="text-pink" />
                          {step.label}
                        </span>
                        <span className="font-mono text-[0.66rem] text-muted">
                          {i === 0 ? "of views" : `${step.rate} step`}
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-white shadow-sm transition-all"
                        style={{
                          width: `${width}%`,
                          minWidth: "120px",
                          background: `linear-gradient(90deg, #db2777, #9d174d)`,
                          opacity: 1 - i * 0.12,
                        }}
                      >
                        <span className="font-display text-base font-bold leading-none">
                          {formatCompact(step.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-pink/20 bg-pink-soft px-3 py-2.5">
                <span className="font-mono text-[0.66rem] uppercase tracking-wide text-pink-ink">
                  Overall conversion
                </span>
                <span className="font-display text-base font-bold text-pink-ink">
                  0.11%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ===== TOP-PERFORMING POSTS ===== */}
      <div className="mt-9 mb-2">
        <SectionLabel>Top-Performing Posts</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topPosts.map((post, i) => {
            const brandMeta = BRAND_BY_SLUG[post.brandSlug];
            return (
              <Card
                key={post.id}
                className="group cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg"
              >
                <div
                  className="relative h-28 overflow-hidden"
                  style={{
                    background: `linear-gradient(160deg, hsl(${post.thumbnailHue} 70% 30%), hsl(${post.thumbnailHue} 80% 12%))`,
                  }}
                >
                  <div className="absolute inset-0 bg-noise opacity-40" />
                  {i === 0 && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-white backdrop-blur">
                      <IconBolt size={11} stroke={2} /> TOP POST
                    </span>
                  )}
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/30 text-white backdrop-blur">
                    <PlatformIcon platform={post.platform} size={13} />
                  </span>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-base drop-shadow">{brandMeta.emoji}</span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wide text-white/80">
                      {brandMeta.brandName}
                    </span>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 font-mono text-[0.62rem] font-semibold text-white backdrop-blur">
                    <IconEye size={12} stroke={2} />
                    {formatCompact(post.views)}
                  </span>
                </div>
                <div className="p-3.5">
                  <h4 className="line-clamp-1 text-sm font-semibold text-ink">
                    {post.postTitle}
                  </h4>
                  <div className="mt-2.5 flex items-center justify-between">
                    <Tag tone={TYPE_TONE[post.contentType] ?? "neutral"}>
                      {post.contentType}
                    </Tag>
                    <span className="flex items-center gap-2.5 font-mono text-[0.66rem] text-muted">
                      <span className="flex items-center gap-0.5">
                        <IconBolt size={12} stroke={1.75} className="text-accent" />
                        {post.watchThroughPct}%
                      </span>
                      <IconExternalLink
                        size={13}
                        stroke={1.75}
                        className="text-muted transition-colors group-hover:text-accent"
                      />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold leading-none text-ink">
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function AiInsightPanel() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#3a2061] shadow-card-lg"
      style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #2d1458 100%)" }}
    >
      {/* texture + glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.18]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7c3aed]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#db2777]/20 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-6 p-6 md:p-7 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — summary + pattern */}
        <div>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[#d8b4fe]">
              <IconSparkles size={13} stroke={1.75} />
              AI Insight · This week
            </div>
            <span className="font-mono text-[0.62rem] text-white/35">
              Generated Jun 15
            </span>
          </div>

          <p className="mt-4 font-display text-xl font-medium leading-snug text-white">
            {AI_INSIGHT.summary}
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#f9a8d4]">
              Pattern detected
            </div>
            <p className="text-sm leading-relaxed text-white/80">
              {AI_INSIGHT.pattern}
            </p>
          </div>

          {/* Recommended action — CTA */}
          <div className="mt-4 rounded-xl border border-[#7c3aed]/40 bg-gradient-to-r from-[#7c3aed]/25 to-[#db2777]/25 p-4">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#c4b5fd]">
              <IconBolt size={13} stroke={1.75} />
              Recommended action
            </div>
            <p className="text-sm font-medium leading-relaxed text-white">
              {AI_INSIGHT.action}
            </p>
            <button className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#1e0a3c] transition-transform hover:scale-[1.02]">
              Draft these reels
              <IconArrowRight size={15} stroke={2} />
            </button>
          </div>
        </div>

        {/* RIGHT — observations + watch metric */}
        <div className="flex flex-col">
          <div className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
            What worked this week
          </div>
          <ol className="space-y-3">
            {AI_INSIGHT.observations.map((obs, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#db2777] font-mono text-[0.66rem] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-[0.82rem] leading-relaxed text-white/85">
                  {obs}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3.5">
            <IconEye size={16} stroke={1.75} className="mt-0.5 shrink-0 text-amber-300" />
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-amber-300/90">
                Watch this metric
              </div>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-white/80">
                {AI_INSIGHT.watchMetric}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
