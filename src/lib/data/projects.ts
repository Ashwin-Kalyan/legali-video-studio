import type {
  VideoProject,
  TranscriptSegment,
  CandidateEdit,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Transcript for the flagship Lea project (matches the subtitle editor mock)
// ---------------------------------------------------------------------------
export const LEA_TRANSCRIPT: TranscriptSegment[] = [
  {
    segmentId: 0,
    startMs: 0,
    endMs: 3200,
    text: "You might not even realize you're in a coercive relationship.",
    speechScore: 0.93,
    visualScore: 0.81,
    brandScore: 0.95,
    composite: 0.9,
  },
  {
    segmentId: 1,
    startMs: 3200,
    endMs: 7100,
    text: "Coercive control is one of the most common — and least recognized — forms of abuse.",
    speechScore: 0.86,
    visualScore: 0.78,
    brandScore: 0.92,
    composite: 0.85,
  },
  {
    segmentId: 2,
    startMs: 7100,
    endMs: 11400,
    text: "It doesn't always look like physical violence.",
    speechScore: 0.79,
    visualScore: 0.74,
    brandScore: 0.9,
    composite: 0.81,
  },
  {
    segmentId: 3,
    startMs: 11400,
    endMs: 16200,
    text: "It can be controlling your money, your time, your friendships.",
    speechScore: 0.82,
    visualScore: 0.8,
    brandScore: 0.88,
    composite: 0.83,
  },
  {
    segmentId: 4,
    startMs: 16200,
    endMs: 21000,
    text: "Lea by Legali helps you identify what's happening and understand your legal options.",
    speechScore: 0.88,
    visualScore: 0.83,
    brandScore: 0.97,
    composite: 0.89,
  },
  {
    segmentId: 5,
    startMs: 21000,
    endMs: 26500,
    text: "You don't have to navigate this alone. Join the waitlist at lea.legali.ai.",
    speechScore: 0.91,
    visualScore: 0.85,
    brandScore: 0.96,
    composite: 0.91,
  },
];

const LEA_CANDIDATES: CandidateEdit[] = [
  {
    rank: 1,
    segmentIds: [0, 2, 4, 5],
    hook: "You might not even realize…",
    caption:
      "You might not even realize you're experiencing coercive control. Lea by Legali helps you understand what's happening — and what you can do.",
    cta: "Join the waitlist at lea.legali.ai",
    durationS: 28,
    score: 8.4,
    breakdown: { hook: 9.1, pacing: 8.0, brandFit: 7.9 },
  },
  {
    rank: 2,
    segmentIds: [1, 3, 4, 5],
    hook: "The most common abuse nobody names",
    caption:
      "Coercive control is one of the most common — and least recognized — forms of abuse. Lea helps you understand your options.",
    cta: "Join the waitlist at lea.legali.ai",
    durationS: 31,
    score: 7.9,
    breakdown: { hook: 8.3, pacing: 7.6, brandFit: 7.8 },
  },
  {
    rank: 3,
    segmentIds: [0, 1, 4, 5],
    hook: "It's not always physical",
    caption:
      "Abuse doesn't always look like violence. It can be your money, your time, your friendships. Lea by Legali can help.",
    cta: "Join the waitlist at lea.legali.ai",
    durationS: 26,
    score: 7.1,
    breakdown: { hook: 7.4, pacing: 7.2, brandFit: 6.8 },
  },
];

// ---------------------------------------------------------------------------
// Generic transcript builder for non-flagship projects
// ---------------------------------------------------------------------------
function genericTranscript(lines: string[]): TranscriptSegment[] {
  let t = 0;
  return lines.map((text, i) => {
    const dur = 3500 + (i % 3) * 1200;
    const seg: TranscriptSegment = {
      segmentId: i,
      startMs: t,
      endMs: t + dur,
      text,
      speechScore: 0.7 + ((i * 7) % 25) / 100,
      visualScore: 0.65 + ((i * 11) % 28) / 100,
      brandScore: 0.72 + ((i * 5) % 22) / 100,
      composite: 0.7 + ((i * 9) % 24) / 100,
    };
    t += dur;
    return seg;
  });
}

const MY_CANDIDATES: CandidateEdit[] = [
  {
    rank: 1,
    segmentIds: [0, 1, 3],
    hook: "3 documents before you file",
    caption:
      "Going to court without a lawyer? These 3 documents will save you. MyLegali drafts them in minutes.",
    cta: "Try MyLegali free at mylegali.ai",
    durationS: 34,
    score: 7.6,
    breakdown: { hook: 7.8, pacing: 7.9, brandFit: 7.1 },
  },
  {
    rank: 2,
    segmentIds: [0, 2, 3],
    hook: "Representing yourself? Read this",
    caption:
      "You can represent yourself — but preparation is everything. MyLegali walks you through every form.",
    cta: "Try MyLegali free at mylegali.ai",
    durationS: 37,
    score: 7.2,
    breakdown: { hook: 7.1, pacing: 7.4, brandFit: 7.0 },
  },
  {
    rank: 3,
    segmentIds: [1, 2, 3],
    hook: "Court paperwork, demystified",
    caption:
      "Legal paperwork doesn't have to be intimidating. MyLegali explains every line in plain language.",
    cta: "Try MyLegali free at mylegali.ai",
    durationS: 33,
    score: 6.8,
    breakdown: { hook: 6.6, pacing: 7.0, brandFit: 6.9 },
  },
];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const VIDEO_PROJECTS: VideoProject[] = [
  {
    id: "project-4821",
    title: '"You might not even realize" — Awareness Hook',
    brandSlug: "lea",
    createdBy: "Irawati Puteri",
    templateName: "Awareness Hook Reel",
    status: "ready",
    durationS: 28,
    thumbnailHue: 330,
    transcript: LEA_TRANSCRIPT,
    candidates: LEA_CANDIDATES,
    selectedCandidate: 0,
    safetyCheck: { passed: true, flags: [], revisedText: null },
    voiceType: "recorded",
    exportFormats: ["9:16"],
    approvalStatus: "not-required",
    approvedBy: "Irawati Puteri",
    createdAt: "2026-06-14T15:20:00Z",
    updatedAt: "2026-06-15T10:02:00Z",
  },
  {
    id: "project-4822",
    title: "Founder Story — Why I built Lea",
    brandSlug: "lea",
    createdBy: "Irawati Puteri",
    templateName: "Founder Story",
    status: "ready",
    durationS: 52,
    thumbnailHue: 300,
    transcript: genericTranscript([
      "I built Lea because I watched someone I love try to leave.",
      "She didn't know her rights. The system felt impossible.",
      "Every form, every deadline, every door felt closed.",
      "So we built an AI companion that stays with you through all of it.",
      "Trauma-informed, bilingual, and always on your side.",
      "You don't have to navigate this alone. Join the waitlist.",
    ]),
    candidates: LEA_CANDIDATES,
    selectedCandidate: 0,
    safetyCheck: { passed: true, flags: [], revisedText: null },
    voiceType: "recorded",
    exportFormats: ["9:16", "1:1"],
    approvalStatus: "not-required",
    approvedBy: "Irawati Puteri",
    createdAt: "2026-06-13T11:00:00Z",
    updatedAt: "2026-06-13T12:40:00Z",
  },
  {
    id: "project-4830",
    title: "3 documents you need before court",
    brandSlug: "my",
    createdBy: "Swapnil Botu",
    templateName: "Listicle",
    status: "ready",
    durationS: 34,
    thumbnailHue: 160,
    transcript: genericTranscript([
      "Going to court without a lawyer? Bring these three things.",
      "One: a clear timeline of events, dated and factual.",
      "Two: every document that supports your side.",
      "Three: a one-page summary of what you're asking for.",
    ]),
    candidates: MY_CANDIDATES,
    selectedCandidate: 0,
    safetyCheck: { passed: true, flags: [], revisedText: null },
    voiceType: "ai-clone",
    exportFormats: ["9:16"],
    approvalStatus: "not-required",
    approvedBy: null,
    createdAt: "2026-06-12T09:10:00Z",
    updatedAt: "2026-06-12T09:55:00Z",
  },
  {
    id: "project-4840",
    title: "Coercive control explainer (intern draft)",
    brandSlug: "lea",
    createdBy: "Swapnil Botu",
    templateName: "Awareness Hook Reel",
    status: "ready",
    durationS: 24,
    thumbnailHue: 320,
    transcript: LEA_TRANSCRIPT,
    candidates: LEA_CANDIDATES,
    selectedCandidate: 1,
    safetyCheck: {
      passed: false,
      flags: [
        {
          phrase: "why didn't she just leave",
          reason: "Victim-blaming phrasing — places responsibility on the survivor.",
          suggestedReplacement:
            "leaving is often the most dangerous time — and it's rarely simple",
        },
      ],
      revisedText:
        "Leaving is often the most dangerous moment, and it's rarely simple. Lea helps you understand your options safely.",
    },
    voiceType: "recorded",
    exportFormats: [],
    approvalStatus: "pending",
    approvedBy: null,
    createdAt: "2026-06-16T14:00:00Z",
    updatedAt: "2026-06-16T14:32:00Z",
  },
  {
    id: "project-4851",
    title: "5 rights you didn't know you had",
    brandSlug: "learn",
    createdBy: "Swapnil Botu",
    templateName: "Listicle",
    status: "analyzing",
    durationS: 41,
    thumbnailHue: 38,
    transcript: genericTranscript([
      "Five rights you didn't know you had. Number five will surprise you.",
      "One: you can record the police in public.",
      "Two: you don't have to answer every question.",
      "Three: you can ask if you're free to go.",
    ]),
    candidates: [],
    selectedCandidate: 0,
    safetyCheck: { passed: true, flags: [], revisedText: null },
    voiceType: "none",
    exportFormats: [],
    approvalStatus: "not-required",
    approvedBy: null,
    createdAt: "2026-06-17T16:20:00Z",
    updatedAt: "2026-06-17T16:25:00Z",
  },
  {
    id: "project-4860",
    title: "How legal ops teams cut intake time 40%",
    brandSlug: "team",
    createdBy: "Irawati Puteri",
    templateName: "Product Demo",
    status: "transcribing",
    durationS: 68,
    thumbnailHue: 210,
    transcript: [],
    candidates: [],
    selectedCandidate: 0,
    safetyCheck: { passed: true, flags: [], revisedText: null },
    voiceType: "none",
    exportFormats: [],
    approvalStatus: "not-required",
    approvedBy: null,
    createdAt: "2026-06-18T08:40:00Z",
    updatedAt: "2026-06-18T08:41:00Z",
  },
];

export const PROJECT_BY_ID: Record<string, VideoProject> = Object.fromEntries(
  VIDEO_PROJECTS.map((p) => [p.id, p]),
);

export function getProject(id: string): VideoProject | undefined {
  return PROJECT_BY_ID[id];
}
