import type {
  AnalyticsSnapshot,
  KpiPoint,
  AiInsight,
  BrandSlug,
  Platform,
  ContentType,
} from "@/lib/types";
import { formatCompact } from "@/lib/utils";

// Deterministic data (no Date.now / Math.random) to keep SSR + client in sync.

// "Current day" anchor for the dashboard. Fixed (not `new Date()`) so the date
// labels render identically on server + client, and so every range ends today.
const APP_TODAY = { y: 2026, m: 5, d: 21 }; // Jun 21, 2026 (month is 0-indexed)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Label for the day `daysAgo` before APP_TODAY — dayLabel(0) -> "Jun 21". */
function dayLabel(daysAgo: number): string {
  const ms = Date.UTC(APP_TODAY.y, APP_TODAY.m, APP_TODAY.d) - daysAgo * 86_400_000;
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Derive a KPI headline string from a series so cards always match the modal. */
function deriveKpiValue(
  series: KpiPoint[],
  key: "views" | "engagements" | "waitlist" | "watchThru",
  agg: "sum" | "avg",
  unit: "compact" | "plain" | "percent",
): string {
  const vals = series.map((p) => p[key]);
  const total = vals.reduce((a, b) => a + b, 0);
  const v = agg === "sum" ? total : total / vals.length;
  if (unit === "percent") return `${v.toFixed(1)}%`;
  if (unit === "plain") return Math.round(v).toLocaleString("en-US");
  return formatCompact(v);
}

interface KpiDelta {
  delta: string;
  positive: boolean;
}

function buildKpis(
  series: KpiPoint[],
  d: {
    views: KpiDelta;
    engagements: KpiDelta;
    watchThru: KpiDelta;
    waitlist: KpiDelta;
  },
): OverviewKpi[] {
  return [
    { label: "Total Views", value: deriveKpiValue(series, "views", "sum", "compact"), delta: d.views.delta, positive: d.views.positive },
    { label: "Engagements", value: deriveKpiValue(series, "engagements", "sum", "compact"), delta: d.engagements.delta, positive: d.engagements.positive },
    { label: "Avg Watch-thru", value: deriveKpiValue(series, "watchThru", "avg", "percent"), delta: d.watchThru.delta, positive: d.watchThru.positive },
    { label: "Waitlist Clicks", value: deriveKpiValue(series, "waitlist", "sum", "plain"), delta: d.waitlist.delta, positive: d.waitlist.positive },
  ];
}

// Per-metric visual identity — shared by the KPI cards and the detail modal so
// each card's accent bar matches the color of its pop-up trend graph.
export interface MetricMeta {
  color: string;
  accent: "purple" | "pink" | "blue" | "green";
  gradient: string; // CSS gradient for the card accent bar
}
export const METRIC_META: Record<string, MetricMeta> = {
  "Total Views": {
    color: "#7c3aed",
    accent: "purple",
    gradient: "linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #db2777 100%)",
  },
  Engagements: {
    color: "#db2777",
    accent: "pink",
    gradient: "linear-gradient(90deg, #db2777 0%, #f472b6 50%, #fb923c 100%)",
  },
  "Avg Watch-thru": {
    color: "#0891b2",
    accent: "blue",
    gradient: "linear-gradient(90deg, #0891b2 0%, #22d3ee 50%, #2563eb 100%)",
  },
  "Waitlist Clicks": {
    color: "#059669",
    accent: "green",
    gradient: "linear-gradient(90deg, #059669 0%, #34d399 50%, #0891b2 100%)",
  },
};

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
// Last 30 days — points every 3 days, ending today (May 22 → Jun 21).
export const KPI_SERIES_30D: KpiPoint[] = [
  { label: dayLabel(30), views: 22400, engagements: 1420, waitlist: 18, watchThru: 6.8, subscribers: 118200 },
  { label: dayLabel(27), views: 23800, engagements: 1510, waitlist: 22, watchThru: 7.0, subscribers: 119500 },
  { label: dayLabel(24), views: 25100, engagements: 1610, waitlist: 26, watchThru: 6.5, subscribers: 120800 },
  { label: dayLabel(21), views: 24200, engagements: 1540, waitlist: 24, watchThru: 6.7, subscribers: 121900 },
  { label: dayLabel(18), views: 31800, engagements: 2010, waitlist: 52, watchThru: 6.4, subscribers: 123000 },
  { label: dayLabel(15), views: 28400, engagements: 1820, waitlist: 40, watchThru: 6.6, subscribers: 124100 },
  { label: dayLabel(12), views: 26900, engagements: 1720, waitlist: 34, watchThru: 6.2, subscribers: 125000 },
  { label: dayLabel(9), views: 24600, engagements: 1560, waitlist: 28, watchThru: 6.0, subscribers: 125900 },
  { label: dayLabel(6), views: 23100, engagements: 1480, waitlist: 22, watchThru: 6.3, subscribers: 126700 },
  { label: dayLabel(3), views: 25800, engagements: 1640, waitlist: 26, watchThru: 6.1, subscribers: 127600 },
  { label: dayLabel(0), views: 28600, engagements: 1830, waitlist: 20, watchThru: 5.9, subscribers: 128400 },
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

export const OVERVIEW_KPIS: OverviewKpi[] = buildKpis(KPI_SERIES_30D, {
  views: { delta: "↑ 34% vs prev", positive: true },
  engagements: { delta: "↑ 21%", positive: true },
  watchThru: { delta: "↓ 2%", positive: false },
  waitlist: { delta: "↑ 58%", positive: true },
});

// ---------------------------------------------------------------------------
// Range-aware dashboard data — the 7d / 30d / 90d toggle drives the KPI cards,
// the trend chart, the per-metric modal, and the AI insight digest.
// ---------------------------------------------------------------------------
export type DashRange = "7d" | "30d" | "90d";

export interface RangeData {
  id: DashRange;
  shortLabel: string; // segmented-control label
  periodTitle: string; // AI panel header ("This week")
  series: KpiPoint[];
  kpis: OverviewKpi[];
  insight: AiInsight;
}

// --- Last 7 days (daily, Jun 14 → Jun 21) ----------------------------------
const SERIES_7D: KpiPoint[] = [
  { label: dayLabel(7), views: 9200, engagements: 700, waitlist: 7, watchThru: 6.0, subscribers: 125600 },
  { label: dayLabel(6), views: 11800, engagements: 910, waitlist: 10, watchThru: 5.9, subscribers: 126100 },
  { label: dayLabel(5), views: 10400, engagements: 810, waitlist: 9, watchThru: 6.1, subscribers: 126600 },
  { label: dayLabel(4), views: 9700, engagements: 690, waitlist: 7, watchThru: 5.8, subscribers: 127000 },
  { label: dayLabel(3), views: 12600, engagements: 980, waitlist: 12, watchThru: 6.2, subscribers: 127500 },
  { label: dayLabel(2), views: 13100, engagements: 1040, waitlist: 13, watchThru: 6.3, subscribers: 127900 },
  { label: dayLabel(1), views: 11200, engagements: 880, waitlist: 11, watchThru: 6.0, subscribers: 128150 },
  { label: dayLabel(0), views: 14300, engagements: 1120, waitlist: 15, watchThru: 6.4, subscribers: 128400 },
];

const KPIS_7D: OverviewKpi[] = buildKpis(SERIES_7D, {
  views: { delta: "↑ 12% vs prev", positive: true },
  engagements: { delta: "↑ 9%", positive: true },
  watchThru: { delta: "↓ 3%", positive: false },
  waitlist: { delta: "↑ 28%", positive: true },
});

const INSIGHT_7D: AiInsight = {
  summary:
    "Lea drove a record week — 58% of all waitlist signups in 7 days. Personal-story hooks beat stat-drop openers across every brand.",
  observations: [
    'Lea\'s "Is This Abuse?" reel (Jun 3) alone drove 58% of this week\'s waitlist clicks.',
    'The hook "You might not even realize…" beat stat-drop openers by 2.4× on 7-day watch-through.',
    "Saturday (Jun 14) posts underperformed weekday slots by 31% — consider pausing weekend scheduling.",
  ],
  pattern:
    "Second-person, personal-story hooks in the first 3 seconds correlate with +2.4× watch-through this week.",
  action:
    "Ship 2 more Lea awareness reels before Friday using the personal-story hook; A/B one against a stat-drop control.",
  watchMetric: "Lea Instagram 7-day watch-through — 6.1%, down 3% week-over-week.",
  generatedAt: "2026-06-15T09:00:00Z",
};

// --- Last 90 days (weekly, Mar 23 → Jun 21) --------------------------------
const SERIES_90D: KpiPoint[] = [
  { label: dayLabel(90), views: 42000, engagements: 2700, waitlist: 16, watchThru: 5.2, subscribers: 78000 },
  { label: dayLabel(83), views: 44500, engagements: 2850, waitlist: 19, watchThru: 5.4, subscribers: 82000 },
  { label: dayLabel(76), views: 47000, engagements: 3000, waitlist: 22, watchThru: 5.5, subscribers: 85500 },
  { label: dayLabel(69), views: 49500, engagements: 3150, waitlist: 25, watchThru: 5.6, subscribers: 89000 },
  { label: dayLabel(62), views: 52000, engagements: 3300, waitlist: 28, watchThru: 5.8, subscribers: 92500 },
  { label: dayLabel(55), views: 54500, engagements: 3500, waitlist: 32, watchThru: 5.9, subscribers: 96000 },
  { label: dayLabel(48), views: 57000, engagements: 3700, waitlist: 36, watchThru: 6.0, subscribers: 99500 },
  { label: dayLabel(41), views: 59500, engagements: 3900, waitlist: 40, watchThru: 6.1, subscribers: 103500 },
  { label: dayLabel(34), views: 62000, engagements: 4100, waitlist: 45, watchThru: 6.2, subscribers: 107000 },
  { label: dayLabel(27), views: 65000, engagements: 4350, waitlist: 52, watchThru: 6.3, subscribers: 111000 },
  { label: dayLabel(20), views: 68000, engagements: 4600, waitlist: 60, watchThru: 6.4, subscribers: 115500 },
  { label: dayLabel(13), views: 71000, engagements: 4850, waitlist: 68, watchThru: 6.5, subscribers: 120000 },
  { label: dayLabel(6), views: 74000, engagements: 5100, waitlist: 76, watchThru: 6.6, subscribers: 124500 },
  { label: dayLabel(0), views: 78000, engagements: 5400, waitlist: 86, watchThru: 6.4, subscribers: 128400 },
];

const KPIS_90D: OverviewKpi[] = buildKpis(SERIES_90D, {
  views: { delta: "↑ 46% vs prev", positive: true },
  engagements: { delta: "↑ 38%", positive: true },
  watchThru: { delta: "↑ 9%", positive: true },
  waitlist: { delta: "↑ 64%", positive: true },
});

const INSIGHT_90D: AiInsight = {
  summary:
    "Over the quarter, video became Legali's primary acquisition channel — 824K views and 605 waitlist signups, up 46% and 64% respectively.",
  observations: [
    "Waitlist signups grew 64% over 90 days, with Lea responsible for roughly 3 of every 5.",
    "Watch-through climbed from 5.2% to 6.6% as the team standardized the 3-second hook formula.",
    "MyLegali settled into a steady mid-funnel nurture role; TeamLegali stayed LinkedIn-only and flat.",
  ],
  pattern:
    "Quarter-over-quarter, hook discipline (first-3s) is the single biggest lever on both watch-through and waitlist conversion.",
  action:
    "Codify the personal-story hook as the default Lea template and roll the formula into LegaliLearn next quarter.",
  watchMetric:
    "Quarterly watch-through trend — now 6.0% average and rising; protect it as volume scales.",
  generatedAt: "2026-06-15T09:00:00Z",
};

// --- 30-day insight (monthly framing) --------------------------------------
const INSIGHT_30D: AiInsight = {
  summary:
    "Across 30 days, Lea compounded into your growth engine — +34% views and 312 waitlist signups, 58% of them Lea's. Watch-through is the soft spot.",
  observations: [
    "Lea contributed 68% of net-new waitlist signups this month while posting only 41% of content.",
    "Reels out-converted carousels 4:1 on profile visits; carousels still lead on saves (nurture, not discovery).",
    "TikTok reach grew +44% month-over-month but lagged on link clicks — strong top-of-funnel, weak conversion.",
  ],
  pattern:
    "Personal-story Reels drive discovery and conversion; carousels drive saves. Match format to funnel stage.",
  action:
    "Shift 2 of next month's carousels to awareness Reels for Lea; keep carousels for mid-funnel nurture.",
  watchMetric: "Avg watch-through — 6.4%, down 2% month-over-month despite reach gains.",
  generatedAt: "2026-06-15T09:00:00Z",
};

export const RANGE_DATA: Record<DashRange, RangeData> = {
  "7d": {
    id: "7d",
    shortLabel: "1wk",
    periodTitle: "This week",
    series: SERIES_7D,
    kpis: KPIS_7D,
    insight: INSIGHT_7D,
  },
  "30d": {
    id: "30d",
    shortLabel: "1mo",
    periodTitle: "This month",
    series: KPI_SERIES_30D,
    kpis: OVERVIEW_KPIS,
    insight: INSIGHT_30D,
  },
  "90d": {
    id: "90d",
    shortLabel: "3mos",
    periodTitle: "This quarter",
    series: SERIES_90D,
    kpis: KPIS_90D,
    insight: INSIGHT_90D,
  },
};
