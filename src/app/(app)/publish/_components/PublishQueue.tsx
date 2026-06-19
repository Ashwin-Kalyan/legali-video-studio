"use client";

import { useState } from "react";
import {
  IconCheck,
  IconClock,
  IconSend,
  IconBolt,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconAlertTriangle,
  IconInfoCircle,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ProgressBar, PageHeader, BrandChip, StatPill } from "@/components/ui/Misc";
import { cn, to12Hour } from "@/lib/utils";
import { SCHEDULED_POSTS, TODAY_DAY } from "@/lib/data/schedule";
import type { ScheduledPost, Platform, ScheduleStatus } from "@/lib/types";
import { PLATFORM_ADAPTERS, captionFill } from "./platform-adapters";

const STATUS_RANK: Record<ScheduleStatus, number> = {
  published: 0,
  publishing: 1,
  scheduled: 2,
  draft: 3,
};

function statusTag(status: ScheduleStatus) {
  switch (status) {
    case "published":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 font-mono text-[0.66rem] font-semibold uppercase tracking-wide text-success-ink">
          <IconCheck size={13} stroke={2.4} />
          Published
        </span>
      );
    case "publishing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 font-mono text-[0.66rem] font-semibold uppercase tracking-wide text-warn-ink">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warn" />
          </span>
          Publishing…
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[0.66rem] font-semibold uppercase tracking-wide text-muted">
          <IconClock size={13} stroke={2.2} />
          Scheduled
        </span>
      );
  }
}

