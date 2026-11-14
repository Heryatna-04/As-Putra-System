"use client";

import type { CSSProperties } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusDistribution } from "@/lib/admin-metrics";
import { useTheme } from "@/hooks/useTheme";

export interface BookingStatusChartProps {
  /** Aggregated booking status counts, donut slices, and completion rate. */
  distribution: StatusDistribution;
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

interface ChartSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Donut chart card displaying booking completion rate and per-status breakdown.
 * Falls back to a neutral ring when no bookings exist.
 */
export default function BookingStatusChart({
  distribution,
  staggerIndex = 5,
}: BookingStatusChartProps) {
  const { isDark } = useTheme();
  const styleVars: StaggerStyle = { "--stagger-index": staggerIndex };
  const nonZeroSlices: ChartSlice[] = distribution.slices.filter(
    (slice) => slice.value > 0
  );
  const emptySlices: ChartSlice[] = [
    {
      key: "EMPTY",
      label: "Belum ada data",
      value: 1,
      color: isDark ? "#1E293B" : "#E2E8F0",
    },
  ];
  const displaySlices = nonZeroSlices.length > 0 ? nonZeroSlices : emptySlices;

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribusi Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rasio penyelesaian dari {distribution.total} tiket
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50">
          Live
        </span>
      </div>

      <div className="relative h-[165px] w-full min-w-0 my-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={displaySlices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={nonZeroSlices.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive={true}
              animationDuration={800}
            >
              {displaySlices.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            {nonZeroSlices.length > 0 && (
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderRadius: "10px",
                  border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
                  fontSize: "12px",
                }}
                itemStyle={{ color: isDark ? "#E2E8F0" : "#0F172A" }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {distribution.completionRate}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Selesai
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {distribution.slices.map((slice) => (
          <div
            key={slice.key}
            className="flex items-center justify-between text-xs"
          >
            <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              {slice.label}
            </span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {slice.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
