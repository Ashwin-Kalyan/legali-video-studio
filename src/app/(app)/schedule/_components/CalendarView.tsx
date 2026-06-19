"use client";

import { cn } from "@/lib/utils";
import { IconStarFilled } from "@tabler/icons-react";
import { BRAND_COLORS, getBrand } from "@/lib/data/brands";
import { SCHEDULED_POSTS, AI_OPTIMAL_DAYS, TODAY_DAY } from "@/lib/data";
import type { ScheduledPost } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// June 2026: 30 days, June 1 is a Monday, so no leading offset.
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

const POSTS_BY_DAY = SCHEDULED_POSTS.reduce<Record<number, ScheduledPost[]>>(
  (acc, p) => {
    (acc[p.day] ??= []).push(p);
    return acc;
  },
  {},
);

function shortBrand(slug: ScheduledPost["brandSlug"]): string {
  return getBrand(slug).brandName.replace(" by Legali", "").replace("Legali", "");
}

export function CalendarView({
  aiOn,
  onSelectDay,
  onSelectPost,
}: {
  aiOn: boolean;
  onSelectDay: (day: number) => void;
  onSelectPost: (post: ScheduledPost) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => {
          const isToday = d === TODAY_DAY;
          const posts = POSTS_BY_DAY[d] ?? [];
          const aiSlot = aiOn && AI_OPTIMAL_DAYS.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "group flex min-h-[104px] flex-col rounded-xl border bg-surface p-1.5 text-left transition-all",
                "hover:border-accent/40 hover:bg-surface-2 hover:shadow-card",
                isToday
                  ? "border-accent ring-1 ring-accent/30"
                  : "border-rule",
              )}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "font-mono text-[0.7rem]",
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-white"
                      : "text-muted",
                  )}
                >
                  {d}
                </span>
                {isToday && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-wide text-accent">
                    Today
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                {aiSlot && (
                  <span
                    className="flex items-center gap-1 truncate rounded-md border border-dashed border-accent/50 bg-accent-soft px-1.5 py-1 text-[0.62rem] font-medium text-accent-ink"
                    title="AI-recommended posting slot"
                  >
                    <IconStarFilled size={9} className="shrink-0" />
                    AI: 6pm optimal
                  </span>
                )}
                {posts.map((p) => {
                  const c = BRAND_COLORS[p.brandSlug];
                  return (
                    <span
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPost(p);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          onSelectPost(p);
                        }
                      }}
                      className="block truncate rounded-md px-1.5 py-1 text-[0.62rem] font-medium leading-tight transition-transform hover:-translate-y-px hover:shadow-sm"
                      style={{ background: c.soft, color: c.ink }}
                      title={`${p.time} · ${shortBrand(p.brandSlug)} · ${p.projectTitle}`}
                    >
                      <span className="font-mono opacity-80">{p.time}</span>{" "}
                      {shortBrand(p.brandSlug)} · {p.projectTitle}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
