/**
 * Pure analytics, calendar, pit-mapping, and stock-health helpers for the admin portal.
 * Kept framework-free and written in strictly erasable TypeScript so Node 24 test runner
 * can execute it directly without a separate transpile step.
 */

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type BookingType = "SERVIS" | "SPAREPART";

export interface BookingSummary {
  id: string;
  ticket_no: string;
  nama_customer: string;
  no_hp?: string;
  no_telepon?: string;
  plat_kendaraan: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  tipe_motor?: string;
  tipe_booking?: BookingType;
  status: BookingStatus;
}

export interface SparePartSummary {
  totalActive: number;
  outOfStock: number;
  totalDiscontinue: number;
}

export interface DailyBookingPoint {
  dateKey: string;
  label: string;
  total: number;
  servis: number;
  sparepart: number;
  done: number;
  active: number;
}

export interface StatusSlice {
  key: BookingStatus;
  label: string;
  value: number;
  color: string;
}

export interface StatusDistribution {
  total: number;
  completionRate: number;
  counts: Record<BookingStatus, number>;
  slices: StatusSlice[];
}

export interface WeeklyDayPoint {
  label: string;
  dateNum: number;
  fullDate: Date;
  dateStr: string;
  count: number;
  isSelected: boolean;
  isToday: boolean;
}

export interface WeeklyVolume {
  days: WeeklyDayPoint[];
  total: number;
  maxCount: number;
}

export interface PitStatusBadge {
  label: string;
  tone: "emerald" | "blue" | "amber";
}

export interface PitSlot {
  code: "P1" | "P2" | "P3" | "P4";
  name: string;
  desc: string;
  booking: BookingSummary | undefined;
  status: PitStatusBadge;
}

export interface StockHealth {
  readyCount: number;
  readyPct: number;
  emptyCount: number;
  discontinueCount: number;
}

/** Formats a local Date instance as YYYY-MM-DD without UTC date shifting. */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSparePartBooking(booking: BookingSummary): boolean {
  return (
    booking.tipe_booking === "SPAREPART" ||
    Boolean(booking.ticket_no?.startsWith("PRT"))
  );
}

/** Aggregates daily booking volume split by SERVIS vs SPAREPART over the trailing N days. */
export function buildDailyBookingSeries(
  bookings: BookingSummary[],
  days: number,
  referenceDate: Date = new Date()
): DailyBookingPoint[] {
  const safeDays = Math.max(1, Number.isFinite(days) ? Math.floor(days) : 1);
  const byDate = new Map<string, BookingSummary[]>();

  for (const b of bookings) {
    if (!b.tanggal_booking) continue;
    const key = b.tanggal_booking.slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(b);
    byDate.set(key, list);
  }

  const points: DailyBookingPoint[] = [];
  for (let offset = safeDays - 1; offset >= 0; offset--) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - offset
    );
    const dateKey = formatLocalDateKey(d);
    const label = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const list = byDate.get(dateKey) ?? [];

    let servis = 0;
    let sparepart = 0;
    let done = 0;
    let active = 0;

    for (const item of list) {
      if (isSparePartBooking(item)) {
        sparepart += 1;
      } else {
        servis += 1;
      }
      if (item.status === "DONE") {
        done += 1;
      } else if (
        item.status === "PENDING" ||
        item.status === "CONFIRMED" ||
        item.status === "IN_PROGRESS"
      ) {
        active += 1;
      }
    }

    points.push({
      dateKey,
      label,
      total: list.length,
      servis,
      sparepart,
      done,
      active,
    });
  }

  return points;
}

/** Computes status counts, donut slices, and completion percentage safely on empty arrays. */
export function buildBookingStatusDistribution(
  bookings: BookingSummary[]
): StatusDistribution {
  const counts: Record<BookingStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELLED: 0,
  };

  for (const b of bookings) {
    if (Object.prototype.hasOwnProperty.call(counts, b.status)) {
      counts[b.status] += 1;
    }
  }

  const total = bookings.length;
  const completionRate =
    total > 0 ? Math.round((counts.DONE / total) * 100) : 0;

  const slices: StatusSlice[] = [
    { key: "DONE", label: "Selesai", value: counts.DONE, color: "#10B981" },
    {
      key: "IN_PROGRESS",
      label: "Dikerjakan",
      value: counts.IN_PROGRESS,
      color: "#3B82F6",
    },
    {
      key: "CONFIRMED",
      label: "Terjadwal",
      value: counts.CONFIRMED,
      color: "#8B5CF6",
    },
    {
      key: "PENDING",
      label: "Menunggu",
      value: counts.PENDING,
      color: "#F59E0B",
    },
    {
      key: "CANCELLED",
      label: "Dibatalkan",
      value: counts.CANCELLED,
      color: "#94A3B8",
    },
  ];

  return { total, completionRate, counts, slices };
}

