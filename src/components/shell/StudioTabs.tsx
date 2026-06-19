"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconScissors,
  IconBadgeCc,
  IconFileText,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Sub-navigation shared by the three project editor surfaces:
 *   /studio/[id]            → Cut editor
 *   /studio/[id]/captions   → Caption editor
 *   /studio/[id]/subtitles  → Subtitle / transcript editor
 */
export function StudioTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/studio/${projectId}`;
  const tabs = [
    { href: base, label: "Cut Editor", icon: IconScissors, exact: true },
    { href: `${base}/captions`, label: "Captions", icon: IconBadgeCc, exact: false },
    { href: `${base}/subtitles`, label: "Subtitles & Export", icon: IconFileText, exact: false },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-rule bg-surface-2 p-1">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon size={15} stroke={1.75} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
