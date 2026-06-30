import { NextResponse } from "next/server";
import {
  loadMeta,
  saveMeta,
  type LiveCandidate,
} from "@/lib/studio/projectStore";
import { geminiConfigured, generateJson } from "@/lib/ai/gemini";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Natural-language revision — the user types what to change ("make it punchier",
// "cut the intro", "lead with the money part") and the AI re-cuts from the saved
// transcript (no need to re-watch the video — fast).

const SCHEMA = {
  type: "object",
  properties: {
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
  required: ["candidates"],
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { instruction = "" } = (await req.json().catch(() => ({}))) as {
    instruction?: string;
  };
  if (!instruction.trim()) {
    return NextResponse.json({ error: "No instruction provided" }, { status: 400 });
  }
  if (!geminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 200 });
  }
  if (!meta.transcript?.length) {
    return NextResponse.json(
      { error: "No transcript to revise from — re-run analysis first." },
      { status: 200 },
    );
  }

  const brand = getBrand((meta.brandSlug as BrandSlug) ?? "lea") ?? getBrand("lea");

  try {
    const result = await generateJson<{ candidates: LiveCandidate[] }>({
      temperature: 0.8,
      system:
        `You are an expert short-form MARKETING video editor for ${brand.brandName}. ` +
        `Every edit is a promotional reel built to grow the brand. ` +
        `Brand voice: ${brand.voiceDescription}. Tone: ${brand.toneTags.join(", ")}. ` +
        `Audience: ${brand.targetAudience}. End on this CTA: "${brand.ctaTemplate}". ` +
        `Never use these phrases: ${brand.prohibitedPhrases.join("; ")}.` +
        (brand.traumaInformed
          ? " Apply trauma-informed, survivor-centered language standards."
          : ""),
      user:
        "Here is the timestamped transcript of a source video (seconds):\n" +
        JSON.stringify(meta.transcript) +
        `\n\nThe editor wants this change: "${instruction}".\n\n` +
        "Re-design 3 vertical short-form MARKETING edits that honor that instruction while keeping the " +
        "hook → value → CTA arc. For each pick the segments to KEEP as {startSec, endSec} ranges chosen " +
        "from the transcript timestamps (in play order). Return rank (1 best), title, hook (<=8 words), " +
        "brand-voiced caption, cta, durationS, score 0–10, breakdown {hook, pacing, brandFit}, musicMood, " +
        "textOverlays, and editLog: a plain-language ordered list of EVERY edit you made — and explicitly " +
        "call out how you applied the editor's instruction.",
      schema: SCHEMA,
    });

    const candidates = (result.candidates ?? [])
      .slice(0, 3)
      .sort((a, b) => a.rank - b.rank);
    if (candidates.length === 0) {
      return NextResponse.json({ error: "AI returned no cuts" }, { status: 200 });
    }

    meta.candidates = candidates;
    meta.selected = 0;
    meta.status = "ready";
    meta.error = undefined;
    saveMeta(meta);
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
