import type {
  BrandKit,
  OnboardingQuestion,
  FormatTemplate,
  AppUser,
  PermissionRow,
  BrandSlug,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Brand kits — Lea defaults come straight from the PRD; the other three brands
// use plausible Legali-family defaults.
// ---------------------------------------------------------------------------
export const BRAND_KITS: BrandKit[] = [
  {
    id: "bk_lea",
    slug: "lea",
    brandName: "Lea by Legali",
    companyName: "Legali AI",
    industry: "Legal technology",
    productDescription:
      "AI companion for domestic violence survivors navigating protective orders and the legal system.",
    targetAudience: "DV survivors and self-represented litigants",
    painPoint: "Navigating protective orders alone, without trauma-informed support",
    differentiators: [
      "Trauma-informed AI",
      "Agentic & problem-first",
      "Bilingual EN / ID",
    ],
    voiceDescription:
      "Warm, empathetic, and quietly empowering. Speaks directly to survivors with dignity — never clinical, never sensational.",
    toneTags: ["Warm", "Empathetic", "Empowering", "Trustworthy"],
    prohibitedPhrases: [
      "why didn't she leave",
      "she provoked",
      "just abuse",
      "it wasn't that bad",
      "what did you do to deserve",
    ],
    primaryColor: "#3D0026",
    secondaryColor: "#FF6B9D",
    fontFamily: "Quicksand",
    logoPosition: "bottom-left",
    transitionStyle: "soft-fade",
    captionStyle: "highlight",
    musicMood: "soft-emotional",
    ctaTemplate: "Join the waitlist at lea.legali.ai",
    hashtagLibrary: [
      "#coercivecontrol",
      "#knowyourrights",
      "#traumainformed",
      "#dvsupport",
      "#legaltech",
    ],
    traumaInformed: true,
    onboardingComplete: true,
    onboardingStep: 7,
    emoji: "🐰",
    handle: "@lea.legali",
  },
  {
    id: "bk_my",
    slug: "my",
    brandName: "MyLegali",
    companyName: "Legali AI",
    industry: "Legal technology",
    productDescription:
      "A consumer legal-document assistant that drafts, explains, and files everyday legal paperwork.",
    targetAudience: "Self-represented litigants and small-business owners",
    painPoint: "The legal system is inaccessible and intimidating to navigate alone",
    differentiators: [
      "Plain-language legal drafting",
      "Court-form automation",
      "Affordable & on-demand",
    ],
    voiceDescription:
      "Confident, clear, and reassuring. Demystifies legal jargon with a steady, helpful hand.",
    toneTags: ["Confident", "Clear", "Approachable"],
    prohibitedPhrases: ["guaranteed outcome", "legal advice", "you will win"],
    primaryColor: "#085041",
    secondaryColor: "#34D399",
    fontFamily: "DM Sans",
    logoPosition: "bottom-right",
    transitionStyle: "clean-cut",
    captionStyle: "line-by-line",
    musicMood: "confident",
    ctaTemplate: "Try MyLegali free at mylegali.ai",
    hashtagLibrary: ["#legaltech", "#knowyourrights", "#smallbusiness", "#legaldocs"],
    traumaInformed: false,
    onboardingComplete: true,
    onboardingStep: 7,
    emoji: "⚖️",
    handle: "@mylegali",
  },
  {
    id: "bk_team",
    slug: "team",
    brandName: "TeamLegali",
    companyName: "Legali AI",
    industry: "Legal technology (B2B)",
    productDescription:
      "Workspace that gives in-house legal teams an agentic copilot for contracts, intake, and matter management.",
    targetAudience: "In-house counsel and legal operations teams",
    painPoint: "Legal teams drown in repetitive contract and intake work",
    differentiators: [
      "Agentic matter automation",
      "Enterprise-grade security",
      "Native integrations",
    ],
    voiceDescription:
      "Professional, precise, and forward-looking. Speaks to operators who value efficiency and rigor.",
    toneTags: ["Professional", "Precise", "Innovative"],
    prohibitedPhrases: ["replace your lawyers", "fully automated legal advice"],
    primaryColor: "#0C447C",
    secondaryColor: "#5B9CF6",
    fontFamily: "Inter",
    logoPosition: "top-left",
    transitionStyle: "snap",
    captionStyle: "line-by-line",
    musicMood: "corporate",
    ctaTemplate: "Book a demo at team.legali.ai",
    hashtagLibrary: ["#legalops", "#inhouse", "#legaltech", "#contractmanagement"],
    traumaInformed: false,
    onboardingComplete: true,
    onboardingStep: 7,
    emoji: "💼",
    handle: "@teamlegali",
  },
  {
    id: "bk_learn",
    slug: "learn",
    brandName: "LegaliLearn",
    companyName: "Legali AI",
    industry: "Legal education",
    productDescription:
      "Bite-sized legal education explaining everyday rights through short, accessible videos.",
    targetAudience: "Curious consumers and students learning their rights",
    painPoint: "People don't know their basic legal rights until they need them",
    differentiators: [
      "Bite-sized & shareable",
      "Myth-busting format",
      "Backed by real attorneys",
    ],
    voiceDescription:
      "Playful, energetic, and curious. Makes the law feel approachable and a little fun.",
    toneTags: ["Playful", "Energetic", "Curious"],
    prohibitedPhrases: ["this is legal advice", "always", "never (legally)"],
    primaryColor: "#633806",
    secondaryColor: "#F59E0B",
    fontFamily: "Poppins",
    logoPosition: "bottom-left",
    transitionStyle: "bounce",
    captionStyle: "word-by-word",
    musicMood: "playful",
    ctaTemplate: "Learn more at learn.legali.ai",
    hashtagLibrary: ["#legaltips", "#knowyourrights", "#learnontiktok", "#lawfacts"],
    traumaInformed: false,
    onboardingComplete: false,
    onboardingStep: 4,
    emoji: "📚",
    handle: "@legalilearn",
  },
];

export const BRAND_BY_SLUG: Record<BrandSlug, BrandKit> = Object.fromEntries(
  BRAND_KITS.map((b) => [b.slug, b]),
) as Record<BrandSlug, BrandKit>;

export function getBrand(slug: BrandSlug): BrandKit {
  return BRAND_BY_SLUG[slug];
}

// UI category color tokens per brand (used for chips, calendar events, etc.)
export const BRAND_COLORS: Record<
  BrandSlug,
  { soft: string; ink: string; tw: string }
> = {
  lea: { soft: "#EEEDFE", ink: "#3C3489", tw: "lea" },
  my: { soft: "#E1F5EE", ink: "#085041", tw: "my" },
  team: { soft: "#E6F1FB", ink: "#0C447C", tw: "team" },
  learn: { soft: "#FAEEDA", ink: "#633806", tw: "learn" },
};

// ---------------------------------------------------------------------------
// Onboarding — the 7 questions (PRD §3.2)
// ---------------------------------------------------------------------------
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    index: 1,
    prompt: "First, what is your company called?",
    field: "companyName",
    usedBy: "Analytics labels, video watermark",
    chips: [],
    placeholder: "e.g. Legali AI",
  },
  {
    index: 2,
    prompt: "What industry or space does this brand operate in?",
    field: "industry",
    usedBy: "AI insight framing, hashtag suggestions",
    chips: ["Legal technology", "Advocacy", "SaaS / B2C"],
    placeholder: "e.g. Legal technology",
  },
  {
    index: 3,
    prompt: "What product or service does this brand provide?",
    field: "productDescription",
    usedBy: "AI cut script generation system prompt",
    chips: [
      "AI companion for DV survivors",
      "Legal doc tool",
      "Court navigation",
    ],
    placeholder: "Describe your product in a sentence…",
  },
  {
    index: 4,
    prompt: "Who are your primary customers?",
    field: "targetAudience",
    usedBy: "Caption targeting, hook style, tone calibration",
    chips: ["DV survivors", "Self-rep litigants", "Nonprofits"],
    placeholder: "Describe your audience…",
  },
  {
    index: 5,
    prompt: "What core pain point do you solve?",
    field: "painPoint",
    usedBy: "Hook generation prompt, awareness reel template",
    chips: [
      "Navigating protective orders alone",
      "Legal system is inaccessible",
      "Lack of trauma-informed support",
    ],
    placeholder: "What problem do you solve?",
  },
  {
    index: 6,
    prompt: "What makes you different from alternatives?",
    field: "differentiators",
    usedBy: "UGC review template, founder story template",
    chips: [
      "Trauma-informed AI",
      "Agentic & problem-first",
      "Bilingual EN / ID",
    ],
    placeholder: "List your differentiators…",
  },
  {
    index: 7,
    prompt: "How would you describe your brand voice and tone?",
    field: "voiceDescription",
    usedBy: "All AI text generation — captions, narration, hooks",
    chips: [
      "Warm & empathetic",
      "Empowering & direct",
      "Gentle & trustworthy",
    ],
    placeholder: "Describe your brand voice…",
  },
];

