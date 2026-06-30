import { StudioGallery } from "./_components/StudioGallery";
import { listProjects } from "@/lib/studio/projectStore";

export const metadata = {
  title: "Video Studio — Legali",
};

export const dynamic = "force-dynamic";

export default function StudioPage() {
  const projects = listProjects();
  return <StudioGallery projects={projects} />;
}
