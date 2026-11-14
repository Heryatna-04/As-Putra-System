"use client";

import { useEffect, useState, useCallback, Suspense, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Mail,
  Bell,
  RotateCcw,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Eye,
  X,
  CheckCircle2,
  CalendarDays,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PipelineStageStrip, {
  type PipelineStageItem,
} from "@/components/admin/PipelineStageStrip";
import ProgressRing from "@/components/admin/ProgressRing";
import WhatsAppFollowUpModal from "@/components/admin/WhatsAppFollowUpModal";
import AdminCreateBookingModal from "@/components/admin/AdminCreateBookingModal";
import type { BookingStatus } from "@/lib/admin-metrics";

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

function isBookingStatus(value: string): value is BookingStatus {
  return (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "IN_PROGRESS" ||
    value === "DONE" ||
    value === "CANCELLED"
  );
}

interface BookingItem {
  part_no: string;
  part_name: string;
  nama_umum?: string | null;
  quantity: number;
  het: number;
  gambar_url?: string | null;
}

interface Booking {
  id: string;
  ticket_no: string;
  nama_customer: string;
  email?: string;
  no_hp: string;
  no_mesin?: string;
  plat_kendaraan?: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  detail_lainnya?: string;
  status: BookingStatus;
  catatan_admin?: string;
  tipe_booking?: "SERVIS" | "SPAREPART";
  items_json?: BookingItem[] | null;
  total_harga?: number;
  metode_layanan?: "AMBIL" | "PASANG";
  created_at: string;
}

function AdminBookingsContent() {
  const { token, authFetch } = useAuth();
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const initialStatus: "ALL" | BookingStatus =
    rawStatus && isBookingStatus(rawStatus) ? rawStatus : "ALL";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SERVIS" | "SPAREPART">("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [waBooking, setWaBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tanggalFrom, setTanggalFrom] = useState("");
  const [tanggalTo, setTanggalTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = Boolean(search || debouncedSearch || tanggalFrom || tanggalTo || statusFilter !== "ALL" || typeFilter !== "ALL");

  const resetAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTanggalFrom("");
    setTanggalTo("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPage(1);
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("tipe_booking", typeFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await authFetch(`${baseUrl}/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBookings(data.data.bookings || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        toast.error(data.message || "Gagal memuat daftar booking");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi server");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, statusFilter, typeFilter, debouncedSearch, tanggalFrom, tanggalTo, authFetch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time polling setiap 30 detik untuk mendeteksi pesanan baru langsung di website
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBookings();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchBookings]);

  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("tipe_booking", typeFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await authFetch(`${baseUrl}/admin/bookings/export?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Gagal mengunduh file Excel");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Booking_AS_Putra_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rekap booking Excel berhasil diunduh!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal export data Excel";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (newStatus === "CANCELLED") {
          toast.success("Status diubah ke Dibatalkan. Stok suku cadang otomatis dikembalikan ke katalog.");
        } else {
          toast.success(`Status diubah menjadi ${newStatus}`);
        }
        fetchBookings();
      } else {
        toast.error(data.message || "Gagal mengubah status booking");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-900/50">
            Pending
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200/90 dark:border-purple-900/50">
            Dikonfirmasi
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/90 dark:border-blue-900/50">
            Dikerjakan
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-900/50">
            Selesai
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Dibatalkan
          </span>
        );
    }
  };

  const doneInView = bookings.filter((b) => b.status === "DONE").length;
  const inProgressInView = bookings.filter((b) => b.status === "IN_PROGRESS").length;
  const confirmedInView = bookings.filter((b) => b.status === "CONFIRMED").length;
  const viewCompletionPct =
    bookings.length > 0 ? Math.round((doneInView / bookings.length) * 100) : 0;

  const bookingStages: PipelineStageItem[] = [
    {
      key: "ALL",
      label: "Semua Reservasi",
      count: total,
      subtitle: "Total seluruh antrean",
      accentHex: "#E4002B",
      isActive: statusFilter === "ALL",
      onClick: () => {
        setStatusFilter("ALL");
        setPage(1);
      },
    },
    {
      key: "PENDING",
      label: "Pending",
      count: pendingCount,
      subtitle: "Di halaman ini",
      accentHex: "#F59E0B",
      isActive: statusFilter === "PENDING",
      onClick: () => {
        setStatusFilter("PENDING");
        setPage(1);
      },
    },
    {
      key: "IN_PROGRESS",
      label: "Dikerjakan / Siap",
      count: confirmedInView + inProgressInView,
      subtitle: `${confirmedInView} terjadwal · ${inProgressInView} proses`,
      accentHex: "#3B82F6",
      isActive: statusFilter === "IN_PROGRESS",
      onClick: () => {
        setStatusFilter("IN_PROGRESS");
        setPage(1);
      },
    },
    {
      key: "DONE",
      label: "Selesai",
      count: doneInView,
      subtitle: "Di halaman ini",
      accentHex: "#10B981",
      isActive: statusFilter === "DONE",
      onClick: () => {
        setStatusFilter("DONE");
        setPage(1);
      },
    },
  ];

  const ringCardStyle: StaggerStyle = { "--stagger-index": 4 };
  const tableCardStyle: StaggerStyle = { "--stagger-index": 5 };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Manajemen Booking & Reservasi"
        subtitle={`${total} total reservasi · antrean servis & suku cadang Honda`}
        breadcrumb="Booking Servis"
        icon={CalendarDays}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Input Booking</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
              {isExporting ? "Mengunduh..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={() => fetchBookings()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Pipeline Quick Filter Strip + Completion Ring */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-9">
              <PipelineStageStrip items={bookingStages} startStaggerIndex={0} />
            </div>
            <div
              className="xl:col-span-3 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 admin-stagger-item"
              style={ringCardStyle}
            >
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Penyelesaian View
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {doneInView} / {bookings.length} Tiket
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Rasio selesai halaman aktif
                </p>
              </div>
              <ProgressRing
                percentage={viewCompletionPct}
                size={60}
                strokeWidth={6}
                color="#10B981"
                label="Tingkat Selesai"
              />
            </div>
          </div>

          {/* Tipe Booking Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              Semua Reservasi
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("SERVIS");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "SERVIS"
                  ? "bg-[#E4002B] text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Wrench size={13} />
              <span>Servis Motor (SRV)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("SPAREPART");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "SPAREPART"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <ShoppingBag size={13} />
              <span>Suku Cadang (PRT)</span>
            </button>
          </div>

          {/* Notifikasi Booking Baru */}
          {pendingCount > 0 && (
            <div className="relative bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/50 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 border border-amber-400">
                  <Bell size={14} />
                </div>
                <span>
                  <strong>Ada {pendingCount} antrean booking baru (Pending)</strong> yang menunggu verifikasi bukti akun customer dan konfirmasi jadwal.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("PENDING");
                  setPage(1);
                }}
                className="shrink-0 text-xs font-bold text-amber-900 dark:text-amber-200 hover:text-amber-950 dark:hover:text-white px-3 py-1.5 rounded-xl bg-amber-200/70 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-800 shadow-2xs transition cursor-pointer"
              >
                Lihat Pending &rarr;
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket, nama customer, no mesin, atau plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase">Dari:</span>
                <input
                  type="date"
                  value={tanggalFrom}
                  onChange={(e) => {
                    setTanggalFrom(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase">Sampai:</span>
                <input
                  type="date"
                  value={tanggalTo}
                  onChange={(e) => {
                    setTanggalTo(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === "ALL" || isBookingStatus(next)) {
                      setStatusFilter(next);
                      setPage(1);
                    }
                  }}
                  className="text-xs font-semibold bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Dikonfirmasi</option>
                  <option value="IN_PROGRESS">Dikerjakan</option>
                  <option value="DONE">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#E4002B] dark:hover:text-red-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition cursor-pointer"
                  title="Reset Semua Filter"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div
            style={tableCardStyle}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-4">Tiket &amp; Customer</th>
                    <th className="px-4 py-4">Tipe Booking</th>
                    <th className="px-4 py-4">Identitas / Detail</th>
                    <th className="px-4 py-4">Jadwal &amp; Metode</th>
                    <th className="px-4 py-4">Layanan / Suku Cadang</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                        Memuat data booking...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                            <Search size={20} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tidak ada reservasi ditemukan</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Coba sesuaikan kata kunci pencarian, filter tipe booking, atau rentang tanggal.
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={resetAllFilters}
                              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                            >
                              <RotateCcw size={12} /> Reset Filter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((item) => {
                      const isPart = item.tipe_booking === "SPAREPART";
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <span
                              className={`font-bold font-mono text-xs border px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xs mb-1.5 ${
                                isPart
                                  ? "text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
                                  : "text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50"
                              }`}
                            >
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  isPart
                                    ? "bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200"
                                    : "bg-blue-200/80 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {isPart ? "PRT" : "SRV"}
                              </span>
                              <span>{item.ticket_no}</span>
                            </span>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{item.nama_customer}</div>
                            {item.email ? (
                              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1" title="Akun Gmail Bukti Customer">
                                <Mail size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{item.email}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">Email tidak tercatat</div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold">{item.no_hp}</span>
                              <button
                                type="button"
                                onClick={() => setWaBooking(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-2xs cursor-pointer"
                                title="Follow-up WhatsApp ke pemesan"
                              >
                                <MessageSquare size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Chat WA</span>
                              </button>
                            </div>
                          </td>

                          {/* Tipe Booking Badge */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isPart ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                                <ShoppingBag size={12} className="text-emerald-700 dark:text-emerald-400" />
                                <span>Suku Cadang</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                                <Wrench size={12} className="text-blue-700 dark:text-blue-400" />
                                <span>Servis Motor</span>
                              </span>
                            )}
                          </td>

                          {/* Identitas / Detail */}
                          <td className="px-4 py-4">
                            {isPart ? (
                              <div>
                                <span className="inline-block text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {item.tipe_motor || "Motor Honda"}
                                </span>
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                                  Metode:{" "}
                                  <strong className={item.metode_layanan === "PASANG" ? "text-blue-700 dark:text-blue-400" : "text-emerald-700 dark:text-emerald-400"}>
                                    {item.metode_layanan === "PASANG" ? "Pasang di Bengkel" : "Ambil di Kasir"}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 inline-block font-mono shadow-2xs">
                                  {item.plat_kendaraan || "-"}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                                  Mesin: <span className="font-bold text-slate-800 dark:text-slate-200">{item.no_mesin || "-"}</span>
                                </div>
                                {item.tipe_motor && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.tipe_motor}</div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Jadwal */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Clock size={13} className={isPart ? "text-emerald-600 dark:text-emerald-400" : "text-[#E4002B]"} /> {item.jam_booking} WIB
                            </div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                              {item.tanggal_booking}
                            </div>
                          </td>

                          {/* Layanan / Part */}
                          <td className="px-4 py-4 max-w-xs">
                            {isPart && Array.isArray(item.items_json) && item.items_json.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                                    {item.items_json.length} jenis
                                  </span>
                                  {item.total_harga ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                                      Rp {Number(item.total_harga).toLocaleString("id-ID")}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">
                                  {item.items_json.map((it) => `${it.part_name} (${it.quantity}x)`).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                  {item.jenis_servis}
                                </span>
                                {item.detail_lainnya && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed" title={item.detail_lainnya}>
                                    Ket: {item.detail_lainnya}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status)}
                          </td>

                          {/* Aksi & Ubah Status */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(item)}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
                                title="Lihat detail lengkap"
                              >
                                <Eye size={14} />
                              </button>

                              <select
                                disabled={updatingId === item.id}
                                value={item.status}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  if (isBookingStatus(next)) {
                                    handleUpdateStatus(item.id, next);
                                  }
                                }}
                                className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] shadow-2xs disabled:opacity-50 cursor-pointer"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Konfirmasi</option>
                                <option value="IN_PROGRESS">{isPart ? "Disiapkan" : "Proses Servis"}</option>
                                <option value="DONE">Selesai</option>
                                <option value="CANCELLED">Batalkan</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Halaman <strong className="text-slate-700 dark:text-slate-200">{page}</strong> dari{" "}
                  <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong> (Total {total} booking)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 flex items-center justify-between text-white ${
              selectedBooking.tipe_booking === "SPAREPART"
                ? "bg-gradient-to-r from-emerald-600 to-teal-800"
                : "bg-gradient-to-r from-[#E4002B] to-[#99001C]"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  {selectedBooking.tipe_booking === "SPAREPART" ? <ShoppingBag size={18} /> : <Wrench size={18} />}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
                    {selectedBooking.tipe_booking === "SPAREPART" ? "Booking Suku Cadang (PRT)" : "Booking Servis Motor (SRV)"}
                  </span>
                  <h3 className="font-mono font-bold text-lg leading-tight mt-0.5">
                    {selectedBooking.ticket_no}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Status Reservasi:</span>
                <div>{getStatusBadge(selectedBooking.status)}</div>
              </div>

              {/* Data Customer */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Data Pelanggan</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Nama Pemesan</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{selectedBooking.nama_customer}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">No. WhatsApp</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{selectedBooking.no_hp}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block">Email / Akun Bukti</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedBooking.email || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Data Kendaraan / Layanan */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {selectedBooking.tipe_booking === "SPAREPART" ? "Informasi Pengambilan" : "Identitas Kendaraan"}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Jadwal Kedatangan</span>
                    <strong className="text-slate-900 dark:text-white">{selectedBooking.tanggal_booking} ({selectedBooking.jam_booking} WIB)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      {selectedBooking.tipe_booking === "SPAREPART" ? "Metode Layanan" : "Plat Nomor"}
                    </span>
                    <strong className="text-slate-900 dark:text-white">
                      {selectedBooking.tipe_booking === "SPAREPART"
                        ? (selectedBooking.metode_layanan === "PASANG" ? "Pasang di Bengkel" : "Ambil di Toko / Kasir")
                        : (selectedBooking.plat_kendaraan || "-")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Tipe Motor Honda</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedBooking.tipe_motor || "-"}</span>
                  </div>
                  {selectedBooking.tipe_booking !== "SPAREPART" && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Nomor Mesin</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{selectedBooking.no_mesin || "-"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Suku Cadang atau Servis */}
              {selectedBooking.tipe_booking === "SPAREPART" ? (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100/80 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span>Daftar Suku Cadang yang Dipesan</span>
                    {selectedBooking.items_json && (
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        {selectedBooking.items_json.length} item
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 p-3 bg-white dark:bg-slate-900/50 space-y-2">
                    {Array.isArray(selectedBooking.items_json) && selectedBooking.items_json.length > 0 ? (
                      selectedBooking.items_json.map((it) => (
                        <div key={it.part_no} className="flex items-center justify-between py-1.5 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{it.part_name}</div>
                            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{it.part_no} &bull; {it.quantity} pcs</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-700 dark:text-emerald-400">
                              Rp {(it.het * it.quantity).toLocaleString("id-ID")}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">@ Rp {it.het.toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-600 dark:text-slate-400 py-2">{selectedBooking.jenis_servis}</div>
                    )}
                  </div>
                  {selectedBooking.total_harga ? (
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Estimasi Biaya:</span>
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp {Number(selectedBooking.total_harga).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : null}

                  {/* Stock Guarantee Notice */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Stok dipotong otomatis oleh sistem</span>
                    </span>
                    {selectedBooking.status === "CANCELLED" && (
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-1.5 py-0.5 rounded">
                        Stok dikembalikan ke katalog
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block mb-1">Paket Layanan Servis:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedBooking.jenis_servis}</div>
                </div>
              )}

              {/* Catatan Customer */}
              {selectedBooking.detail_lainnya && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-950 dark:text-amber-200">
                  <span className="font-bold block mb-0.5">Catatan Customer:</span>
                  <p className="leading-relaxed">{selectedBooking.detail_lainnya}</p>
                </div>
              )}

              {/* Catatan Admin */}
              {selectedBooking.catatan_admin && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-bold block mb-0.5">Catatan Internal Admin:</span>
                  <p className="leading-relaxed">{selectedBooking.catatan_admin}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setWaBooking(selectedBooking)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Kirim WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Ubah:</span>
                <select
                  disabled={updatingId === selectedBooking.id}
                  value={selectedBooking.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!isBookingStatus(next)) return;
                    handleUpdateStatus(selectedBooking.id, next);
                    setSelectedBooking((prev) =>
                      prev ? { ...prev, status: next } : null
                    );
                  }}
                  className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] shadow-2xs cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Konfirmasi</option>
                  <option value="IN_PROGRESS">{selectedBooking.tipe_booking === "SPAREPART" ? "Disiapkan" : "Proses Servis"}</option>
                  <option value="DONE">Selesai</option>
                  <option value="CANCELLED">Batalkan</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <WhatsAppFollowUpModal
        booking={waBooking}
        onClose={() => setWaBooking(null)}
        sourceLabel="Antrean Booking"
      />

      <AdminCreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(created, openWa) => {
          setIsCreateOpen(false);
          setPage(1);
          fetchBookings();
          if (openWa) {
            setWaBooking({
              ...created,
              no_hp: created.no_hp,
            });
          }
        }}
      />
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
          Memuat antrean booking servis...
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
