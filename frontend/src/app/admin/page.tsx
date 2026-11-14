"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  PackageCheck,
  Clock,
  Plus,
  RefreshCw,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatSparklineCard from "@/components/admin/StatSparklineCard";
import PipelineStageStrip, {
  type PipelineStageItem,
} from "@/components/admin/PipelineStageStrip";
import BookingTrendChart from "@/components/admin/dashboard/BookingTrendChart";
import BookingStatusChart from "@/components/admin/dashboard/BookingStatusChart";
import PitOperationsCard from "@/components/admin/dashboard/PitOperationsCard";
import BookingCalendarCard from "@/components/admin/dashboard/BookingCalendarCard";
import RecentBookingsCard from "@/components/admin/dashboard/RecentBookingsCard";
import WhatsAppFollowUpModal from "@/components/admin/WhatsAppFollowUpModal";
import AdminCreateBookingModal from "@/components/admin/AdminCreateBookingModal";
import type { WaFollowUpBooking } from "@/lib/whatsapp-followup";
import {
  buildDailyBookingSeries,
  buildBookingStatusDistribution,
  mapBookingsToPits,
  computeStockHealth,
  type BookingStatus,
  type BookingSummary,
  type SparePartSummary,
} from "@/lib/admin-metrics";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBookingStatus(value: unknown): BookingStatus | null {
  if (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "IN_PROGRESS" ||
    value === "DONE" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return null;
}

/**
 * Safely narrows raw API booking rows into strict `BookingSummary` objects
 * without unsafe casts, tolerating nullable database columns.
 */
function parseBookingSummary(item: unknown): BookingSummary | null {
  if (!isRecord(item) || typeof item.id !== "string") return null;

  return {
    id: item.id,
    ticket_no: typeof item.ticket_no === "string" ? item.ticket_no : "",
    nama_customer:
      typeof item.nama_customer === "string" ? item.nama_customer : "-",
    no_hp: typeof item.no_hp === "string" ? item.no_hp : undefined,
    no_telepon:
      typeof item.no_telepon === "string" ? item.no_telepon : undefined,
    plat_kendaraan:
      typeof item.plat_kendaraan === "string" ? item.plat_kendaraan : "-",
    tanggal_booking:
      typeof item.tanggal_booking === "string" ? item.tanggal_booking : "",
    jam_booking: typeof item.jam_booking === "string" ? item.jam_booking : "",
    jenis_servis:
      typeof item.jenis_servis === "string" ? item.jenis_servis : "-",
    tipe_motor:
      typeof item.tipe_motor === "string" ? item.tipe_motor : undefined,
    tipe_booking:
      item.tipe_booking === "SERVIS" || item.tipe_booking === "SPAREPART"
        ? item.tipe_booking
        : undefined,
    status: parseBookingStatus(item.status) ?? "PENDING",
  };
}

/**
 * Executive Dashboard page (`/admin`) composing live KPI sparklines,
 * booking analytics charts, service pipeline strip, pit operations,
 * interactive calendar schedule, and recent queue actions.
 */
export default function AdminDashboardPage() {
  const { token, user, isLoading: authLoading, authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<SparePartSummary>({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });
  const [bookingTotal, setBookingTotal] = useState<number>(0);
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null
  );

  const [today] = useState<Date>(() => new Date());
  const [calendarDate, setCalendarDate] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [waBooking, setWaBooking] = useState<WaFollowUpBooking | null>(null);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState<boolean>(false);

  const handleQuickConfirm = async (id: string) => {
    if (!token) return;
    setUpdatingBookingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const raw: unknown = await res.json().catch(() => null);
      const success = isRecord(raw) && raw.success === true;
      if (res.ok && success) {
        toast.success("Booking berhasil dikonfirmasi!");
        setAllBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CONFIRMED" } : b))
        );
      } else {
        const message =
          isRecord(raw) && typeof raw.message === "string"
            ? raw.message
            : "Gagal mengonfirmasi booking";
        toast.error(message);
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      if (!authLoading) {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      const [resSummary, resBookings] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/summary`, { cache: "no-store" }),
        authFetch(`${API_BASE_URL}/admin/bookings?limit=100`, {
          cache: "no-store",
        }),
      ]);

      const rawSummary: unknown = await resSummary.json().catch(() => null);
      if (
        resSummary.ok &&
        isRecord(rawSummary) &&
        rawSummary.success === true &&
        isRecord(rawSummary.data)
      ) {
        setSummary({
          totalActive:
            typeof rawSummary.data.totalActive === "number"
              ? rawSummary.data.totalActive
              : 0,
          outOfStock:
            typeof rawSummary.data.outOfStock === "number"
              ? rawSummary.data.outOfStock
              : 0,
          totalDiscontinue:
            typeof rawSummary.data.totalDiscontinue === "number"
              ? rawSummary.data.totalDiscontinue
              : 0,
        });
      }

      const rawBookings: unknown = await resBookings.json().catch(() => null);
      if (
        resBookings.ok &&
        isRecord(rawBookings) &&
        rawBookings.success === true &&
        isRecord(rawBookings.data)
      ) {
        const rawList = Array.isArray(rawBookings.data.bookings)
          ? rawBookings.data.bookings
          : [];
        const list = rawList
          .map(parseBookingSummary)
          .filter((b): b is BookingSummary => b !== null);
        setAllBookings(list);
        setBookingTotal(
          typeof rawBookings.data.total === "number"
            ? rawBookings.data.total
            : list.length
        );
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching data:", err);
      toast.error("Gagal memuat ringkasan dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [token, authLoading, authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const daily7 = useMemo(
    () => buildDailyBookingSeries(allBookings, 7, today),
    [allBookings, today]
  );

  const statusDist = useMemo(
    () => buildBookingStatusDistribution(allBookings),
    [allBookings]
  );

  const stockHealth = useMemo(() => computeStockHealth(summary), [summary]);

  const yearNum = calendarDate.getFullYear();
  const monthNum = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const monthPrefix = `${yearNum}-${String(monthNum + 1).padStart(2, "0")}`;
  const selectedDateStr = `${monthPrefix}-${String(selectedDay).padStart(2, "0")}`;

  const daysWithBookings = useMemo(() => {
    const monthBookings = allBookings.filter((b) =>
      b.tanggal_booking?.startsWith(monthPrefix)
    );
    return new Set(
      monthBookings
        .map((b) => parseInt(b.tanggal_booking.slice(0, 10).split("-")[2] ?? "", 10))
        .filter((n) => !Number.isNaN(n))
    );
  }, [allBookings, monthPrefix]);

  const selectedDayBookings = useMemo(
    () =>
      allBookings.filter(
        (b) => b.tanggal_booking?.slice(0, 10) === selectedDateStr
      ),
    [allBookings, selectedDateStr]
  );

  const activePool =
    selectedDayBookings.length > 0
      ? selectedDayBookings
      : allBookings.slice(0, 4);
  const pitList = useMemo(() => mapBookingsToPits(activePool), [activePool]);
  const occupiedPits = pitList.filter((p) => p.booking).length;

  const activeQueueCount =
    statusDist.counts.PENDING +
    statusDist.counts.CONFIRMED +
    statusDist.counts.IN_PROGRESS;

  const pipelineItems: PipelineStageItem[] = [
    {
      key: "PENDING",
      label: "Menunggu Konfirmasi",
      count: statusDist.counts.PENDING,
      subtitle: "Butuh verifikasi admin",
      accentHex: "#F59E0B",
      href: "/admin/bookings?status=PENDING",
    },
    {
      key: "CONFIRMED",
      label: "Terkonfirmasi",
      count: statusDist.counts.CONFIRMED,
      subtitle: "Jadwal pit terkunci",
      accentHex: "#8B5CF6",
      href: "/admin/bookings?status=CONFIRMED",
    },
    {
      key: "IN_PROGRESS",
      label: "Sedang Dikerjakan",
      count: statusDist.counts.IN_PROGRESS,
      subtitle: "Dalam penanganan pit",
      accentHex: "#3B82F6",
      href: "/admin/bookings?status=IN_PROGRESS",
    },
    {
      key: "DONE",
      label: "Servis Selesai",
      count: statusDist.counts.DONE,
      subtitle: "Siap serah terima",
      accentHex: "#10B981",
      href: "/admin/bookings?status=DONE",
    },
  ];

  const displayName = user?.nama || "Admin Operasional";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E4002B]" />
          <span className="text-xs font-semibold text-slate-500">
            Memuat Ringkasan Operasional...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title={`Halo, ${displayName}`}
        subtitle="Ringkasan reservasi pit AHASS 10870 & ketersediaan suku cadang AHM"
        breadcrumb="Dashboard"
        icon={LayoutDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/spare-parts?action=create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#E4002B]" />
              <span className="hidden sm:inline">Tambah Part</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateBookingOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Booking</span>
            </button>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#E4002B]" />
              <span>Antrean Pit</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Row 1: 4 KPI Sparkline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatSparklineCard
              title="Total Booking"
              value={bookingTotal.toLocaleString("id-ID")}
              subtitle={`${allBookings.length} tiket termuat`}
              badgeText="7 Hari"
              badgeTone="crimson"
              accentColor="#E4002B"
              icon={CalendarCheck}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.total,
              }))}
              href="/admin/bookings"
              staggerIndex={0}
            />
            <StatSparklineCard
              title="Tingkat Penyelesaian"
              value={`${statusDist.completionRate}%`}
              subtitle={`${statusDist.counts.DONE} servis selesai`}
              badgeText="Selesai"
              badgeTone="emerald"
              accentColor="#10B981"
              icon={CheckCircle2}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.done,
              }))}
              href="/admin/bookings?status=DONE"
              staggerIndex={1}
            />
            <StatSparklineCard
              title="Antrean Aktif"
              value={activeQueueCount.toLocaleString("id-ID")}
              subtitle={`${statusDist.counts.PENDING} menunggu verifikasi`}
              badgeText="Berjalan"
              badgeTone="amber"
              accentColor="#F59E0B"
              icon={Clock}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.active,
              }))}
              href="/admin/bookings?status=PENDING"
              staggerIndex={2}
            />
            <StatSparklineCard
              title="Suku Cadang Siap Jual"
              value={stockHealth.readyCount.toLocaleString("id-ID")}
              subtitle={`${stockHealth.emptyCount.toLocaleString("id-ID")} stok kosong`}
              badgeText={`${stockHealth.readyPct}% Ready`}
              badgeTone={stockHealth.emptyCount > 0 ? "blue" : "emerald"}
              accentColor="#3B82F6"
              icon={PackageCheck}
              sparklineData={[
                { label: "Total", value: summary.totalActive },
                { label: "Ready", value: stockHealth.readyCount },
                { label: "Empty", value: stockHealth.emptyCount },
                { label: "Disc", value: stockHealth.discontinueCount },
              ]}
              href="/admin/spare-parts?stock_only=true"
              staggerIndex={3}
            />
          </div>

          {/* Row 2: Analytics Grid (Trend Area + Status Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <BookingTrendChart bookings={allBookings} staggerIndex={4} />
            </div>
            <div className="lg:col-span-4">
              <BookingStatusChart distribution={statusDist} staggerIndex={5} />
            </div>
          </div>

          {/* Row 3: Pipeline Stage Strip */}
          <PipelineStageStrip items={pipelineItems} startStaggerIndex={6} />

          {/* Row 4: Pit Operations + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <PitOperationsCard
                pits={pitList}
                occupiedCount={occupiedPits}
                subtitle={
                  selectedDayBookings.length > 0
                    ? `Tanggal ${selectedDay} ${monthName}`
                    : "Kesiapan operasional pit"
                }
                staggerIndex={10}
              />
            </div>
            <div className="lg:col-span-7">
              <BookingCalendarCard
                calendarDate={calendarDate}
                selectedDay={selectedDay}
                today={today}
                daysWithBookings={daysWithBookings}
                selectedDayBookings={selectedDayBookings}
                onChangeMonth={(nextDate) => {
                  setCalendarDate(nextDate);
                  setSelectedDay(1);
                }}
                onSelectDay={setSelectedDay}
                staggerIndex={11}
              />
            </div>
          </div>

          {/* Row 5: Recent Bookings */}
          <RecentBookingsCard
            bookings={allBookings.slice(0, 8)}
            totalCount={bookingTotal}
            updatingId={updatingBookingId}
            onQuickConfirm={handleQuickConfirm}
            onOpenWhatsApp={setWaBooking}
            staggerIndex={12}
          />
        </div>
      </div>

      <WhatsAppFollowUpModal
        booking={waBooking}
        onClose={() => setWaBooking(null)}
        sourceLabel="Dashboard Admin"
      />

      <AdminCreateBookingModal
        isOpen={isCreateBookingOpen}
        onClose={() => setIsCreateBookingOpen(false)}
        onCreated={(created, openWa) => {
          setIsCreateBookingOpen(false);
          fetchDashboardData();
          if (openWa) {
            setWaBooking(created);
          }
        }}
      />
    </div>
  );
}
