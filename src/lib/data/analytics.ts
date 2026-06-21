import type {
  AnalyticsSnapshot,
  KpiPoint,
  AiInsight,
  BrandSlug,
  Platform,
  ContentType,
} from "@/lib/types";

// Deterministic data (no Date.now / Math.random) to keep SSR + client in sync.

// --- per-post analytics snapshots -----------------------------------------
export const ANALYTICS_SNAPSHOTS: AnalyticsSnapshot[] = [
  {
    id: "as_01",
    brandSlug: "lea",
    platform: "instagram",
    postId: "ig_88213",
    postTitle: '"Is This Abuse?" awareness reel',
    contentType: "reel",
    publishedAt: "2026-06-03T18:00:00Z",
    views: 84200,
    likes: 6120,
    comments: 412,
    shares: 1840,
    saves: 3210,
    reach: 71400,
    profileVisits: 2980,
    linkClicks: 1810,
    watchThroughPct: 62.4,
    utmConversions: 182,
    thumbnailHue: 330,
  },
  {
    id: "as_02",
    brandSlug: "lea",
    platform: "tiktok",
    postId: "tt_44120",
    postTitle: '"You might not even realize…" hook',
    contentType: "tiktok",
    publishedAt: "2026-06-05T19:00:00Z",
    views: 61300,
    likes: 8900,
    comments: 740,
    shares: 2210,
    saves: 1890,
    reach: 58200,
    profileVisits: 1740,
    linkClicks: 960,
    watchThroughPct: 58.1,
    utmConversions: 96,
    thumbnailHue: 318,
  },
  {
    id: "as_03",
    brandSlug: "my",
    platform: "instagram",
    postId: "ig_55021",
    postTitle: "3 documents you need before court",
    contentType: "carousel",
    publishedAt: "2026-06-04T12:00:00Z",
    views: 28400,
    likes: 1920,
    comments: 88,
    shares: 410,
    saves: 2240,
    reach: 24100,
    profileVisits: 720,
    linkClicks: 540,
    watchThroughPct: 41.2,
    utmConversions: 41,
    thumbnailHue: 160,
  },
  {
    id: "as_04",
    brandSlug: "team",
    platform: "linkedin",
    postId: "li_77310",
    postTitle: "How legal ops teams cut intake time 40%",
    contentType: "static",
    publishedAt: "2026-06-06T09:00:00Z",
    views: 14800,
    likes: 640,
    comments: 52,
    shares: 180,
    saves: 410,
    reach: 13900,
    profileVisits: 320,
    linkClicks: 290,
    watchThroughPct: 48.0,
    utmConversions: 22,
    thumbnailHue: 210,
  },
  {
    id: "as_05",
    brandSlug: "learn",
    platform: "tiktok",
    postId: "tt_91044",
    postTitle: "5 rights you didn't know you had",
    contentType: "tiktok",
    publishedAt: "2026-06-07T17:00:00Z",
    views: 39600,
    likes: 5400,
    comments: 310,
    shares: 1280,
    saves: 990,
    reach: 36800,
    profileVisits: 880,
    linkClicks: 210,
    watchThroughPct: 54.7,
    utmConversions: 14,
    thumbnailHue: 38,
  },
  {
    id: "as_06",
    brandSlug: "lea",
    platform: "instagram",
    postId: "ig_88990",
    postTitle: "Founder story — why I built Lea",
    contentType: "reel",
    publishedAt: "2026-06-08T19:30:00Z",
    views: 47100,
    likes: 4310,
    comments: 366,
    shares: 980,
    saves: 1560,
    reach: 41200,
    profileVisits: 1620,
    linkClicks: 870,
    watchThroughPct: 51.9,
    utmConversions: 73,
    thumbnailHue: 300,
  },
  {
    id: "as_07",
    brandSlug: "my",
    platform: "tiktok",
    postId: "tt_33218",
    postTitle: "Can you represent yourself in court?",
    contentType: "tiktok",
    publishedAt: "2026-06-09T11:00:00Z",
    views: 22300,
    likes: 2010,
    comments: 140,
    shares: 520,
    saves: 760,
    reach: 20800,
    profileVisits: 540,
    linkClicks: 380,
    watchThroughPct: 44.6,
    utmConversions: 28,
    thumbnailHue: 150,
  },
  {
    id: "as_08",
    brandSlug: "learn",
    platform: "instagram",
    postId: "ig_12077",
    postTitle: "What is coercive control? (explainer)",
    contentType: "reel",
    publishedAt: "2026-06-10T16:00:00Z",
    views: 31900,
    likes: 2780,
    comments: 196,
    shares: 720,
    saves: 1140,
    reach: 29400,
    profileVisits: 610,
    linkClicks: 150,
    watchThroughPct: 49.3,
    utmConversions: 9,
    thumbnailHue: 45,
  },
];

// --- KPI time series (last 30 days, weekly buckets) ------------------------
export const KPI_SERIES_30D: KpiPoint[] = [
  { label: "May 19", views: 18400, engagements: 1120, waitlist: 12, watchThru: 6.8 },
  { label: "May 22", views: 21200, engagements: 1340, waitlist: 18, watchThru: 7.0 },
  { label: "May 25", views: 19800, engagements: 1210, waitlist: 15, watchThru: 6.5 },
  { label: "May 28", views: 28600, engagements: 1880, waitlist: 24, watchThru: 6.7 },
  { label: "May 31", views: 26100, engagements: 1640, waitlist: 21, watchThru: 6.4 },
  { label: "Jun 3", views: 41800, engagements: 3210, waitlist: 58, watchThru: 6.6 },
  { label: "Jun 6", views: 37400, engagements: 2740, waitlist: 44, watchThru: 6.2 },
  { label: "Jun 9", views: 33900, engagements: 2380, waitlist: 38, watchThru: 6.0 },
  { label: "Jun 12", views: 44600, engagements: 3480, waitlist: 49, watchThru: 6.3 },
  { label: "Jun 15", views: 39200, engagements: 2910, waitlist: 33, watchThru: 5.9 },
];

