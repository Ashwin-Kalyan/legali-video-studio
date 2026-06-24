import { NextResponse } from "next/server";
import { igConfigured, fetchInstagramSnapshot } from "@/lib/instagram";

// GET /api/ingest/instagram  -> pulls a live snapshot of your IG account.
// Use this to confirm your token + account id work and to see the real data.

export async function GET() {
  if (!igConfigured()) {
    return NextResponse.json(
      {
        connected: false,
        message:
          "Set IG_ACCESS_TOKEN and IG_USER_ID in .env.local, then restart the dev server.",
      },
      { status: 200 },
    );
  }
  try {
    const snapshot = await fetchInstagramSnapshot(true);
    return NextResponse.json({ connected: true, snapshot });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: String(e) },
      { status: 200 },
    );
  }
}