// ---------------------------------------------------------------------------
// Format templates (PRD §5.4)
// ---------------------------------------------------------------------------
export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    name: "Awareness Hook Reel",
    durationMin: 15,
    durationMax: 30,
    hookStyle: "Stat-drop or personal-story opener",
    pacing: "Fast cut (2–4s clips)",
    bestBrands: "Lea",
    priority: "P0",
    emoji: "⚡",
  },
  {
    name: "Founder Story",
    durationMin: 45,
    durationMax: 60,
    hookStyle: 'Mission / "why I built this"',
    pacing: "Slow burn, talking-head",
    bestBrands: "All (Ira-narrated)",
    priority: "P0",
    emoji: "🎙️",
  },
  {
    name: "UGC Creator Review",
    durationMin: 30,
    durationMax: 45,
    hookStyle: "Direct-to-camera testimonial",
    pacing: "Moderate, B-roll cutaways",
    bestBrands: "Lea, MyLegali",
    priority: "P0",
    emoji: "📱",
  },
  {
    name: "Q&A / Legal FAQ",
    durationMin: 30,
    durationMax: 60,
    hookStyle: "Question overlay in text",
    pacing: "Structured, answer-per-cut",
    bestBrands: "MyLegali, LegaliLearn",
    priority: "P1",
    emoji: "❓",
  },
  {
    name: "Listicle",
    durationMin: 30,
    durationMax: 45,
    hookStyle: "Numbered text overlay",
    pacing: "Snap cuts between points",
    bestBrands: "LegaliLearn, Lea",
    priority: "P1",
    emoji: "🔢",
  },
  {
    name: "Product Demo",
    durationMin: 45,
    durationMax: 90,
    hookStyle: "Pain-point → solution reveal",
    pacing: "Screen recording + narration",
    bestBrands: "TeamLegali",
    priority: "P2",
    emoji: "🖥️",
  },
  {
    name: "Day in My Life",
    durationMin: 60,
    durationMax: 90,
    hookStyle: "Personal opener / ambient moment",
    pacing: "Vlog-style, lifestyle B-roll",
    bestBrands: "All (Ira-narrated)",
    priority: "P2",
    emoji: "🌅",
  },
];

