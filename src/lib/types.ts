// ============================================================================
// Legali Video Studio — domain types
// Mirrors the PostgreSQL schema in the PRD (brand_kits, video_projects,
// analytics_snapshots) plus the scheduling / caption / subtitle additions.
// ============================================================================

export type BrandSlug = "lea" | "my" | "team" | "learn";
export type Platform = "instagram" | "tiktok" | "linkedin" | "youtube";
export type UserRole = "admin" | "intern" | "viewer";

export type LogoPosition = "top-left" | "bottom-left" | "bottom-right";
export type TransitionStyle = "soft-fade" | "clean-cut" | "snap" | "bounce";
export type CaptionStyle = "word-by-word" | "line-by-line" | "highlight";
export type MusicMood =
  | "soft-emotional"
  | "confident"
  | "playful"
  | "corporate"
  | "none";

// --- brand_kits ------------------------------------------------------------
export interface BrandKit {
  id: string;
  slug: BrandSlug;
  brandName: string;
  companyName: string;
  industry: string;
  productDescription: string;
  targetAudience: string;
  painPoint: string;
  differentiators: string[];
  voiceDescription: string;
  toneTags: string[];
  prohibitedPhrases: string[];
  primaryColor: string; // hex
  secondaryColor: string; // hex
  fontFamily: string;
  logoPosition: LogoPosition;
  transitionStyle: TransitionStyle;
  captionStyle: CaptionStyle;
  musicMood: MusicMood;
  ctaTemplate: string;
  hashtagLibrary: string[];
  traumaInformed: boolean;
  onboardingComplete: boolean;
  onboardingStep: number; // 0–7, resumable
  emoji: string; // avatar glyph used in mockups
  handle: string; // @handle for social
}

// --- onboarding question spec ---------------------------------------------
export interface OnboardingQuestion {
  index: number; // 1..7
  prompt: string;
  field: keyof BrandKit | string;
  usedBy: string;
  chips: string[];
  placeholder: string;
}

// --- video_projects --------------------------------------------------------
export type ProjectStatus =
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "ready"
  | "exported";
export type VoiceType = "recorded" | "ai-clone" | "library" | "none";
export type ApprovalStatus =
  | "not-required"
  | "pending"
  | "approved"
  | "rejected";

export interface TranscriptSegment {
  segmentId: number;
  startMs: number;
  endMs: number;
  text: string;
  speechScore: number; // 0–1
  visualScore: number; // 0–1
  brandScore: number; // 0–1
  composite: number; // 0–1
}

export interface CandidateEdit {
  rank: number;
  segmentIds: number[];
  hook: string;
  caption: string;
  cta: string;
  durationS: number;
  score: number; // 0–10
  breakdown: { hook: number; pacing: number; brandFit: number };
}

export interface SafetyFlag {
  phrase: string;
  reason: string;
  suggestedReplacement: string;
}

export interface SafetyCheck {
  passed: boolean;
  flags: SafetyFlag[];
  revisedText: string | null;
}

export interface VideoProject {
  id: string;
  title: string;
  brandSlug: BrandSlug;
  createdBy: string;
  templateName: string;
  status: ProjectStatus;
  durationS: number;
  thumbnailHue: number; // for placeholder gradient
  transcript: TranscriptSegment[];
  candidates: CandidateEdit[];
  selectedCandidate: number;
  safetyCheck: SafetyCheck;
  voiceType: VoiceType;
  exportFormats: string[]; // '9:16' | '1:1' | '4:5' | '16:9'
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// --- format templates ------------------------------------------------------
export interface FormatTemplate {
  name: string;
  durationMin: number;
  durationMax: number;
  hookStyle: string;
  pacing: string;
  bestBrands: string;
  priority: "P0" | "P1" | "P2";
  emoji: string;
}

// --- analytics_snapshots ---------------------------------------------------
export type ContentType =
  | "reel"
  | "carousel"
  | "static"
  | "story"
  | "tiktok"
  | "short";

export interface AnalyticsSnapshot {
  id: string;
  brandSlug: BrandSlug;
  platform: Platform;
  postId: string;
  postTitle: string;
  contentType: ContentType;
  publishedAt: string; // ISO
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  profileVisits: number;
  linkClicks: number;
  watchThroughPct: number;
  utmConversions: number;
  thumbnailHue: number;
}

export interface KpiPoint {
  label: string; // day label
  views: number;
  engagements: number;
  waitlist: number;
  watchThru: number; // avg watch-through %
}

// --- AI insight digest -----------------------------------------------------
export interface AiInsight {
  summary: string;
  observations: string[];
  pattern: string;
  action: string;
  watchMetric: string;
  generatedAt: string;
}

// --- scheduling ------------------------------------------------------------
export type ScheduleStatus = "published" | "publishing" | "scheduled" | "draft";

export interface ScheduledPost {
  id: string;
  day: number; // day of month (June 2026)
  time: string; // "18:00"
  brandSlug: BrandSlug;
  projectTitle: string;
  platforms: Platform[];
  status: ScheduleStatus;
}

export interface BestTimeSlot {
  time: string;
  label: string;
  recommended: boolean;
}

// --- captions / subtitles --------------------------------------------------
export interface CaptionSegment {
  startMs: number;
  endMs: number;
  text: string;
}

export type SubtitleFormat = "SRT" | "VTT" | "ASS" | "BURN";
export type CaptionRenderStyle = "word-by-word" | "line" | "full" | "bounce";

// --- users / permissions ---------------------------------------------------
export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  brands: BrandSlug[] | "all";
  emoji: string;
}

export interface PermissionRow {
  action: string;
  admin: string;
  intern: string;
  viewer: string;
}
