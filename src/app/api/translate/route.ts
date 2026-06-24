import { NextResponse } from "next/server";
import { LANGUAGES, LANG_CAPTIONS } from "@/lib/data";
import { geminiConfigured, generateJson } from "@/lib/ai/gemini";

// Caption / subtitle translation (PRD captions+subtitles) — translates a single
// string, or an array of timed segments, preserving meaning and length.

function langName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export async function POST(req: Request) {
  const {
    text,
    segments,
    target = "id",
  } = await req.json().catch(
    () => ({}) as { text?: string; segments?: string[]; target?: string },
  );
  const language = langName(target);

  // ---- array of segments ----
  if (Array.isArray(segments)) {
    if (!geminiConfigured() || segments.length === 0) {
      return NextResponse.json({ source: "sample", segments });
    }
    try {
      const out = await generateJson<{ segments: string[] }>({
        temperature: 0.3,
        system: `You are a professional subtitle translator. Translate each subtitle line into ${language}, preserving meaning, tone, and roughly the same length. Keep the array order and count identical.`,
        user: `Translate these ${segments.length} subtitle lines into ${language}:\n${JSON.stringify(segments)}`,
        schema: {
          type: "object",
          properties: { segments: { type: "array", items: { type: "string" } } },
          required: ["segments"],
        },
      });
      const translated =
        out.segments?.length === segments.length ? out.segments : segments;
      return NextResponse.json({ source: "gemini", segments: translated });
    } catch (e) {
      return NextResponse.json({ source: "error", error: String(e), segments });
    }
  }

  // ---- single string ----
  const fallback = LANG_CAPTIONS[target] ?? text ?? "";
  if (!geminiConfigured() || !text) {
    return NextResponse.json({ source: "sample", text: fallback });
  }
  try {
    const out = await generateJson<{ text: string }>({
      temperature: 0.3,
      system: `You are a professional translator. Translate into ${language}, preserving meaning and tone.`,
      user: `Translate this caption into ${language}:\n"${text}"`,
      schema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    });
    return NextResponse.json({ source: "gemini", text: out.text || fallback });
  } catch (e) {
    return NextResponse.json({ source: "error", error: String(e), text: fallback });
  }
}
