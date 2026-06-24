import { NextResponse } from "next/server";
import { getProject, getBrand } from "@/lib/data";
import type { CandidateEdit } from "@/lib/types";
import { geminiConfigured, generateJson } from "@/lib/ai/gemini";

// AI cut generation (PRD §6.1) — Gemini turns scored transcript segments into
// 3 ranked candidate edits, brand-voiced. Falls back to the project's sample
// candidates when no key / no transcript / on error.

export async function POST(req: Request) {
  const { projectId } = await req.json().catch(() => ({}) as { projectId?: string });
  const project = getProject(projectId ?? "");
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }
  const brand = getBrand(project.brandSlug);

  if (!geminiConfigured() || project.transcript.length === 0) {
    return NextResponse.json({ source: "sample", candidates: project.candidates });
  }

  try {
    const result = await generateJson<{ candidates: CandidateEdit[] }>({
      temperature: 0.9,
      system:
        `You are an expert short-form video editor for ${brand.companyName}. ` +
        `Brand voice: ${brand.voiceDescription}. Tone tags: ${brand.toneTags.join(", ")}. ` +
        `Target audience: ${brand.targetAudience}. Core product: ${brand.productDescription}. ` +
        `NEVER use these phrases: ${brand.prohibitedPhrases.join("; ")}.` +
        (brand.traumaInformed
          ? " Apply trauma-informed language standards: avoid victim-blaming, minimizing, or perpetrator-centering phrasing."
          : ""),
      user:
        `Format template: ${project.templateName}. Generate 3 distinct candidate edits from these scored transcript segments.\n` +
        JSON.stringify(
          project.transcript.map((s) => ({
            id: s.segmentId,
            start_ms: s.startMs,
            end_ms: s.endMs,
            text: s.text,
            speech: s.speechScore,
            visual: s.visualScore,
          })),
        ) +
        "\nFor each: rank (1-3), segmentIds (ids in play order), hook (<=8 words), caption (brand-voiced narration), cta, durationS, score (0-10), breakdown {hook,pacing,brandFit} each 0-10.",
      schema: {
        type: "object",
        properties: {
          candidates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "integer" },
                segmentIds: { type: "array", items: { type: "integer" } },
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
              },
              required: ["rank", "segmentIds", "hook", "caption", "cta", "durationS", "score", "breakdown"],
            },
          },
        },
        required: ["candidates"],
      },
    });

    const candidates = (result.candidates ?? []).slice(0, 3);
    return NextResponse.json({
      source: "gemini",
      candidates: candidates.length ? candidates : project.candidates,
    });
  } catch (e) {
    return NextResponse.json({ source: "error", error: String(e), candidates: project.candidates });
  }
}
