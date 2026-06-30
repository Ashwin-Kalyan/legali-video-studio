import { NextResponse } from "next/server";
import { instagramEnv, isPublicHttpsUrl } from "@/lib/studio/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tells the publish modal whether real Graph API publishing is ready: are
// server-side credentials configured, and is there a public URL Instagram can
// fetch the video from? No secrets are returned.
export async function GET() {
  const env = instagramEnv();
  return NextResponse.json({
    configured: Boolean(env.accessToken && env.businessId),
    hasPublicUrl: Boolean(env.publicBaseUrl && isPublicHttpsUrl(env.publicBaseUrl)),
  });
}
