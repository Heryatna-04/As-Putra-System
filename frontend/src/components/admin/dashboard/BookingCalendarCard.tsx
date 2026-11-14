"use client";

import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Wrench } from "lucide-react";
import type { BookingSummary } from "@/lib/admin-metrics";

export interface BookingCalendarCardProps {
  /** Active month and year displayed in the mini calendar. */
  calendarDate: Date;
  /** Currently selected day of the month (1-31). */
  selectedDay: number;
  /** Reference date for the current local day. */
  today: Date;
  /** Day numbers in the active month that contain one or more bookings. */
  daysWithBookings: Set<number>;
  /** Bookings matching the selected calendar day. */
  selectedDayBookings: BookingSummary[];
  /** Handler invoked when navigating to the previous or next month. */
  onChangeMonth: (nextDate: Date) => void;
  /** Handler invoked when the admin picks a day cell. */
  onSelectDay: (day: number) => void;
  /** Animation stagger index passed to `--stagger-index`. */
  staggerIndex?: number;
}

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

const WEEKDAY_HEADERS: readonly string[] = ["M", "S", "S", "R", "K", "J", "S"];

/**
 * Two-column calendar and schedule card allowing admins to browse monthly
 * booking markers and inspect service slots for any selected date.
 */
export default function BookingCalendarCard({
  calendarDate,
  selectedDay,
  today,
  daysWithBookings,
  selectedDayBookings,
  onChangeMonth,
  onSelectDay,
  staggerIndex = 9,
}: BookingCalendarCardProps) {
  const yearNum = calendarDate.getFullYear();
  const monthNum = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
  const firstDayIndex = new Date(yearNum, monthNum, 1).getDay();
  const styleVars: StaggerStyle = { "--stagger-index": staggerIndex };

  const isSelectedToday =
    selectedDay === today.getDate() &&
    monthNum === today.getMonth() &&
    yearNum === today.getFullYear();

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      {/* Mini Calendar */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => onChangeMonth(new Date(yearNum, monthNum - 1, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              {monthName}
            </span>
            <button
              type="button"
              onClick={() => onChangeMonth(new Date(yearNum, monthNum + 1, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-slate-400 mb-1.5">
            {WEEKDAY_HEADERS.map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const isToday =
                day === today.getDate() &&
                monthNum === today.getMonth() &&
                yearNum === today.getFullYear();
              const hasBooking = daysWithBookings.has(day);

              return (
                <button
                  key={day}
                  type="button"
                  aria-label={`${day} ${monthName}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelectDay(day)}
                  className={`relative h-7 w-7 rounded-full text-xs font-semibold mx-auto flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E4002B] text-white font-black shadow-sm"
                      : isToday
                        ? "border border-[#E4002B] text-[#E4002B] font-bold hover:bg-red-50 dark:hover:bg-red-950/30"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{day}</span>
                  {hasBooking && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#E4002B] absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tanggal dipilih:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {selectedDay} {monthName}
          </span>
        </div>
      </div>

      {/* Selected Day Schedule */}
      <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Jadwal Servis
          </h3>
          <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {isSelectedToday
              ? "Hari Ini"
              : `${selectedDay} ${calendarDate.toLocaleDateString("id-ID", { month: "short" })}`}
          </span>
        </div>

        {selectedDayBookings.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
            {selectedDayBookings.map((b) => (
              <div
                key={b.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#E4002B] border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {b.nama_customer}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {b.tipe_motor || "Honda"}
                      {b.plat_kendaraan ? ` · ${b.plat_kendaraan}` : ""}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                  {b.jam_booking || "--:--"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
            <CalendarDays className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
            <div>Tidak ada jadwal servis</div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {selectedDay} {monthName}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