export interface BrandHealth {
  slug: BrandSlug;
  brandName: string;
  emoji: string;
  health: number; // 0–100
  views: number;
  engagementRate: number;
  trend: number; // pct change
  consistency: number; // brand kit adherence
}

export const BRAND_HEALTH: BrandHealth[] = [
  {
    slug: "lea",
    brandName: "Lea by Legali",
    emoji: "🐰",
    health: 94,
    views: 192400,
    engagementRate: 7.8,
    trend: 34,
    consistency: 96,
  },
  {
    slug: "my",
    brandName: "MyLegali",
    emoji: "⚖️",
    health: 81,
    views: 50700,
    engagementRate: 5.1,
    trend: 12,
    consistency: 88,
  },
  {
    slug: "team",
    brandName: "TeamLegali",
    emoji: "💼",
    health: 72,
    views: 14800,
    engagementRate: 4.3,
    trend: -3,
    consistency: 91,
  },
  {
    slug: "learn",
    brandName: "LegaliLearn",
    emoji: "📚",
    health: 68,
    views: 71500,
    engagementRate: 6.4,
    trend: 21,
    consistency: 79,
  },
];

// --- content-type attribution ---------------------------------------------
export interface ContentTypeStat {
  type: ContentType;
  label: string;
  avgViews: number;
  avgSaves: number;
  avgShares: number;
  avgProfileVisits: number;
  bestFor: string;
}

export const CONTENT_TYPE_STATS: ContentTypeStat[] = [
  {
    type: "reel",
    label: "Reel",
    avgViews: 54300,
    avgSaves: 1960,
    avgShares: 1130,
    avgProfileVisits: 1740,
    bestFor: "Top-of-funnel",
  },
  {
    type: "tiktok",
    label: "TikTok",
    avgViews: 41100,
    avgSaves: 1210,
    avgShares: 1340,
    avgProfileVisits: 1050,
    bestFor: "Reach",
  },
  {
    type: "carousel",
    label: "Carousel",
    avgViews: 24800,
    avgSaves: 2240,
    avgShares: 410,
    avgProfileVisits: 720,
    bestFor: "Nurture (saves)",
  },
  {
    type: "static",
    label: "Static",
    avgViews: 13200,
    avgSaves: 380,
    avgShares: 160,
    avgProfileVisits: 290,
    bestFor: "Conversion (clicks)",
  },
];

// --- platform split --------------------------------------------------------
export interface PlatformSplit {
  platform: Platform;
  label: string;
  pct: number;
  color: string;
}

export const PLATFORM_SPLIT: PlatformSplit[] = [
  { platform: "instagram", label: "Instagram", pct: 48, color: "#db2777" },
  { platform: "tiktok", label: "TikTok", pct: 34, color: "#0f0c10" },
  { platform: "linkedin", label: "LinkedIn", pct: 12, color: "#0891b2" },
  { platform: "youtube", label: "YouTube", pct: 6, color: "#7c3aed" },
];

// --- waitlist funnel (Lea) -------------------------------------------------
export interface FunnelStep {
  label: string;
  value: number;
  rate: string;
}

export const WAITLIST_FUNNEL: FunnelStep[] = [
  { label: "Video views", value: 284000, rate: "100%" },
  { label: "Profile visits", value: 11820, rate: "4.2%" },
  { label: "Bio link clicks", value: 4640, rate: "39.3%" },
  { label: "Waitlist signups", value: 312, rate: "6.7%" },
];

// --- AI weekly insight (PRD §4.3.3 / §6.2) ---------------------------------
export const AI_INSIGHT: AiInsight = {
  summary:
    "Lea drove a record week, accounting for 58% of all waitlist signups. Personal-story hooks decisively outperformed stat-drop openers across every brand.",
  observations: [
    'Lea\'s "Is This Abuse?" awareness reel (Jun 3) drove 58% of all waitlist clicks this month — its highest single-post attribution to date.',
    'The hook "You might not even realize…" outperformed direct stat-drop openers by 2.4× on watch-through.',
    "MyLegali carousels held the top save-rate (7.9%) but converted poorly to profile visits — a nurture asset, not a discovery one.",
  ],
  pattern:
    "Personal-story, second-person hooks (\"you might…\") in the first 3 seconds correlate with +2.4× watch-through versus statistic openers.",
  action:
    "Produce 2 more Lea awareness reels this week using the personal-story hook format, and A/B one against a stat-drop control.",
  watchMetric: "Lea Instagram watch-through % — currently 62.4%, down 2pts week-over-week.",
  generatedAt: "2026-06-15T09:00:00Z",
};

// --- overview KPI cards ----------------------------------------------------
export interface OverviewKpi {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export const OVERVIEW_KPIS: OverviewKpi[] = [
  { label: "Total Views", value: "284K", delta: "↑ 34% vs prev", positive: true },
  { label: "Engagements", value: "18.2K", delta: "↑ 21%", positive: true },
  { label: "Avg Watch-thru", value: "6.4%", delta: "↓ 2%", positive: false },
  { label: "Waitlist Clicks", value: "312", delta: "↑ 58%", positive: true },
];
