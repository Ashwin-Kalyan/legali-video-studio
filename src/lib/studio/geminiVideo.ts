import fs from "node:fs";
import type { LiveCandidate, TranscriptLine } from "./projectStore";

// ---------------------------------------------------------------------------
// Gemini multimodal video understanding (Google AI Studio).
// Uploads a video via the Files API, then asks Gemini to transcribe it and
// propose 3 brand-voiced edit decision lists (which time ranges to keep).
// ---------------------------------------------------------------------------

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const HOST = "https://generativelanguage.googleapis.com";

export function geminiConfigured(): boolean {
  return Boolean(API_KEY);
}

interface GeminiFile {
  name: string;
  uri: string;
  mimeType: string;
  state: string;
}

/** Upload a local video to the Gemini Files API and wait until it's ACTIVE. */
export async function uploadVideo(
  filePath: string,
  mime: string,
): Promise<GeminiFile> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");
  const bytes = fs.readFileSync(filePath);

  // 1. start a resumable upload session
  const startRes = await fetch(`${HOST}/upload/v1beta/files?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": mime,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "studio-upload" } }),
  });
  if (!startRes.ok) {
    throw new Error(`Files start ${startRes.status}: ${await startRes.text()}`);
  }
  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("No upload URL returned by Files API");

  // 2. upload bytes + finalize
  const upRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });
  if (!upRes.ok) {
    throw new Error(`Files upload ${upRes.status}: ${await upRes.text()}`);
  }
  const uploaded = (await upRes.json()) as { file: GeminiFile };
  let file = uploaded.file;

  // 3. poll until the video finishes processing (ACTIVE)
  for (let i = 0; i < 30 && file.state !== "ACTIVE"; i++) {
    if (file.state === "FAILED") throw new Error("Gemini failed to process video");
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`${HOST}/v1beta/${file.name}?key=${API_KEY}`);
    if (poll.ok) file = (await poll.json()) as GeminiFile;
  }
  if (file.state !== "ACTIVE") throw new Error("Video processing timed out");
  return file;
}

export interface VideoAnalysis {
  summary: string;
  transcript: TranscriptLine[];
  candidates: LiveCandidate[];
}

interface BrandContext {
  brandName: string;
  voiceDescription: string;
  toneTags: string[];
  targetAudience: string;
  ctaTemplate: string;
  prohibitedPhrases: string[];
  traumaInformed: boolean;
}

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    transcript: {
      type: "array",
      items: {
        type: "object",
        properties: {
          startSec: { type: "number" },
          endSec: { type: "number" },
          text: { type: "string" },
        },
        required: ["startSec", "endSec", "text"],
      },
    },
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          title: { type: "string" },
          hook: { type: "string" },
          caption: { type: "string" },
          cta: { type: "string" },
          durationS: { type: "number" },
          score: { type: "number" },
          breakdown: {
            type: "object",
            properties: {
              hook: { type: "number" },
              pacing: { type: "number" },
              brandFit: { type: "number" },
            },
            required: ["hook", "pacing", "brandFit"],
          },
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                startSec: { type: "number" },
                endSec: { type: "number" },
                reason: { type: "string" },
              },
              required: ["startSec", "endSec"],
            },
          },
          editLog: {
            type: "array",
            description:
              "Plain-language list of every edit decision made for this cut, in order.",
            items: { type: "string" },
          },
          textOverlays: {
            type: "array",
            description: "Short on-screen text / caption overlays for key moments.",
            items: { type: "string" },
          },
          musicMood: { type: "string" },
        },
        required: [
          "rank",
          "title",
          "hook",
          "caption",
          "durationS",
          "score",
          "segments",
          "editLog",
        ],
      },
    },
  },
  required: ["summary", "transcript", "candidates"],
};

/** Ask Gemini to watch the uploaded video and propose 3 edits. */
export async function analyzeVideo(
  file: GeminiFile,
  brand: BrandContext,
): Promise<VideoAnalysis> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const system =
    `You are an expert short-form MARKETING video editor for ${brand.brandName}. ` +
    `Every edit you design is a promotional reel whose job is to grow the brand: ` +
    `stop the scroll, build trust, and drive the audience to act. ` +
    `Brand voice: ${brand.voiceDescription}. Tone: ${brand.toneTags.join(", ")}. ` +
    `Audience: ${brand.targetAudience}. CTA to end on: "${brand.ctaTemplate}". ` +
    `Never use these phrases: ${brand.prohibitedPhrases.join("; ")}.` +
    (brand.traumaInformed
      ? " Apply trauma-informed, survivor-centered language standards — never sensational, never exploit pain."
      : "");

  const prompt =
    "Watch this video. First transcribe it with accurate start/end timestamps (seconds). " +
    "Then design 3 DISTINCT vertical short-form MARKETING edits (15–45s each) that promote the brand. " +
    "Each cut must follow a hook → value → CTA arc: lead with the strongest 3-second hook, deliver the " +
    "most compelling/emotional value moment in the middle, and end on the brand CTA. For each edit pick the " +
    "segments to KEEP as a list of {startSec, endSec} time ranges from the source (in play order; drop dead " +
    "air, rambles, filler and weak moments). Provide: title, hook (<=8 words), a brand-voiced marketing " +
    "caption, cta, total durationS, a score 0–10 and a breakdown {hook, pacing, brandFit}. " +
    "Also return musicMood (the emotional music bed that fits this cut), textOverlays (2–4 short on-screen " +
    "text lines for key beats), and editLog: a plain-language, ordered list of EVERY edit decision you made " +
    "for this cut (e.g. 'Trimmed 0:00–0:04 of dead air before the hook', 'Kept the survivor testimonial at " +
    "0:18–0:27 as the emotional core', 'Cut a 6s tangent at 0:40', 'Ended on the waitlist CTA'). " +
    "Rank them 1 (best) to 3.";

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: "user",
        parts: [
          { file_data: { mime_type: file.mimeType, file_uri: file.uri } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
    },
  };

  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(
      `${HOST}/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const parsed = JSON.parse(text) as VideoAnalysis;
      parsed.candidates = (parsed.candidates ?? [])
        .slice(0, 3)
        .sort((a, b) => a.rank - b.rank);
      return parsed;
    }
    lastErr = `Gemini ${res.status}: ${await res.text()}`;
    if (res.status === 503 || res.status === 500) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      continue;
    }
    throw new Error(lastErr);
  }
  throw new Error(lastErr);
}
