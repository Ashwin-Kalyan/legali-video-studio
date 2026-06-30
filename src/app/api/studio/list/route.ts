import { NextResponse } from "next/server";
import { listProjects } from "@/lib/studio/projectStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Always-fresh list of uploaded projects (the gallery fetches this on mount /
// focus so newly-created projects show up regardless of the router cache).
export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}
