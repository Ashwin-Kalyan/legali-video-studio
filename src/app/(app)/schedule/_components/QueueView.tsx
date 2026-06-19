"use client";

import { IconEdit } from "@tabler/icons-react";
import { Tag } from "@/components/ui/Tag";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { BRAND_COLORS, getBrand } from "@/lib/data/brands";
import { SCHEDULED_POSTS } from "@/lib/data";
import { to12Hour } from "@/lib/utils";
import type { ScheduledPost, ScheduleStatus } from "@/lib/types";

const SORTED = [...SCHEDULED_POSTS].sort((a, b) => a.day - b.day);

function statusTag(status: ScheduleStatus) {
  switch (status) {
    case "published":
      return <Tag tone="success">published</Tag>;
    case "publishing":
      return (
        <Tag tone="warn">
          <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulseDot rounded-full bg-warn" />
          publishing…
        </Tag>
      );
    default:
      return <Tag tone="neutral">scheduled</Tag>;
  }
}

export function QueueView({
  onEdit,
}: {
  onEdit: (post: ScheduledPost) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {SORTED.map((p) => {
        const brand = getBrand(p.brandSlug);
        const c = BRAND_COLORS[p.brandSlug];
        return (
          <div
            key={p.id}
            className="group grid grid-cols-[44px_1fr_auto_auto_auto] items-center gap-4 rounded-xl border border-rule bg-surface px-3 py-2.5 shadow-card transition-colors hover:border-accent/30 hover:bg-surface-2"
          >
            <div
              className="flex h-14 w-11 items-center justify-center rounded-lg text-xl"
              style={{ background: c.soft }}
            >
              {brand.emoji}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">
                {brand.brandName.replace(" by Legali", "")} · {p.projectTitle}
              </div>
              <div className="mt-0.5 font-mono text-[0.7rem] text-muted">
                Jun {p.day}, 2026 · {to12Hour(p.time)}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {p.platforms.map((plat) => (
                <span
                  key={plat}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-rule bg-surface text-secondary"
                >
                  <PlatformIcon platform={plat} size={13} />
                </span>
              ))}
            </div>

            <div className="w-[88px] text-right">{statusTag(p.status)}</div>

            <button
              type="button"
              onClick={() => onEdit(p)}
              aria-label={`Edit ${p.projectTitle}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-rule bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <IconEdit size={14} stroke={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
