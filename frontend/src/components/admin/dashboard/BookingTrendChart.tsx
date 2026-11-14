"use client";

import { useId, useMemo, useState, type CSSProperties } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  buildDailyBookingSeries,
  type BookingSummary,
} from "@/lib/admin-metrics";
import { useTheme } from "@/hooks/useTheme";

export interface BookingTrendChartProps {
  /** Booking list aggregated into daily SERVIS vs SPAREPART trend series. */
  bookings: BookingSummary[];
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type RangeDays = 7 | 14 | 30;

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

const RANGE_OPTIONS: readonly RangeDays[] = [7, 14, 30];

/**
 * Interactive area chart comparing daily service bookings against spare-part
 * reservations across configurable 7, 14, or 30-day trailing windows.
 */
export default function BookingTrendChart({
  bookings,
  staggerIndex = 4,
}: BookingTrendChartProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);
  const { isDark } = useTheme();
  const baseId = useId().replace(/:/g, "");
  const servisGradientId = `${baseId}-servis`;
  const partGradientId = `${baseId}-part`;

  const chartData = useMemo(
    () => buildDailyBookingSeries(bookings, rangeDays),
    [bookings, rangeDays]
  );

  const totalRange = useMemo(
    () => chartData.reduce((acc, point) => acc + point.total, 0),
    [chartData]
  );

  const styleVars: StaggerStyle = { "--stagger-index": staggerIndex };

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Tren Reservasi Harian
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E4002B] border border-red-200/70 dark:border-red-900/50 tabular-nums">
              {totalRange} Tiket
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan booking servis motor vs pengambilan suku cadang
          </p>
        </div>

        <div
          role="group"
          aria-label="Rentang hari tren reservasi"
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700"
        >
          {RANGE_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={rangeDays === days}
              onClick={() => setRangeDays(days)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                rangeDays === days
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {days}H
            </button>
          ))}
        </div>
      </div>

      <div className="h-[235px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id={servisGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E4002B" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#E4002B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={partGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? "#1E293B" : "#E2E8F0"}
              strokeOpacity={0.7}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                color: isDark ? "#F8FAFC" : "#0F172A",
                borderRadius: "12px",
                border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
                boxShadow: isDark
                  ? "0 10px 25px -5px rgba(0,0,0,0.45)"
                  : "0 10px 25px -5px rgba(15,23,42,0.1)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="servis"
              name="Servis Motor"
              stroke="#E4002B"
              strokeWidth={2.2}
              fill={`url(#${servisGradientId})`}
              isAnimationActive={true}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="sparepart"
              name="Suku Cadang"
              stroke="#10B981"
              strokeWidth={2.2}
              fill={`url(#${partGradientId})`}
              isAnimationActive={true}
              animationDuration={850}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E4002B]" />
          Servis Motor (SRV)
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Suku Cadang (PRT)
        </span>
      </div>
    </section>
  );
}
