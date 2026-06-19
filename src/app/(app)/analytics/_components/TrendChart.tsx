"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { KpiPoint } from "@/lib/types";
import { formatCompact } from "@/lib/utils";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const views = payload.find((p) => p.dataKey === "views")?.value ?? 0;
  const eng = payload.find((p) => p.dataKey === "engagements")?.value ?? 0;
  return (
    <div className="min-w-[150px] rounded-lg border border-[#2d2040] bg-[#120f1d]/95 px-3 py-2.5 shadow-card-lg backdrop-blur">
      <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="flex items-center justify-between gap-6 text-xs">
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="h-2 w-2 rounded-full bg-[#a78bfa]" /> Views
        </span>
        <span className="font-mono font-semibold text-white">
          {formatCompact(views)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6 text-xs">
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="h-2 w-2 rounded-full bg-[#f472b6]" /> Engagements
        </span>
        <span className="font-mono font-semibold text-white">
          {formatCompact(eng)}
        </span>
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: KpiPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
              <stop offset="55%" stopColor="#a855f7" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="viewsStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e2ddd9"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "#7c3aed", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="url(#viewsStroke)"
            strokeWidth={2.5}
            fill="url(#viewsFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="engagements"
            stroke="#db2777"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, fill: "#db2777", stroke: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
