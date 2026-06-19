import { notFound } from "next/navigation";
import { BRAND_KITS } from "@/lib/data";
import { OnboardingFlow } from "./_components/OnboardingFlow";

export default function OnboardPage({ params }: { params: { id: string } }) {
  const brand = BRAND_KITS.find(
    (b) => b.slug === params.id || b.id === params.id,
  );
  if (!brand) notFound();
  return <OnboardingFlow brand={brand} />;
}
