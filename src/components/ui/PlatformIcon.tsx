import {
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandLinkedin,
  IconBrandYoutube,
} from "@tabler/icons-react";
import type { Platform } from "@/lib/types";

const ICONS: Record<Platform, typeof IconBrandInstagram> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  linkedin: IconBrandLinkedin,
  youtube: IconBrandYoutube,
};

export function PlatformIcon({
  platform,
  size = 16,
  className,
}: {
  platform: Platform;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[platform];
  return <Icon size={size} className={className} aria-label={platform} />;
}
