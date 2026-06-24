import { NextResponse } from "next/server";
import { loadMeta, saveMeta, sourcePath } from "@/lib/studio/projectStore";
import { geminiConfigured, uploadVideo, analyzeVideo } from "@/lib/studio/geminiVideo";
import { probeDuration } from "@/lib/studio/video";
import { getBrand } from "@/lib/data";
import type { BrandSlug } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const meta = loadMeta(params.id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!geminiConfigured()) {
    meta.status = "error";
    meta.error = "GEMINI_API_KEY is not set — add it to .env.local";
    saveMeta(meta);
    return NextResponse.json(meta);
  }

  try {
    meta.status = "analyzing";
    saveMeta(meta);

    const dur = await probeDuration(sourcePath(meta));
    if (dur) meta.durationS = dur;

    const brand = getBrand((meta.brandSlug as BrandSlug) ?? "lea") ?? getBrand("lea");
    const file = await uploadVideo(sourcePath(meta), meta.mime);
    const analysis = await analyzeVideo(file, {
      brandName: brand.brandName,
      voiceDescription: brand.voiceDescription,
      toneTags: brand.toneTags,
      targetAudience: brand.targetAudience,
      ctaTemplate: brand.ctaTemplate,
      prohibitedPhrases: brand.prohibitedPhrases,
      traumaInformed: brand.traumaInformed,
    });

    meta.summary = analysis.summary;
    meta.transcript = analysis.transcript;
    meta.candidates = analysis.candidates;
    meta.selected = 0;
    meta.status = "ready";
    meta.error = undefined;
    saveMeta(meta);
    return NextResponse.json(meta);
  } catch (e) {
    meta.status = "error";
    meta.error = String(e);
    saveMeta(meta);
    return NextResponse.json(meta);
  }
}
