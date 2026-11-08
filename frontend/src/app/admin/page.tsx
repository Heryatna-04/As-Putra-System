"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  PackageCheck,
  AlertTriangle,
  Clock,
  MessageSquare,
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Wrench,
  Sun,
  Moon,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";

interface BookingSummary {
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
  tipe_booking?: "SERVIS" | "SPAREPART";
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
}

export default function AdminDashboardPage() {
  const { token, user, authFetch, logout } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    done: 0,
    pending: 0,
    cancelled: 0,
  });
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Mini Calendar State
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const getWhatsAppLink = (item: BookingSummary) => {
    let cleanPhone = (item.no_hp || item.no_telepon || "").replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    const isPart = item.ticket_no?.startsWith("PRT");
    const label = isPart ? "Suku Cadang" : "Servis Motor";
    const message = `Halo Kak *${item.nama_customer}*,\n\nReservasi *${label}* Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *Kode Booking:* ${item.ticket_no}\n• *Jadwal:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Plat:* ${item.plat_kendaraan || "-"}\n• *Layanan:* ${item.jenis_servis}\n• *Status:* *DIKONFIRMASI*\n\nSilakan datang tepat waktu ke bengkel kami ya Kak. Terima kasih! 🙏`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleQuickConfirm = async (id: string) => {
    if (!token) return;
    setUpdatingBookingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Booking berhasil dikonfirmasi!");
        setAllBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CONFIRMED" } : b))
        );
        setBookingStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
        }));
      } else {
        toast.error(data.message || "Gagal mengonfirmasi booking");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Summary Spare Parts
      const resSummary = await authFetch(`${API_BASE_URL}/admin/summary`, {
        cache: "no-store",
      });
      const dataSummary = await resSummary.json();
      if (resSummary.ok && dataSummary.success) {
        setSummary(dataSummary.data);
      }

      // 2. All Bookings (up to 100 for dynamic calendar, weekly chart, and pit status)
      const resBookings = await authFetch(
        `${API_BASE_URL}/admin/bookings?limit=100`,
        { cache: "no-store" }
      );
      const dataBookings = await resBookings.json();
      if (resBookings.ok && dataBookings.success) {
        const bList: BookingSummary[] = dataBookings.data.bookings || [];
        setAllBookings(bList);
        const done = bList.filter((b) => b.status === "DONE").length;
        const pending = bList.filter(
          (b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
        ).length;
        const cancelled = bList.filter((b) => b.status === "CANCELLED").length;
        setBookingStats({
          total: dataBookings.data.total || bList.length,
          done,
          pending,
          cancelled,
        });
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E4002B]" />
          <span className="text-sm font-semibold text-zinc-500">Memuat Executive Dashboard...</span>
        </div>
      </div>
    );
  }

  // Days in calendar
  const yearNum = calendarDate.getFullYear();
  const monthNum = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
  const firstDayIndex = new Date(yearNum, monthNum, 1).getDay(); // 0 is Sunday

  // Month bookings
  const monthPrefix = `${yearNum}-${(monthNum + 1).toString().padStart(2, "0")}`;
  const monthBookings = allBookings.filter((b) => b.tanggal_booking?.startsWith(monthPrefix));

  // Set of day numbers that have bookings in this month
  const daysWithBookings = new Set(
    monthBookings.map((b) => {
      const parts = b.tanggal_booking.split("-");
      return parseInt(parts[2], 10);
    })
  );

  // Selected date string (YYYY-MM-DD)
  const selectedDateStr = `${monthPrefix}-${selectedDay.toString().padStart(2, "0")}`;
  const selectedDayBookings = allBookings.filter((b) => b.tanggal_booking === selectedDateStr);

  // Recent bookings for bottom table
  const recentBookings = allBookings.slice(0, 8);

  // Weekly Volume calculation (Monday through Sunday) around the calendar/selected date
  const baseDate = new Date(yearNum, monthNum, Math.min(selectedDay, daysInMonth));
  const dayOfWeek = (baseDate.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const mondayDate = new Date(baseDate);
  mondayDate.setDate(baseDate.getDate() - dayOfWeek);

  const weekLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const weeklyData = weekLabels.map((dayLabel, idx) => {
    const curDate = new Date(mondayDate);
    curDate.setDate(mondayDate.getDate() + idx);
    const y = curDate.getFullYear();
    const m = (curDate.getMonth() + 1).toString().padStart(2, "0");
    const d = curDate.getDate().toString().padStart(2, "0");
    const dStr = `${y}-${m}-${d}`;
    const dayCount = allBookings.filter((b) => b.tanggal_booking === dStr).length;
    const isSelected = dStr === selectedDateStr;
    const isToday =
      curDate.getDate() === today.getDate() &&
      curDate.getMonth() === today.getMonth() &&
      curDate.getFullYear() === today.getFullYear();

    return {
      label: dayLabel,
      dateNum: curDate.getDate(),
      fullDate: curDate,
      dateStr: dStr,
      count: dayCount,
      isSelected,
      isToday,
    };
  });

  const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.count, 0);
  const maxWeeklyCount = Math.max(...weeklyData.map((d) => d.count), 1);

  // 4 Pit Operational Mapping based on selected day bookings (or fallback to latest)
  const activePool = selectedDayBookings.length > 0 ? selectedDayBookings : allBookings.slice(0, 4);

  // Pit 1: Fast Pit Express (Sparepart / Ganti Oli / Ringan)
  const pit1Booking = activePool.find(
    (b) =>
      b.tipe_booking === "SPAREPART" ||
      b.ticket_no?.startsWith("PRT") ||
      b.jenis_servis?.toLowerCase().includes("oli") ||
      b.jenis_servis?.toLowerCase().includes("ringan")
  );

  // Pit 2: Servis Berkala & Tune-Up
  const pit2Booking = activePool.find(
    (b) =>
      b.id !== pit1Booking?.id &&
      (b.jenis_servis?.toLowerCase().includes("berkala") ||
        b.jenis_servis?.toLowerCase().includes("tune-up") ||
        b.jenis_servis?.toLowerCase().includes("paket") ||
        b.tipe_booking === "SERVIS")
  );

  // Pit 3: Heavy Repair & Keluhan
  const pit3Booking = activePool.find(
    (b) =>
      b.id !== pit1Booking?.id &&
      b.id !== pit2Booking?.id &&
      (b.jenis_servis?.toLowerCase().includes("cvt") ||
        b.jenis_servis?.toLowerCase().includes("mesin") ||
        b.jenis_servis?.toLowerCase().includes("bongkar") ||
        b.jenis_servis?.toLowerCase().includes("berat"))
  );

  // Pit 4: Final Inspection & Cuci
  const pit4Booking = activePool.find(
    (b) =>
      b.id !== pit1Booking?.id &&
      b.id !== pit2Booking?.id &&
      b.id !== pit3Booking?.id &&
      b.status === "DONE"
  );

  const getPitStatusBadge = (b?: BookingSummary) => {
    if (!b) {
      return {
        label: "Tersedia",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (b.status === "DONE") {
      return {
        label: "Selesai",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (b.status === "IN_PROGRESS") {
      return {
        label: "Sedang Servis",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    return {
      label: "Terjadwal",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  };

  const pitList = [
    {
      code: "P1",
      name: "Pit 1 - Fast Pit Express",
      desc: pit1Booking
        ? `${pit1Booking.nama_customer} · ${pit1Booking.plat_kendaraan || pit1Booking.tipe_motor || "Motor"} (${pit1Booking.jam_booking} WIB)`
        : "Ganti Oli, Busi & Part Ringan (Tanpa Antre)",
      booking: pit1Booking,
      status: getPitStatusBadge(pit1Booking),
    },
    {
      code: "P2",
      name: "Pit 2 - Servis Berkala & Tune-Up",
      desc: pit2Booking
        ? `${pit2Booking.nama_customer} · ${pit2Booking.plat_kendaraan || pit2Booking.tipe_motor || "Motor"} (${pit2Booking.jam_booking} WIB)`
        : "Kalibrasi Injeksi Honda HIDS & Pembersihan",
      booking: pit2Booking,
      status: getPitStatusBadge(pit2Booking),
    },
    {
      code: "P3",
      name: "Pit 3 - Heavy Repair & Keluhan",
      desc: pit3Booking
        ? `${pit3Booking.nama_customer} · ${pit3Booking.plat_kendaraan || pit3Booking.tipe_motor || "Motor"} (${pit3Booking.jam_booking} WIB)`
        : "Penanganan Suara CVT, Mesin & Kelistrikan",
      booking: pit3Booking,
      status: getPitStatusBadge(pit3Booking),
    },
    {
      code: "P4",
      name: "Pit 4 - Final Inspection & Cuci",
      desc: pit4Booking
        ? `${pit4Booking.nama_customer} · ${pit4Booking.plat_kendaraan || pit4Booking.tipe_motor || "Motor"} (Siap Serah Terima)`
        : "Uji Jalan & Pemeriksaan Standar Keselamatan",
      booking: pit4Booking,
      status: pit4Booking
        ? { label: "Siap Ambil", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
        : { label: "Tersedia", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    },
  ];

  const occupiedPits = pitList.filter((p) => p.booking).length;

  const displayRole = user?.role === "ADMIN" || user?.role === "KEPALA_BENGKEL" ? "Executive Owner" : "Admin Operasional";
  const displayName = user?.nama || "Bpk. H. Rahmat (Kepala Bengkel)";

  return (
    <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 pb-8 font-sans text-zinc-900">
      {/* ── TOP EXECUTIVE BREADCRUMB & ACTION BAR ── */}
      <header className="bg-white rounded-2xl md:rounded-3xl border border-zinc-200/80 shadow-xs px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <span>AS Putra Kuningan</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-bold">Ringkasan Eksekutif &amp; Operasional</span>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Light/Dark Toggle Pill */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200/80 text-zinc-500">
            <button
              type="button"
              className="p-1 rounded-full bg-white shadow-2xs text-amber-500 hover:text-amber-600 transition"
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 transition"
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="inline-flex items-center gap-2 bg-[#0B111A] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs border border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E4002B]" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{displayName}</span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* ── ROW 1: WELCOME BANNER (8 COLS) + CLOUD REALTIME SYNC (4 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        {/* Welcome Executive Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl md:rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Tag Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-[#E4002B] border border-red-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {displayRole}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[11px] font-semibold text-zinc-500">
                PT AS PUTRA RAHMAT · AHASS 10870
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mt-3">
              Selamat Datang, {displayName} 👋
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-2xl leading-relaxed">
              Pantau ketersediaan master suku cadang asli AHM, efisiensi 4 pit servis bengkel, dan jadwal kedatangan konsumen secara real-time hari ini.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B111A] hover:bg-[#1a2332] text-white text-xs sm:text-sm font-extrabold shadow-md transition active:scale-95"
            >
              <CalendarDays className="w-4 h-4 text-[#E4002B]" />
              <span>Kelola Antrean Pit</span>
            </Link>

            <Link
              href="/admin/spare-parts?action=create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs sm:text-sm font-bold text-zinc-700 transition"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Spare Part</span>
            </Link>
          </div>
        </div>

        {/* Cloud Realtime Sync Card (ala Right Card di Screenshot) */}
        <div className="lg:col-span-4 bg-[#0B111A] border border-zinc-800 text-white rounded-2xl md:rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Red Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E4002B] via-[#C90025] to-zinc-800" />

          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CLOUD REALTIME SYNC
              </span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">
                Online
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-3">
              Data 44.000+ SKU Terintegrasi
            </h3>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Sistem PostgreSQL Supabase &amp; pg_trgm aktif. Seluruh mutasi stok dan tiket booking tersimpan aman dengan audit trail.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/admin/spare-parts"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E4002B] hover:bg-[#B8001F] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/60 transition active:scale-95"
            >
              Buka Katalog &amp; Stok Sparepart
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 2: STATUS OPERASIONAL HARI INI (3 HORIZONTAL METRIC CARDS) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black tracking-wider uppercase text-zinc-500">
            Status Operasional Hari Ini
          </h2>
          <Link
            href="/admin/spare-parts"
            className="text-xs font-bold text-[#E4002B] hover:underline flex items-center gap-1"
          >
            <span>Kelola Harga &amp; Stok Suku Cadang</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* Card 1: Part Tersedia */}
          <Link
            href="/admin/spare-parts?stock_only=true"
            className="group bg-white rounded-2xl md:rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  Suku Cadang Siap Jual
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">Stok: &gt; 0 Unit</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Total SKU:
                </span>
                <div className="text-lg font-black text-zinc-900 font-mono">
                  {summary.totalActive.toLocaleString("id-ID")}
                  <span className="text-xs text-zinc-400 font-sans font-medium"> SKU</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                +100% HET Resmi
              </span>
            </div>
          </Link>

          {/* Card 2: Part Kosong / Perlu Restock */}
          <Link
            href="/admin/spare-parts"
            className="group bg-white rounded-2xl md:rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-amber-700 transition-colors">
                  Stok Kosong / Kritis
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">Stok: 0 Unit</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Perlu Order:
                </span>
                <div className="text-lg font-black text-amber-600 font-mono">
                  {summary.outOfStock.toLocaleString("id-ID")}
                  <span className="text-xs text-zinc-400 font-sans font-medium"> SKU</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Perlu Restock AHM
              </span>
            </div>
          </Link>

          {/* Card 3: Booking Servis Bulan Ini */}
          <Link
            href="/admin/bookings"
            className="group bg-white rounded-2xl md:rounded-3xl p-5 border border-zinc-200/80 shadow-xs hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#E4002B] transition-colors">
                  Booking Servis Terdaftar
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">Reservasi Bulan Ini</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E4002B] shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Terselesaikan:
                </span>
                <div className="text-lg font-black text-[#E4002B] font-mono">
                  {bookingStats.done}
                  <span className="text-xs text-zinc-400 font-sans font-medium"> / {bookingStats.total}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E4002B] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                +{bookingStats.pending} Menunggu
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── ROW 3: VOLUME MINGGUAN (4 COLS) | 4 PIT OPERASIONAL (4 COLS) | KALENDER & JADWAL (4 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        {/* Left Column: Volume Booking Mingguan (ala Volume Timbangan di Screenshot) */}
        <div className="lg:col-span-4 bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-500">
                  Volume Booking Pit
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{weeklyTotal} Antrean Minggu Ini</span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">
                Mingguan
              </span>
            </div>

            {/* Total Highlight Pill */}
            <div className="my-6 flex justify-end">
              <div className="bg-[#0B111A] text-white px-3 py-1.5 rounded-xl text-xs font-bold font-mono shadow-sm">
                {weeklyTotal} Servis · Minggu Ini
              </div>
            </div>

            {/* Weekly Bars Display */}
            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-4 pb-2 border-b border-zinc-100">
              {weeklyData.map((b) => {
                const barHeight =
                  b.count > 0
                    ? `${Math.max(25, Math.round((b.count / maxWeeklyCount) * 90))}%`
                    : "12%";

                return (
                  <button
                    key={b.label + b.dateStr}
                    type="button"
                    onClick={() => {
                      setCalendarDate(b.fullDate);
                      setSelectedDay(b.dateNum);
                    }}
                    title={`${b.label} (${b.dateStr}): ${b.count} booking`}
                    className="flex flex-col items-center gap-2 h-full justify-end group focus:outline-none"
                  >
                    <span className="text-[9px] font-mono font-bold text-zinc-400 group-hover:text-zinc-700 transition">
                      {b.count > 0 ? b.count : ""}
                    </span>
                    <div
                      className={`w-full max-w-[20px] rounded-full transition-all duration-300 ${
                        b.isSelected
                          ? "bg-[#E4002B] shadow-md shadow-red-900/40"
                          : b.count > 0
                          ? "bg-zinc-700 group-hover:bg-zinc-900"
                          : "bg-zinc-200 group-hover:bg-zinc-300"
                      }`}
                      style={{ height: barHeight }}
                    />
                    <span
                      className={`text-[10px] font-mono transition ${
                        b.isSelected
                          ? "font-black text-[#E4002B]"
                          : "text-zinc-400 group-hover:text-zinc-600"
                      }`}
                    >
                      {b.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>Rata-rata 4-6 pit per hari</span>
            <span className="font-bold text-[#E4002B]">Kapasitas Optimum</span>
          </div>
        </div>

        {/* Center Column: Operasional 4 Pit AHASS (ala Operasional 4 Gudang di Screenshot) */}
        <div className="lg:col-span-4 bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-500">
                  Operasional 4 Pit Servis
                </h3>
                <span className="text-[11px] text-zinc-400">
                  {selectedDayBookings.length > 0 ? `Hari ${selectedDay} ${monthName}` : "Kesiapan operasional pit"}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  occupiedPits > 0
                    ? "text-blue-700 bg-blue-50 border-blue-200"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    occupiedPits > 0 ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                {occupiedPits > 0 ? `${occupiedPits} Pit Terisi` : "Semua Siap Buka"}
              </span>
            </div>

            {/* Pit Items List */}
            <div className="space-y-2.5">
              {pitList.map((pit) => (
                <Link
                  key={pit.code}
                  href="/admin/bookings"
                  className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100 flex items-center justify-between gap-3 hover:bg-zinc-100/70 transition group block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-xs font-black font-mono flex items-center justify-center text-[#E4002B] shrink-0 shadow-2xs">
                      {pit.code}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 truncate">
                        {pit.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {pit.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${pit.status.color}`}
                  >
                    {pit.status.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-400">4 Teknisi Tersertifikasi AHM</span>
            <Link href="/admin/bookings" className="font-bold text-[#E4002B] hover:underline">
              Atur Pit →
            </Link>
          </div>
        </div>

        {/* Right Column: Mini Kalender Interaktif & Jadwal (ala Calendar & Jadwal Kirim Pabrik di Screenshot) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mini Calendar Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 border border-zinc-200/80 shadow-xs">
            {/* Month Header Switcher */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  const prevMonth = new Date(yearNum, monthNum - 1, 1);
                  setCalendarDate(prevMonth);
                  setSelectedDay(1);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                {monthName}
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextMonth = new Date(yearNum, monthNum + 1, 1);
                  setCalendarDate(nextMonth);
                  setSelectedDay(1);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-zinc-400 mb-2">
              <span>M</span>
              <span>S</span>
              <span>S</span>
              <span>R</span>
              <span>K</span>
              <span>J</span>
              <span>S</span>
            </div>

            {/* Day Number Grid */}
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
                    onClick={() => setSelectedDay(day)}
                    className={`relative h-7 w-7 rounded-full text-xs font-semibold mx-auto flex flex-col items-center justify-center transition ${
                      isSelected
                        ? "bg-[#E4002B] text-white font-black shadow-md shadow-red-950/40"
                        : isToday
                        ? "border border-[#E4002B] text-[#E4002B] font-bold hover:bg-red-50"
                        : "text-zinc-700 hover:bg-zinc-100"
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

            {/* Bottom Selected Date */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
              <span>Pilihan:</span>
              <span className="font-bold text-zinc-900 font-mono">
                {selectedDay} {monthName}
              </span>
            </div>
          </div>

          {/* Jadwal Servis Masuk Hari Ini / Tanggal Terpilih */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black tracking-wider uppercase text-zinc-500">
                Jadwal Servis Terpilih
              </h4>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                {selectedDay === today.getDate() &&
                monthNum === today.getMonth() &&
                yearNum === today.getFullYear()
                  ? "Hari Ini"
                  : `${selectedDay} ${calendarDate.toLocaleDateString("id-ID", { month: "short" })}`}
              </span>
            </div>

            {selectedDayBookings.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                {selectedDayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {b.nama_customer}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {b.tipe_motor || "Honda"} · {b.plat_kendaraan}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-700 bg-white px-2 py-1 rounded-md border border-zinc-200 shrink-0">
                      {b.jam_booking} WIB
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-xs text-zinc-400">
                <CalendarDays className="w-6 h-6 mx-auto text-zinc-300 mb-1" />
                <div>Tidak ada jadwal servis</div>
                <span className="text-[10px] text-zinc-400">
                  {selectedDay} {monthName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4: TRANSAKSI & TIKET BOOKING TERBARU ── */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-zinc-900">
              Antrean &amp; Transaksi Servis Terbaru
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tiket reservasi pit servis dan pengambilan suku cadang masuk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
            >
              <span>Buka Semua ({bookingStats.total})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="space-y-2.5">
          {recentBookings.length > 0 ? (
            recentBookings.map((b, idx) => (
              <div
                key={b.id || idx}
                className="p-3.5 rounded-2xl bg-zinc-50/70 border border-zinc-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-zinc-100/70 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-zinc-900 truncate">
                      {b.nama_customer}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${
                        b.ticket_no?.startsWith("PRT")
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {b.ticket_no?.startsWith("PRT") ? "PART" : "PIT SERVIS"}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                      {b.plat_kendaraan}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {b.jam_booking || "--:--"} WIB
                    </span>
                    <span>•</span>
                    <span className="truncate text-zinc-600">{b.jenis_servis}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {(b.no_hp || b.no_telepon) && (
                    <a
                      href={getWhatsAppLink(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Chat WhatsApp Pelanggan"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {b.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={updatingBookingId === b.id}
                      onClick={() => handleQuickConfirm(b.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#B8001F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
                    >
                      {updatingBookingId === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Konfirmasi</span>
                    </button>
                  )}

                  {b.status === "DONE" ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Selesai
                    </span>
                  ) : b.status === "IN_PROGRESS" ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      Dikerjakan
                    </span>
                  ) : b.status === "CONFIRMED" ? (
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      Terjadwal
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Belum ada antrean masuk hari ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
