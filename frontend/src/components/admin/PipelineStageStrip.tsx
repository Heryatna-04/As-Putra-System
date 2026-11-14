"use client";

import type { CSSProperties } from "react";
import Link from "next/link";

export interface PipelineStageItem {
  /** Unique identifier for the pipeline stage card. */
  key: string;
  /** Short stage label shown in the card header. */
  label: string;
  /** Numerical count formatted in Indonesian locale. */
  count: number;
  /** Supporting subtitle beneath the primary count. */
  subtitle: string;
  /** Hex accent color for the top border strip and indicator dot. */
  accentHex: string;
  /** Optional navigation href; renders as Next.js Link when provided. */
  href?: string;
  /** Optional click handler; renders as a button when provided without href. */
  onClick?: () => void;
  /** Highlights the card with an active Crimson border ring. */
  isActive?: boolean;
}

export interface PipelineStageStripProps {
  /** Stage summary cards rendered in a responsive 2/4-column grid. */
  items: PipelineStageItem[];
  /** Base animation stagger index incremented across each item. */
  startStaggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

/**
 * Responsive 4-column pipeline stage strip with colored top accent strips,
 * interactive active-state rings, and staggered entrance animations.
 */
export default function PipelineStageStrip({
  items,
  startStaggerIndex = 0,
}: PipelineStageStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, idx) => {
        const styleVars: StaggerStyle = {
          "--stagger-index": startStaggerIndex + idx,
        };

        const inner = (
          <>
            <span
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: item.accentHex }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.accentHex }}
              />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {item.count.toLocaleString("id-ID")}
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {item.subtitle}
            </div>
          </>
        );

        const baseClass = `relative overflow-hidden text-left bg-white dark:bg-[#111827] border rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive ${
          item.isActive
            ? "border-[#E4002B] ring-2 ring-[#E4002B]/15"
            : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        }`;

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`block ${baseClass}`}
              style={styleVars}
            >
              {inner}
            </Link>
          );
        }

        if (item.onClick) {
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              aria-pressed={item.isActive}
              className={`w-full cursor-pointer ${baseClass}`}
              style={styleVars}
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={item.key} className={baseClass} style={styleVars}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
