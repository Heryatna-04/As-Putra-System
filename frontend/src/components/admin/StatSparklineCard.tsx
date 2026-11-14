"use client";

import { useId, type CSSProperties } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export interface SparklinePoint {
  /** Axis or tooltip label for the data point. */
  label: string;
  /** Numeric value plotted on the sparkline. */
  value: number;
}

export interface StatSparklineCardProps {
  /** Card metric heading. */
  title: string;
  /** Primary KPI figure formatted for display. */
  value: string | number;
  /** Supporting context shown in the card footer. */
  subtitle: string;
  /** Short pill label rendered on the bottom right. */
  badgeText: string;
  /** Semantic color tone for the status badge. */
  badgeTone?: "crimson" | "emerald" | "amber" | "blue" | "slate";
  /** Hex stroke and gradient color for the Recharts area sparkline. */
  accentColor?: string;
  /** Lucide icon displayed in the top-right badge. */
  icon: LucideIcon;
  /** Ordered data points rendered by the mini area chart. */
  sparklineData: SparklinePoint[];
  /** Optional route path; wraps the card in Next.js Link when provided. */
  href?: string;
  /** Optional click callback; renders as a button when provided without href. */
  onClick?: () => void;
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

const BADGE_CLASSES: Record<
  NonNullable<StatSparklineCardProps["badgeTone"]>,
  string
> = {
  crimson:
    "bg-red-50 text-[#E4002B] border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
  slate:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

/**
 * KPI metric card combining a primary numerical figure, a compact Recharts
 * gradient sparkline, and a footer status badge. Supports link or button navigation.
 */
export default function StatSparklineCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeTone = "crimson",
  accentColor = "#E4002B",
  icon: Icon,
  sparklineData,
  href,
  onClick,
  staggerIndex = 0,
}: StatSparklineCardProps) {
  const gradientId = useId().replace(/:/g, "");
  const styleVars: StaggerStyle = {
    "--stagger-index": staggerIndex,
  };

  const content = (
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
            {title}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {value}
            </span>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="h-11 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={sparklineData}
            margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={750}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${BADGE_CLASSES[badgeTone]}`}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );

  const cardClass =
    "block w-full text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300/90 dark:hover:border-slate-700 admin-stagger-item admin-card-interactive";

  if (href) {
    return (
      <Link href={href} className={cardClass} style={styleVars}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClass} cursor-pointer`}
        style={styleVars}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cardClass} style={styleVars}>
      {content}
    </div>
  );
}
