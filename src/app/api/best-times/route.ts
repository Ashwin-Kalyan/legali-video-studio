import { NextResponse } from "next/server";
import { BEST_TIMES, getBrand } from "@/lib/data";
import type { BestTimeSlot, BrandSlug } from "@/lib/types";
import { geminiConfigured, generateJson } from "@/lib/ai/gemini";

// AI best-time scheduling — ranks optimal posting slots per brand/platform.
// Falls back to the built-in BEST_TIMES table.

export async function POST(req: Request) {
  const {
    brandSlug = "lea",
    platforms = ["instagram", "tiktok"],
  } = await req
    .json()
    .catch(() => ({}) as { brandSlug?: BrandSlug; platforms?: string[] });
  const slug = brandSlug as BrandSlug;
  const fallback = BEST_TIMES[slug] ?? BEST_TIMES.lea;

  if (!geminiConfigured()) {
    return NextResponse.json({ source: "sample", slots: fallback });
  }
  const brand = getBrand(slug);

  try {
    const out = await generateJson<{ slots: BestTimeSlot[] }>({
      temperature: 0.5,
      system:
        "You are a social media scheduling strategist. Given a brand and its target platforms, " +
        "recommend 3 optimal posting time slots based on typical audience-activity patterns for that audience. " +
        "Exactly one slot must be recommended:true.",
      user:
        `Brand: ${brand.brandName} (audience: ${brand.targetAudience}). Platforms: ${platforms.join(", ")}. ` +
        "Return 3 slots, each with time (e.g. '6:00 PM'), label (short reason), and recommended (boolean).",
      schema: {
        type: "object",
        properties: {
          slots: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                label: { type: "string" },
                recommended: { type: "boolean" },
              },
              required: ["time", "label", "recommended"],
            },
          },
        },
        required: ["slots"],
      },
    });
    const slots = out.slots?.length ? out.slots.slice(0, 3) : fallback;
    return NextResponse.json({ source: "gemini", slots });
  } catch (e) {
    return NextResponse.json({ source: "error", error: String(e), slots: fallback });
  }
}
