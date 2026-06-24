import { NextResponse } from "next/server";
import { getProject, getBrand } from "@/lib/data";
import { geminiConfigured, generateText } from "@/lib/ai/gemini";

// Caption / hook regeneration (PRD §6.4) — re-runs the brand-voiced caption
// prompt for a project. Falls back to the selected candidate's caption.

export async function POST(req: Request) {
  const { projectId } = await req
    .json()
    .catch(() => ({}) as { projectId?: string });
  const project = getProject(projectId ?? "");
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }
  const brand = getBrand(project.brandSlug);
  const fallback =
    project.candidates[project.selectedCandidate]?.caption ??
    project.candidates[0]?.caption ??
    "";

  const transcript = project.transcript.map((s) => s.text).join(" ");
  if (!geminiConfigured() || !transcript) {
    return NextResponse.json({ source: "sample", caption: fallback });
  }

  try {
    const caption = await generateText({
      temperature: 0.85,
      system:
        `You write social captions for ${brand.companyName} in this brand voice: ${brand.voiceDescription}. ` +
        `Tone: ${brand.toneTags.join(", ")}. Audience: ${brand.targetAudience}. ` +
        `Never use: ${brand.prohibitedPhrases.join("; ")}.` +
        (brand.traumaInformed ? " Use trauma-informed, survivor-centered language." : "") +
        ` End with this CTA: "${brand.ctaTemplate}". Return ONLY the caption text, no quotes or preamble.`,
      user:
        `Write a punchy, on-brand caption for a "${project.templateName}" video with this transcript:\n"${transcript}"`,
    });
    return NextResponse.json({ source: "gemini", caption: caption || fallback });
  } catch (e) {
    return NextResponse.json({ source: "error", error: String(e), caption: fallback });
  }
}
