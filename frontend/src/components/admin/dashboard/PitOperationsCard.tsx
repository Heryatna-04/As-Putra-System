"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { PitSlot, PitStatusBadge } from "@/lib/admin-metrics";

export interface PitOperationsCardProps {
  /** Workshop service bay assignments (P1-P4) from `mapBookingsToPits`. */
  pits: PitSlot[];
  /** Number of pit bays currently assigned to a booking. */
  occupiedCount: number;
  /** Subtitle describing the active date or operational readiness context. */
  subtitle: string;
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

const BADGE_CLASS: Record<PitStatusBadge["tone"], string> = {
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
};

/**
 * Operational card displaying live slot occupancy across the 4 AHASS service pits.
 */
export default function PitOperationsCard({
  pits,
  occupiedCount,
  subtitle,
  staggerIndex = 8,
}: PitOperationsCardProps) {
  const styleVars: StaggerStyle = { "--stagger-index": staggerIndex };

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Operasional 4 Pit Servis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
              occupiedCount > 0 ? BADGE_CLASS.blue : BADGE_CLASS.emerald
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                occupiedCount > 0
                  ? "bg-blue-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            {occupiedCount > 0 ? `${occupiedCount} Pit Terisi` : "Semua Siap"}
          </span>
        </div>

        <div className="space-y-2.5">
          {pits.map((pit) => (
            <Link
              key={pit.code}
              href="/admin/bookings"
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono flex items-center justify-center text-[#E4002B] shrink-0">
                  {pit.code}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {pit.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {pit.desc}
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${BADGE_CLASS[pit.status.tone]}`}
              >
                {pit.status.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          4 Teknisi Tersertifikasi AHM
        </span>
        <Link
          href="/admin/bookings"
          className="font-bold text-[#E4002B] hover:underline"
        >
          Atur Pit &rarr;
        </Link>
      </div>
    </section>
  );
}
