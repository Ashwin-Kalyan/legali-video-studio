"use client";

import { useState } from "react";
import {
  IconCalendarPlus,
  IconCalendarCheck,
  IconSparkles,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn } from "@/lib/utils";
import { BRAND_KITS, BRAND_COLORS } from "@/lib/data/brands";
import { BEST_TIMES } from "@/lib/data";
import type { BrandSlug, Platform } from "@/lib/types";

const PROJECTS = [
  "Awareness hook reel (Jun 8)",
  "Founder story (Jun 7)",
  '"Is this abuse?" reel',
  "Trauma-informed FAQ (Jun 12)",
];

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
];

/** "6:00 PM" -> "18:00" for the native time input. */
function to24Hour(display: string): string {
  const m = display.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return "18:00";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export function NewPostForm({
  defaultDate,
  onCancel,
  onConfirm,
  onPlatformToggle,
  onFieldChange,
}: {
  defaultDate: string;
  onCancel: () => void;
  onConfirm: () => void;
  onPlatformToggle: () => void;
  onFieldChange: (field: "date" | "time") => void;
}) {
  const [brand, setBrand] = useState<BrandSlug>("lea");
  const [project, setProject] = useState(PROJECTS[0]);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("18:00");
  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({
    instagram: true,
    tiktok: true,
    linkedin: false,
    youtube: false,
  });

  const bestTimes = BEST_TIMES[brand];
  const brandColor = BRAND_COLORS[brand];

  function togglePlatform(id: Platform) {
    setPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
    onPlatformToggle();
  }

  return (
    <div className="animate-fade-up rounded-xl border border-rule bg-surface shadow-card-lg">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: brandColor.soft, color: brandColor.ink }}
          >
            <IconCalendarPlus size={15} stroke={1.75} />
          </span>
          <span className="font-display text-base font-bold text-ink">
            Schedule a post
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <IconX size={16} stroke={1.75} />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand">
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as BrandSlug)}
              className="w-full rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-accent/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            >
              {BRAND_KITS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.emoji} {b.brandName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Video project">
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-accent/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            >
              {PROJECTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                onFieldChange("date");
              }}
              className="w-full rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-accent/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                onFieldChange("time");
              }}
              className="w-full rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-accent/35 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </Field>
        </div>

        <Field label="Platforms">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    on
                      ? "border-accent/40 bg-accent-soft text-accent-ink"
                      : "border-rule bg-surface text-muted hover:border-accent/30 hover:text-secondary",
                  )}
                >
                  <PlatformIcon platform={p.id} size={13} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div>
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent">
            <IconSparkles size={12} stroke={1.75} />
            AI-recommended times · based on your audience
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bestTimes.map((slot) => {
              const rec = slot.recommended;
              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => {
                    setTime(to24Hour(slot.time));
                    onFieldChange("time");
                  }}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center transition-all hover:-translate-y-px",
                    rec
                      ? "border-accent bg-accent-soft text-accent-ink shadow-sm"
                      : "border-rule bg-surface-2 text-secondary hover:border-accent/40",
                  )}
                >
                  <div className="flex items-center justify-center gap-1 text-[0.6rem] font-medium uppercase tracking-wide text-muted">
                    {slot.label}
                    {rec && (
                      <IconStarFilled size={9} className="text-accent" />
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-semibold">
                    {slot.time}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-rule px-5 py-3.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onConfirm}>
          <IconCalendarCheck size={15} stroke={1.75} />
          Confirm schedule
        </Button>
      </div>

    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