function PostRow({ post }: { post: ScheduledPost }) {
  const [open, setOpen] = useState(post.status === "publishing");
  const isPublishing = post.status === "publishing";
  const isPublished = post.status === "published";

  return (
    <Card
      accent={isPublishing ? "amber" : "none"}
      className={cn(
        "transition-shadow hover:shadow-card-lg",
        isPublishing && "ring-1 ring-warn/30",
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        {/* day marker */}
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border",
            isPublished
              ? "border-success/20 bg-success-soft text-success-ink"
              : isPublishing
                ? "border-warn/30 bg-warn-soft text-warn-ink"
                : "border-rule bg-surface-2 text-secondary",
          )}
        >
          <span className="font-mono text-[0.56rem] uppercase tracking-wide opacity-70">
            Jun
          </span>
          <span className="font-display text-lg font-bold leading-none">
            {post.day}
          </span>
        </div>

        {/* identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <BrandChip slug={post.brandSlug} />
            {post.day === TODAY_DAY && (
              <Tag tone="info" className="uppercase">
                Today
              </Tag>
            )}
          </div>
          <div className="mt-1.5 truncate font-medium text-ink">
            {post.projectTitle}
          </div>
          <div className="mt-0.5 font-mono text-[0.7rem] text-muted">
            Jun {post.day} · {to12Hour(post.time)}
          </div>
        </div>

        {/* platforms */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {post.platforms.map((p) => (
            <span
              key={p}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-rule bg-surface text-secondary"
            >
              <PlatformIcon platform={p} size={15} />
            </span>
          ))}
        </div>

        {/* status + chevron */}
        <div className="flex items-center gap-3">
          {statusTag(post.status)}
          {open ? (
            <IconChevronDown size={18} className="text-muted" stroke={2} />
          ) : (
            <IconChevronRight size={18} className="text-muted" stroke={2} />
          )}
        </div>
      </button>

      {/* publishing progress strip */}
      {isPublishing && (
        <div className="border-t border-warn/20 bg-warn-soft/40 px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[0.68rem] text-warn-ink">
            <span className="inline-flex items-center gap-1.5">
              <IconBolt size={13} stroke={2.2} />
              Dispatching to LinkedIn Videos API…
            </span>
            <span>72%</span>
          </div>
          <ProgressBar value={72} barClassName="from-warn to-warn" />
        </div>
      )}

      {/* expanded per-platform payloads */}
      {open && (
        <div className="animate-fade-up border-t border-rule bg-surface-2/50 px-5 py-4">
          <SectionLabel>Per-platform payloads</SectionLabel>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {post.platforms.map((p) => {
              const a = PLATFORM_ADAPTERS[p];
              const used = captionFill(p, post.day);
              const pct = Math.round((used / a.captionLimit) * 100);
              const tight = p === "tiktok";
              return (
                <div
                  key={p}
                  className="rounded-lg border border-rule bg-surface px-3.5 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 text-sm font-semibold text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md ring-1",
                          a.ring,
                        )}
                      >
                        <PlatformIcon platform={p} size={13} />
                      </span>
                      {a.label}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[0.66rem]",
                        tight ? "text-pink" : "text-muted",
                      )}
                    >
                      {used.toLocaleString()} / {a.captionLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      value={pct}
                      className="h-1"
                      barClassName={
                        tight ? "from-pink to-pink" : "from-accent to-accent"
                      }
                    />
                  </div>
                  <div className="mt-2 font-mono text-[0.66rem] text-muted">
                    {a.captionNote}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-wide text-secondary/70">
                    <IconArrowUpRight size={11} stroke={2.2} />
                    {a.adapter}
                  </div>
                </div>
              );
            })}
          </div>

          {isPublished && (
            <div className="mt-3 flex items-center gap-1.5 font-mono text-[0.68rem] text-success-ink">
              <IconCheck size={13} stroke={2.4} />
              Live on all targets · verified delivery receipt stored
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function PublishQueue() {
  const posts = [...SCHEDULED_POSTS].sort((a, b) => {
    const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    return r !== 0 ? r : a.day - b.day;
  });

  const counts = {
    published: posts.filter((p) => p.status === "published").length,
    publishing: posts.filter((p) => p.status === "publishing").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
  };

  // platforms reached, deduped, for the summary annotation
  const platformsTouched = Array.from(
    new Set(posts.flatMap((p) => p.platforms)),
  ) as Platform[];

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7 md:px-8">
      <PageHeader
        label="Distribution"
        title="Publish Queue"
        subtitle="Platform dispatch view — every scheduled post, its per-platform caption payloads, and live delivery status across the social adapters."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-2 font-mono text-[0.68rem] text-muted">
            <IconRefresh size={13} stroke={2} className="text-accent" />
            Synced · June 2026
          </span>
        }
      />

      {/* summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Published" value={String(counts.published)} />
        <Card className="px-3 py-2 text-center" accent="amber">
          <div className="flex items-center justify-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warn" />
            </span>
            <span className="font-display text-xl font-bold text-ink">
              {counts.publishing}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-warn-ink">
            Publishing now
          </div>
        </Card>
        <StatPill label="Scheduled" value={String(counts.scheduled)} />
        <StatPill
          label="Platforms reached"
          value={String(platformsTouched.length)}
        />
      </div>

      {/* retry / backoff note */}
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rule bg-surface-2 px-4 py-3">
        <IconAlertTriangle
          size={16}
          stroke={2}
          className="mt-0.5 flex-shrink-0 text-warn"
        />
        <p className="text-sm text-secondary">
          <span className="font-semibold text-ink">Resilient dispatch.</span>{" "}
          Failed publishes retry{" "}
          <span className="font-mono text-xs text-ink">3×</span> with
          exponential backoff, then alert{" "}
          <span className="font-medium text-ink">Ira</span> with the platform
          error payload. Receipts are cached per-post.
        </p>
      </div>

      {/* pipeline list */}
      <div className="space-y-2.5">
        {posts.map((post) => (
          <PostRow key={post.id} post={post} />
        ))}
      </div>

      {/* adapter footer annotation */}
      <Card className="mt-7 p-5" accent="purple">
        <SectionLabel>Platform adapters</SectionLabel>
        <p className="mb-4 max-w-3xl text-sm text-secondary">
          Each target routes through a dedicated adapter that handles
          authentication, media upload, caption truncation, and delivery
          receipts. Caption variants are generated per platform to respect each
          network&apos;s character budget.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["instagram", "tiktok", "linkedin"] as Platform[]).map((p) => {
            const a = PLATFORM_ADAPTERS[p];
            return (
              <div
                key={p}
                className="rounded-lg border border-rule bg-surface px-3.5 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md ring-1",
                      a.ring,
                    )}
                  >
                    <PlatformIcon platform={p} size={15} />
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {a.label}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[0.66rem] text-muted">
                  {a.adapter}
                </div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[0.66rem] text-secondary">
                  <IconInfoCircle size={12} stroke={2} />
                  Caption {a.captionLimit.toLocaleString()} char limit
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-1.5 border-t border-rule pt-3 font-mono text-[0.66rem] text-muted">
          <IconSend size={12} stroke={2} className="text-accent" />
          POST /api/v1/projects/&#123;id&#125;/publish · Admin · Intern (non-Lea
          only)
        </div>
      </Card>
    </div>
  );
}