// ---------------------------------------------------------------------------
// Users & permission matrix (PRD §2)
// ---------------------------------------------------------------------------
export const USERS: AppUser[] = [
  {
    id: "u_ira",
    name: "Irawati Puteri",
    role: "admin",
    email: "ira@legali.ai",
    brands: "all",
    emoji: "👩🏻‍💼",
  },
  {
    id: "u_swapnil",
    name: "Swapnil Botu",
    role: "intern",
    email: "swapnil@legali.ai",
    brands: ["my", "learn"],
    emoji: "👨🏽‍💻",
  },
  {
    id: "u_rick",
    name: "Rick",
    role: "viewer",
    email: "rick@legali.ai",
    brands: "all",
    emoji: "👨🏼‍💼",
  },
];

export const CURRENT_USER = USERS[0]; // Ira — admin

export const PERMISSION_MATRIX: PermissionRow[] = [
  { action: "View analytics dashboard", admin: "✅", intern: "✅", viewer: "✅" },
  { action: "Create / edit brand kits", admin: "✅", intern: "❌", viewer: "❌" },
  { action: "Upload raw footage", admin: "✅", intern: "✅", viewer: "❌" },
  { action: "Generate AI cuts", admin: "✅", intern: "✅", viewer: "❌" },
  {
    action: "Export video (non-Lea brands)",
    admin: "✅",
    intern: "✅",
    viewer: "❌",
  },
  {
    action: "Export video (Lea brand)",
    admin: "✅",
    intern: "⚠️ Draft only — Ira approves",
    viewer: "❌",
  },
  {
    action: "Direct publish to social",
    admin: "✅",
    intern: "⚠️ Non-Lea only",
    viewer: "❌",
  },
  {
    action: "Approve intern Lea exports",
    admin: "✅",
    intern: "❌",
    viewer: "❌",
  },
];
