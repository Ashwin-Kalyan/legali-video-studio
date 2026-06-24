import { NextResponse } from "next/server";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";
import { geminiConfigured, generateJson } from "@/lib/ai/gemini";

// Trauma-informed content safety check (PRD §6.3) — runs on AI-generated text
// before display/export, especially for the Lea brand.

interface RawFlag {
  phrase: string;
  reason: string;
  suggested_replacement: string;
}

export async function POST(req: Request) {
  const { text, brandSlug = "lea" } = await req
    .json()
    .catch(() => ({}) as { text?: string; brandSlug?: BrandSlug });
  const brand = getBrand(brandSlug as BrandSlug);

  if (!geminiConfigured() || !text) {
    return NextResponse.json({
      source: "sample",
      passed: true,
      flags: [],
      revisedText: null,
    });
  }

  try {
    const parsed = await generateJson<{
      passed: boolean;
      flags: RawFlag[];
      revised_text?: string;
    }>({
      temperature: 0.2,
      system:
        `You are a trauma-informed content reviewer for ${brand.brandName}, ` +
        "an AI companion for domestic violence survivors. Review generated text for: " +
        "victim-blaming language; minimizing language; perpetrator-centering; crisis triggers " +
        "without warning; anything that could discourage a survivor from seeking help. " +
        `Also flag these prohibited phrases: ${brand.prohibitedPhrases.join("; ")}.`,
      user:
        `Review this generated caption/script:\n"${text}"\n\n` +
        "Return passed (boolean), flags (array of {phrase, reason, suggested_replacement}), " +
        "and revised_text (a safe rewrite, or empty string if it already passes).",
      schema: {
        type: "object",
        properties: {
          passed: { type: "boolean" },
          flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase: { type: "string" },
                reason: { type: "string" },
                suggested_replacement: { type: "string" },
              },
              required: ["phrase", "reason", "suggested_replacement"],
            },
          },
          revised_text: { type: "string" },
        },
        required: ["passed", "flags"],
      },
    });

    return NextResponse.json({
      source: "gemini",
      passed: parsed.passed,
      flags: (parsed.flags ?? []).map((f) => ({
        phrase: f.phrase,
        reason: f.reason,
        suggestedReplacement: f.suggested_replacement,
      })),
      revisedText: parsed.revised_text || null,
    });
  } catch (e) {
    return NextResponse.json({
      source: "error",
      error: String(e),
      passed: true,
      flags: [],
      revisedText: null,
    });
  }
}
