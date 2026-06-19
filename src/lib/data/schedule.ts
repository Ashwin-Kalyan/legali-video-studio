import type {
  ScheduledPost,
  BestTimeSlot,
  BrandSlug,
  Platform,
} from "@/lib/types";

// Scheduled posts for June 2026 (matches the scheduling mockup events)
export const SCHEDULED_POSTS: ScheduledPost[] = [
  { id: "sp_02", day: 2, time: "18:00", brandSlug: "lea", projectTitle: "Awareness reel", platforms: ["instagram", "tiktok"], status: "published" },
  { id: "sp_03", day: 3, time: "12:00", brandSlug: "my", projectTitle: "FAQ", platforms: ["instagram", "linkedin"], status: "published" },
  { id: "sp_05", day: 5, time: "19:00", brandSlug: "lea", projectTitle: "Founder story", platforms: ["instagram", "tiktok"], status: "published" },
  { id: "sp_08", day: 8, time: "09:00", brandSlug: "team", projectTitle: "Demo", platforms: ["linkedin"], status: "publishing" },
  { id: "sp_10", day: 10, time: "17:00", brandSlug: "learn", projectTitle: "Listicle", platforms: ["tiktok", "instagram"], status: "scheduled" },
  { id: "sp_12", day: 12, time: "18:30", brandSlug: "lea", projectTitle: "UGC reel", platforms: ["instagram", "tiktok"], status: "scheduled" },
  { id: "sp_15", day: 15, time: "11:00", brandSlug: "my", projectTitle: "Q&A", platforms: ["instagram", "linkedin"], status: "scheduled" },
  { id: "sp_17", day: 17, time: "16:00", brandSlug: "learn", projectTitle: "Tips", platforms: ["tiktok", "instagram"], status: "scheduled" },
  { id: "sp_19", day: 19, time: "18:00", brandSlug: "lea", projectTitle: "Hook reel", platforms: ["instagram", "tiktok"], status: "scheduled" },
  { id: "sp_22", day: 22, time: "09:00", brandSlug: "team", projectTitle: "Feature", platforms: ["linkedin"], status: "scheduled" },
  { id: "sp_24", day: 24, time: "19:30", brandSlug: "lea", projectTitle: "Awareness", platforms: ["instagram", "tiktok"], status: "scheduled" },
  { id: "sp_26", day: 26, time: "12:00", brandSlug: "my", projectTitle: "Story", platforms: ["instagram", "linkedin"], status: "scheduled" },
];

// AI-recommended posting times per brand (PRD §schedule/best-times)
export const BEST_TIMES: Record<BrandSlug, BestTimeSlot[]> = {
  lea: [
    { time: "6:00 PM", label: "Best for Lea", recommended: true },
    { time: "7:30 PM", label: "2nd best", recommended: false },
    { time: "12:00 PM", label: "Lunch peak", recommended: false },
  ],
  my: [
    { time: "12:00 PM", label: "Best overall", recommended: true },
    { time: "9:00 AM", label: "Morning", recommended: false },
    { time: "5:00 PM", label: "After work", recommended: false },
  ],
  team: [
    { time: "9:00 AM", label: "Best for LinkedIn", recommended: true },
    { time: "12:00 PM", label: "Lunch", recommended: false },
    { time: "4:00 PM", label: "Afternoon", recommended: false },
  ],
  learn: [
    { time: "5:00 PM", label: "Best for TikTok", recommended: true },
    { time: "8:00 PM", label: "Evening", recommended: false },
    { time: "3:00 PM", label: "After school", recommended: false },
  ],
};

// Days the AI flags as optimal posting slots (calendar overlay)
export const AI_OPTIMAL_DAYS = [2, 5, 8, 12, 15, 19, 22, 26];

export const TODAY_DAY = 18; // June 18, 2026

// Multilingual caption strings for the flagship segment (caption editor)
export const LANG_CAPTIONS: Record<string, string> = {
  en: "You might not even realize…",
  id: "Mungkin kamu bahkan tidak menyadari…",
  es: "Puede que ni siquiera te des cuenta…",
  fr: "Tu ne t'en rends peut-être pas compte…",
  ar: "ربما لا تدرك حتى…",
  zh: "你甚至可能没有意识到…",
};

export const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa ID", flag: "🇮🇩" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
];

export const PLATFORM_META: Record<
  Platform,
  { label: string; icon: string }
> = {
  instagram: { label: "Instagram", icon: "instagram" },
  tiktok: { label: "TikTok", icon: "tiktok" },
  linkedin: { label: "LinkedIn", icon: "linkedin" },
  youtube: { label: "YouTube", icon: "youtube" },
};
