import type { Platform } from "@/lib/types";

/**
 * Per-platform caption-variant constraints + adapter wiring.
 * Mirrors the scheduling mockup: each platform has a different caption
 * character budget and is dispatched through a different platform adapter.
 */
export interface PlatformAdapter {
  platform: Platform;
  label: string;
  /** Max caption length the adapter truncates / validates against. */
  captionLimit: number;
  /** Short caption-variant note shown on each post. */
  captionNote: string;
  /** Production adapter the dispatcher routes through. */
  adapter: string;
  /** Tailwind accent used for the adapter chip. */
  ring: string;
}

export const PLATFORM_ADAPTERS: Record<Platform, PlatformAdapter> = {
  instagram: {
    platform: "instagram",
    label: "Instagram",
    captionLimit: 2200,
    captionNote: "≤ 2,200 chars · 30 hashtags appended",
    adapter: "Meta Graph API · /media + /media_publish",
    ring: "ring-pink/30 text-pink",
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok",
    captionLimit: 150,
    captionNote: "≤ 150 chars · hook-first, trimmed",
    adapter: "TikTok Direct Post API",
    ring: "ring-ink/15 text-ink",
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    captionLimit: 3000,
    captionNote: "≤ 3,000 chars · long-form context",
    adapter: "LinkedIn Videos API · ugcPosts",
    ring: "ring-brand-team/30 text-brand-team",
  },
  youtube: {
    platform: "youtube",
    label: "YouTube",
    captionLimit: 5000,
    captionNote: "≤ 5,000 chars · description + chapters",
    adapter: "YouTube Data API v3 · videos.insert",
    ring: "ring-danger/30 text-danger",
  },
};

/** Approx character count of a generated caption variant per platform. */
export function captionFill(platform: Platform, day: number): number {
  const a = PLATFORM_ADAPTERS[platform];
  // Deterministic pseudo-fill derived from the post day — never random.
  const ratios: Record<Platform, number> = {
    instagram: 0.41,
    tiktok: 0.79,
    linkedin: 0.27,
    youtube: 0.33,
  };
  const jitter = ((day * 7) % 11) / 100; // 0–0.10, deterministic
  const pct = Math.min(0.97, ratios[platform] + jitter);
  return Math.round(a.captionLimit * pct);
}
