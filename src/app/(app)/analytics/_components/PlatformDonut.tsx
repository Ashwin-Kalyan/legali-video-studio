"use client";

import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";
import type { PlatformSplit } from "@/lib/data";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn } from "@/lib/utils";

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

function ActiveShape(props: unknown) {
  const p = props as ActiveShapeProps;
  return (
    <g>
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={p.outerRadius + 6}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
      />
    </g>
  );
}

export function PlatformDonut({ data }: { data: PlatformSplit[] }) {
  const [active, setActive] = useState<number | null>(null);
  const focused = active !== null ? data[active] : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-2">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="pct"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={80}
              paddingAngle={3}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              activeIndex={active ?? undefined}
              activeShape={ActiveShape}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {data.map((entry) => (
                <Cell key={entry.platform} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl font-bold leading-none text-ink">
            {focused ? `${focused.pct}%` : "100%"}
          </div>
          <div className="mt-1 max-w-[88px] text-center font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
            {focused ? focused.label : "of total views"}
          </div>
        </div>
      </div>

      <ul className="w-full space-y-1">
        {data.map((entry, i) => (
          <li
            key={entry.platform}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors",
              active === i ? "bg-surface-2" : "hover:bg-surface-2",
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
              style={{ background: entry.color }}
            >
              <PlatformIcon platform={entry.platform} size={15} />
            </span>
            <span className="flex-1 text-sm font-medium text-ink">
              {entry.label}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-secondary">
              {entry.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