/** Builds a Monday-to-Sunday weekly volume breakdown anchored around referenceDate. */
export function buildWeeklyVolume(
  bookings: BookingSummary[],
  referenceDate: Date,
  selectedDateStr: string,
  today: Date = new Date()
): WeeklyVolume {
  const dayOfWeek = (referenceDate.getDay() + 6) % 7;
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - dayOfWeek
  );

  const weekLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const countMap = new Map<string, number>();

  for (const b of bookings) {
    if (!b.tanggal_booking) continue;
    const k = b.tanggal_booking.slice(0, 10);
    countMap.set(k, (countMap.get(k) ?? 0) + 1);
  }

  const days: WeeklyDayPoint[] = weekLabels.map((label, idx) => {
    const fullDate = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + idx
    );
    const dateStr = formatLocalDateKey(fullDate);
    const count = countMap.get(dateStr) ?? 0;
    const isToday =
      fullDate.getDate() === today.getDate() &&
      fullDate.getMonth() === today.getMonth() &&
      fullDate.getFullYear() === today.getFullYear();

    return {
      label,
      dateNum: fullDate.getDate(),
      fullDate,
      dateStr,
      count,
      isSelected: dateStr === selectedDateStr,
      isToday,
    };
  });

  const total = days.reduce((acc, d) => acc + d.count, 0);
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return { days, total, maxCount };
}

function resolvePitBadge(booking?: BookingSummary): PitStatusBadge {
  if (!booking) return { label: "Tersedia", tone: "emerald" };
  if (booking.status === "DONE") return { label: "Selesai", tone: "emerald" };
  if (booking.status === "IN_PROGRESS")
    return { label: "Sedang Servis", tone: "blue" };
  return { label: "Terjadwal", tone: "amber" };
}

/** Assigns distinct bookings from activePool across workshop bays P1-P4. */
export function mapBookingsToPits(activePool: BookingSummary[]): PitSlot[] {
  // P1-P3 represent active service bays; exclude DONE/CANCELLED so finished units stay eligible for P4.
  const activeServicePool = activePool.filter(
    (b) => b.status !== "DONE" && b.status !== "CANCELLED"
  );

  const pit1 = activeServicePool.find((b) => {
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      isSparePartBooking(b) || svc.includes("oli") || svc.includes("ringan")
    );
  });

  // Match explicit Pit 2 keywords before Pit 3 so generic SERVIS fallback does not steal heavy repairs.
  const pit2Explicit = activeServicePool.find((b) => {
    if (b.id === pit1?.id) return false;
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      svc.includes("berkala") ||
      svc.includes("tune-up") ||
      svc.includes("paket")
    );
  });

  const pit3 = activeServicePool.find((b) => {
    if (b.id === pit1?.id || b.id === pit2Explicit?.id) return false;
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      svc.includes("cvt") ||
      svc.includes("mesin") ||
      svc.includes("bongkar") ||
      svc.includes("berat")
    );
  });

  const pit2 =
    pit2Explicit ??
    activeServicePool.find(
      (b) =>
        b.id !== pit1?.id &&
        b.id !== pit3?.id &&
        b.tipe_booking === "SERVIS"
    );

  const pit4 = activePool.find(
    (b) =>
      b.id !== pit1?.id &&
      b.id !== pit2?.id &&
      b.id !== pit3?.id &&
      b.status === "DONE"
  );

  const formatDesc = (b: BookingSummary | undefined, fallback: string): string =>
    b
      ? `${b.nama_customer} · ${b.plat_kendaraan || b.tipe_motor || "Motor"} (${b.jam_booking} WIB)`
      : fallback;

  return [
    {
      code: "P1",
      name: "Pit 1 - Fast Pit Express",
      desc: formatDesc(pit1, "Ganti Oli, Busi & Part Ringan (Tanpa Antre)"),
      booking: pit1,
      status: resolvePitBadge(pit1),
    },
    {
      code: "P2",
      name: "Pit 2 - Servis Berkala & Tune-Up",
      desc: formatDesc(pit2, "Kalibrasi Injeksi Honda HIDS & Pembersihan"),
      booking: pit2,
      status: resolvePitBadge(pit2),
    },
    {
      code: "P3",
      name: "Pit 3 - Heavy Repair & Keluhan",
      desc: formatDesc(pit3, "Penanganan Suara CVT, Mesin & Kelistrikan"),
      booking: pit3,
      status: resolvePitBadge(pit3),
    },
    {
      code: "P4",
      name: "Pit 4 - Final Inspection & Cuci",
      desc: pit4
        ? `${pit4.nama_customer} · ${pit4.plat_kendaraan || pit4.tipe_motor || "Motor"} (Siap Serah Terima)`
        : "Uji Jalan & Pemeriksaan Standar Keselamatan",
      booking: pit4,
      status: pit4
        ? { label: "Siap Ambil", tone: "emerald" }
        : { label: "Tersedia", tone: "emerald" },
    },
  ];
}

/** Derives non-negative stock readiness counts and percentage safely when active count is zero. */
export function computeStockHealth(summary: SparePartSummary): StockHealth {
  const totalActive = Math.max(0, summary.totalActive);
  const emptyCount = Math.max(0, summary.outOfStock);
  const readyCount = Math.max(0, totalActive - emptyCount);
  const readyPct =
    totalActive > 0 ? Math.round((readyCount / totalActive) * 100) : 0;

  return {
    readyCount,
    readyPct,
    emptyCount,
    discontinueCount: Math.max(0, summary.totalDiscontinue),
  };
}
