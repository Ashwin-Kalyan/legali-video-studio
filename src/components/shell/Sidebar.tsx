"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconScissors,
  IconPalette,
  IconCalendar,
  IconSend,
  IconShieldCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/data/brands";

const NAV = [
  { href: "/analytics", label: "Analytics", icon: IconChartBar },
  { href: "/studio", label: "Video Studio", icon: IconScissors },
  { href: "/brand-kits", label: "Brand Kits", icon: IconPalette },
  { href: "/schedule", label: "Schedule", icon: IconCalendar },
  { href: "/publish", label: "Publish Queue", icon: IconSend },
  { href: "/approvals", label: "Approvals", icon: IconShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[230px] flex-shrink-0 flex-col border-r border-rule bg-surface-2 px-3 py-5">
      <Link href="/analytics" className="mb-6 block px-2.5">
        <div className="font-display text-lg font-bold leading-none tracking-tight">
          Legali
          <span className="text-gradient"> Studio</span>
        </div>
        <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted">
          Video Platform · v1.0
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-secondary hover:bg-surface hover:text-ink",
              )}
            >
              <Icon size={18} stroke={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-rule bg-surface px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-base">
            {CURRENT_USER.emoji}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-ink">
              {CURRENT_USER.name}
            </div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wide text-muted">
              Admin · All brands
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
