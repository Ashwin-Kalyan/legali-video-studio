"use client";

import { useState } from "react";
import {
  IconPlus,
  IconSparkles,
  IconCalendar,
  IconSend,
  IconCode,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { PageHeader, StatPill } from "@/components/ui/Misc";
import { cn } from "@/lib/utils";
import { SCHEDULED_POSTS } from "@/lib/data";
import type { ScheduledPost } from "@/lib/types";
import { SegmentedToggle } from "./SegmentedToggle";
import { CalendarView } from "./CalendarView";
import { QueueView } from "./QueueView";
import { NewPostForm } from "./NewPostForm";

type View = "calendar" | "queue";

const ANNO = {
  base: (
    <>
      <strong>API:</strong> <code>GET /api/v1/schedule?month=2026-06</code> →
      returns all scheduled posts. <code>GET /api/v1/schedule/best-times</code> →
      AI-ranked optimal posting times per brand / platform.
    </>
  ),
  ai: (
    <>
      <strong>AI scheduling:</strong>{" "}
      <code>
        GET /api/v1/schedule/best-times?brand=all&amp;platforms=instagram,tiktok,linkedin
      </code>{" "}
      → Claude analyses <code>analytics_snapshots.audience_active_pct</code> by
      hour / day, returns ranked slots. Rendered as dashed overlays.
    </>
  ),
  open: (
    <>
      <strong>API:</strong> <code>POST /api/v1/schedule</code> — body{" "}
      <code>{`{project_id, brand_kit_id, scheduled_at, platforms[], caption_overrides{}}`}</code>
      . Each platform gets a format-specific caption (IG ≤2200, TikTok ≤150,
      LinkedIn ≤3000).
    </>
  ),
  platform: (
    <>
      <strong>Platform adapters:</strong> Meta Graph API (
      <code>POST /v19.0/&#123;ig-user-id&#125;/media</code>), TikTok Direct Post
      (<code>POST /v2/post/publish/video/init/</code>), LinkedIn Videos API. Each
      validates format constraints before scheduling.
    </>
  ),
  date: (
    <>
      <strong>Scheduling engine:</strong> <code>scheduled_at</code> stored as UTC
      in <code>scheduled_posts</code>. <code>PublishWorker</code> (Celery beat)
      polls every 5min, fires adapters within ±2min of target.
    </>
  ),
  time: (
    <>
      <strong>Timezone:</strong> UI shows local time (SF / PT), stored as UTC.{" "}
      <code>PublishWorker</code> converts to each platform&apos;s required
      timezone per API spec.
    </>
  ),
  edit: (
    <>
      <strong>API:</strong> <code>PATCH /api/v1/schedule/&#123;id&#125;</code> —
      update time, platforms or video. <code>DELETE</code> to cancel. Reschedule
      re-queues <code>PublishWorker</code>.
    </>
  ),
  select: (
    <>
      <strong>Post detail:</strong>{" "}
      <code>GET /api/v1/schedule/&#123;id&#125;</code> → returns post.{" "}
      <code>PATCH</code> to edit time. Adapters fire <code>PublishWorker</code>{" "}
      at scheduled UTC time.
    </>
  ),
  confirmed: (
    <>
      <strong>Scheduled:</strong> <code>POST /api/v1/schedule</code> →{" "}
      <span className="font-semibold text-success-ink">201 Created</span>.{" "}
      <code>PublishWorker</code> queued; caption variants auto-generated per
      character limit. Calendar refreshes via{" "}
      <code>GET /api/v1/schedule?month=2026-06</code>.
    </>
  ),
} as const;

type AnnoKey = keyof typeof ANNO;

const PUBLISHED = SCHEDULED_POSTS.filter((p) => p.status === "published").length;
const SCHEDULED = SCHEDULED_POSTS.filter(
  (p) => p.status === "scheduled" || p.status === "publishing",
).length;

export function ScheduleScreen() {
  const [view, setView] = useState<View>("calendar");
  const [aiOn, setAiOn] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState("2026-06-10");
  const [anno, setAnno] = useState<AnnoKey>("base");
  const [confirmed, setConfirmed] = useState(false);

  function openForm(date?: string) {
    if (date) setFormDate(date);
    setConfirmed(false);
    setFormOpen(true);
    setAnno("open");
  }

  function toggleAi() {
    setAiOn((prev) => {
      const next = !prev;
      setAnno(next ? "ai" : "base");
      return next;
    });
  }

  function selectDay(day: number) {
    openForm(`2026-06-${String(day).padStart(2, "0")}`);
  }

  function selectPost(_post: ScheduledPost) {
    setAnno("select");
  }

  function editPost(_post: ScheduledPost) {
    setAnno("edit");
  }

  function confirmSchedule() {
    setFormOpen(false);
    setConfirmed(true);
    setAnno("confirmed");
  }

  function cancelForm() {
    setFormOpen(false);
    setAnno("base");
  }

  return (
    <div>
      <PageHeader
        label="Auto Scheduling"
        title="Schedule"
        subtitle="AI-optimized cross-platform publishing — pick a slot or let Claude rank the best times from your last-30-day audience activity."
        actions={
          <>
            <SegmentedToggle<View>
              value={view}
              onChange={setView}
              options={[
                {
                  value: "calendar",
                  label: "Calendar",
                  icon: <IconCalendar size={14} stroke={1.75} />,
                },
                {
                  value: "queue",
                  label: "Queue",
                  icon: <IconSend size={14} stroke={1.75} />,
                },
              ]}
            />
            <Button
              variant={aiOn ? "primary" : "outline"}
              size="md"
              onClick={toggleAi}
              aria-pressed={aiOn}
              className={cn(aiOn && "shadow-glow")}
            >
              <IconSparkles size={16} stroke={1.75} />
              {aiOn ? "AI times on" : "AI suggest times"}
            </Button>
            <Button variant="pink" size="md" onClick={() => openForm()}>
              <IconPlus size={16} stroke={1.75} />
              Schedule post
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatPill label="This month" value={String(SCHEDULED_POSTS.length)} />
        <StatPill label="Published" value={String(PUBLISHED)} />
        <StatPill label="In queue" value={String(SCHEDULED)} />
        <StatPill label="Brands" value="4" />
        {confirmed && (
          <div className="ml-auto flex animate-fade-up items-center gap-2 rounded-lg border border-emerald-200 bg-success-soft px-3 py-2 text-sm font-medium text-success-ink">
            <IconCircleCheck size={16} stroke={1.75} />
            Post scheduled — PublishWorker queued.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-rule bg-surface p-4 shadow-card md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {view === "calendar" ? "Calendar view" : "Publish queue"}
            </h2>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
              June 2026
            </p>
          </div>
          {view === "calendar" && (
            <div className="flex items-center gap-3 text-[0.68rem] text-muted">
              <Legend swatch="#EEEDFE" label="Lea" />
              <Legend swatch="#E1F5EE" label="MyLegali" />
              <Legend swatch="#E6F1FB" label="TeamLegali" />
              <Legend swatch="#FAEEDA" label="LegaliLearn" />
            </div>
          )}
        </div>

        {view === "calendar" ? (
          <CalendarView
            aiOn={aiOn}
            onSelectDay={selectDay}
            onSelectPost={selectPost}
          />
        ) : (
          <QueueView onEdit={editPost} />
        )}
      </div>

      {formOpen && (
        <div className="mt-4">
          <NewPostForm
            defaultDate={formDate}
            onCancel={cancelForm}
            onConfirm={confirmSchedule}
            onPlatformToggle={() => setAnno("platform")}
            onFieldChange={(f) => setAnno(f)}
          />
        </div>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cyan-200 bg-cyan-soft px-4 py-3">
        <IconCode size={15} stroke={1.75} className="mt-0.5 shrink-0 text-cyan-ink" />
        <p className="font-mono text-[0.7rem] leading-relaxed text-cyan-ink [&_code]:rounded [&_code]:bg-cyan-ink/10 [&_code]:px-1 [&_code]:py-px [&_code]:text-[0.66rem]">
          {ANNO[anno]}
        </p>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ background: swatch }}
      />
      {label}
    </span>
  );
}
