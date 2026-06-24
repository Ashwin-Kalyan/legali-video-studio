"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  const subs = payload.find((p) => p.dataKey === "subscribers")?.value ?? 0;
  return (
    <div className="min-w-[150px] rounded-lg border border-[#2d2040] bg-[#120f1d]/95 px-3 py-2.5 shadow-card-lg backdrop-blur">
      <div className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <div className="flex items-center justify-between gap-6 text-xs">
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="h-2 w-2 rounded-full bg-[#818cf8]" /> Subscribers
        </span>
        <span className="font-mono font-semibold text-white">
          {formatCompact(subs)}
        </span>
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: KpiPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="subsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} />
              <stop offset="55%" stopColor="#22d3ee" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="subsStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2ddd9" strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
            padding={{ right: 10 }}
            tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            domain={["dataMin - 4000", "dataMax + 4000"]}
            tick={{ fontSize: 11, fill: "#6b6575", fontFamily: "var(--font-mono)" }}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="subscribers"
            stroke="url(#subsStroke)"
            strokeWidth={2.5}
            fill="url(#subsFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
