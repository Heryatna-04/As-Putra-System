"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Clock,
  MessageSquare,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { BookingStatus, BookingSummary } from "@/lib/admin-metrics";

export interface RecentBookingsCardProps {
  /** Recent booking records displayed in the queue list. */
  bookings: BookingSummary[];
  /** Total booking count displayed in the "Buka Semua" header link. */
  totalCount: number;
  /** ID of the booking currently undergoing a quick-confirm action. */
  updatingId: string | null;
  /** Callback invoked when confirming a `PENDING` booking inline. */
  onQuickConfirm: (id: string) => void;
  /** Callback opening the WhatsApp follow-up composer modal for a booking. */
  onOpenWhatsApp: (item: BookingSummary) => void;
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

interface StatusPillConfig {
  label: string;
  className: string;
}

const STATUS_PILLS: Partial<Record<BookingStatus, StatusPillConfig>> = {
  DONE: {
    label: "Selesai",
    className:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    className:
      "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
  },
  CONFIRMED: {
    label: "Terjadwal",
    className:
      "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className:
      "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  },
};

/**
 * Queue list card displaying recent service and spare-part reservations with
 * inline WhatsApp contact links and one-click confirmation for pending items.
 */
export default function RecentBookingsCard({
  bookings,
  totalCount,
  updatingId,
  onQuickConfirm,
  onOpenWhatsApp,
  staggerIndex = 10,
}: RecentBookingsCardProps) {
  const styleVars: StaggerStyle = { "--stagger-index": staggerIndex };

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            Antrean &amp; Transaksi Servis Terbaru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tiket reservasi pit servis dan pengambilan suku cadang masuk
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
        >
          <span>Buka Semua ({totalCount})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {bookings.length > 0 ? (
          bookings.map((b) => {
            const isSparePart =
              b.tipe_booking === "SPAREPART" ||
              Boolean(b.ticket_no?.startsWith("PRT"));
            const statusPill = STATUS_PILLS[b.status];

            return (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {b.nama_customer}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${
                        isSparePart
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                          : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50"
                      }`}
                    >
                      {isSparePart ? "PART" : "PIT SERVIS"}
                    </span>
                    {b.plat_kendaraan && (
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {b.plat_kendaraan}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.jam_booking || "--:--"} WIB
                    </span>
                    <span>•</span>
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {b.jenis_servis}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {(b.no_hp || b.no_telepon) && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(b)}
                      title="Follow-up WhatsApp Pelanggan"
                      aria-label={`Follow-up WhatsApp ${b.nama_customer}`}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {b.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={updatingId === b.id}
                      onClick={() => onQuickConfirm(b.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#B8001F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {updatingId === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Konfirmasi</span>
                    </button>
                  )}

                  {statusPill && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusPill.className}`}
                    >
                      {statusPill.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada antrean masuk hari ini
          </div>
        )}
      </div>
    </section>
  );
}
