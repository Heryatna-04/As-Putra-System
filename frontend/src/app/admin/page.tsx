"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  Clock,
  MessageSquare,
  Check,
  Loader2,
  PackageCheck,
  AlertTriangle,
  Archive,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

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
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
}

export default function AdminDashboardPage() {
  const { token, user, authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    done: 0,
    pending: 0,
    cancelled: 0,
  });
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const getWhatsAppLink = (item: BookingSummary) => {
    let cleanPhone = (item.no_hp || item.no_telepon || "").replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    const isPart = item.ticket_no?.startsWith("PRT");
    const label = isPart ? "Suku Cadang" : "Servis Motor";
    const message = `Halo Kak *${item.nama_customer}*,\n\nReservasi *${label}* Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *Kode Booking:* ${item.ticket_no}\n• *Jadwal:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Plat:* ${item.plat_kendaraan || '-'}\n• *Layanan:* ${item.jenis_servis}\n• *Status:* *DIKONFIRMASI*\n\nSilakan datang tepat waktu ke bengkel kami ya Kak. Terima kasih! 🙏`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleQuickConfirm = async (id: string) => {
    if (!token) return;
    setUpdatingBookingId(id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Booking berhasil dikonfirmasi!");
        // Update local state
        setRecentBookings((prev) =>
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

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchBookingsForMonth = useCallback(async (month: number, year: number) => {
    if (!token) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      // Construct date range
      const monthStr = month.toString().padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      const tanggalFrom = `${year}-${monthStr}-01`;
      const tanggalTo = `${year}-${monthStr}-${lastDay}`;

      const res = await authFetch(
        `${baseUrl}/admin/bookings?tanggal_from=${tanggalFrom}&tanggal_to=${tanggalTo}&limit=100`,
        {
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const bList: BookingSummary[] = data.data.bookings || [];
        const done = bList.filter((b) => b.status === "DONE").length;
        const pending = bList.filter(
          (b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
        ).length;
        const cancelled = bList.filter((b) => b.status === "CANCELLED").length;
        setBookingStats({
          total: data.data.total || bList.length,
          done,
          pending,
          cancelled,
        });
        setRecentBookings(bList.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching filtered bookings:", err);
    }
  }, [token, authFetch]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";

        // 1. Summary Spare Parts
        const resSummary = await authFetch(`${baseUrl}/admin/summary`, {
          cache: "no-store",
        });
        const dataSummary = await resSummary.json();
        if (resSummary.ok && dataSummary.success) {
          setSummary(dataSummary.data);
        }

        // 2. Categories
        const resCategories = await fetch(`${baseUrl}/spare-parts/categories`, {
          cache: "no-store",
        });
        const dataCategories = await resCategories.json();
        if (resCategories.ok && dataCategories.success) {
          setCategories(dataCategories.data.categories.slice(0, 5));
        }

        // 3. Bookings Initial Load (Current selected month)
        await fetchBookingsForMonth(selectedMonth, selectedYear);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, fetchBookingsForMonth, selectedMonth, selectedYear, authFetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E4002B]" />
          <span className="text-sm font-semibold text-zinc-500">Memuat Dashboard Honda...</span>
        </div>
      </div>
    );
  }

  const totalSku = summary.totalActive + summary.outOfStock + summary.totalDiscontinue;
  const pctReady = totalSku > 0 ? Math.round((summary.totalActive / totalSku) * 100) : 0;
  const pctEmpty = totalSku > 0 ? Math.round((summary.outOfStock / totalSku) * 100) : 0;
  const pctDisc = totalSku > 0 ? Math.round((summary.totalDiscontinue / totalSku) * 100) : 0;

  // Semi-circle gauge data
  const gaugeData = [
    { name: "Part Tersedia", value: summary.totalActive || 1, color: "#E4002B" },
    { name: "Part Kosong", value: summary.outOfStock || 0, color: "#F59E0B" },
    { name: "Discontinue", value: summary.totalDiscontinue || 0, color: "#94A3B8" },
  ];

  // Booking completion percentage
  const bookingCompletionPct = bookingStats.total > 0
    ? Math.round((bookingStats.done / bookingStats.total) * 100)
    : 0;

  const maxCategoryCount = categories.length > 0
    ? Math.max(...categories.map((c) => c.count))
    : 1;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <AdminPageHeader
        title={`Selamat Datang, ${user?.nama || "Admin"}!`}
        subtitle="Pantau operasional bengkel, antrean servis, dan inventaris suku cadang secara real-time."
        breadcrumb="Dashboard"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/spare-parts?action=create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4002B] hover:bg-[#C90025] text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Part</span>
            </Link>
            <Link
              href="/admin/import"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 font-sans text-zinc-900">
        <div className="max-w-[1440px] w-full mx-auto space-y-6">

          {/* 1. TOP KPI STRIP (4 BALANCED CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Part Tersedia */}
          <Link
            href="/admin/spare-parts?stock_only=true"
            className="group bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500">Part Tersedia</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1 font-display group-hover:text-emerald-700 transition-colors">
                  {summary.totalActive.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {pctReady}% Siap Jual
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-0.5">
                Lihat <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Card 2: Part Kosong */}
          <Link
            href="/admin/spare-parts"
            className="group bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500">Stok Kosong</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight mt-1 font-display group-hover:text-amber-700 transition-colors">
                  {summary.outOfStock.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                {pctEmpty}% Butuh Restock
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-0.5">
                Lihat <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Card 3: Part Discontinue */}
          <Link
            href="/admin/spare-parts?status=DISCONTINUE"
            className="group bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500">Part Discontinue</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-700 tracking-tight mt-1 font-display group-hover:text-zinc-900 transition-colors">
                  {summary.totalDiscontinue.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                {pctDisc}% Nonaktif
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-0.5">
                Lihat <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Card 4: Total Booking Bulan Ini */}
          <Link
            href="/admin/bookings"
            className="group bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500">Booking Bulan Ini</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#E4002B] tracking-tight mt-1 font-display">
                  {bookingStats.total}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E4002B] shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {bookingStats.done} Selesai ({bookingCompletionPct}%)
              </span>
              <span className="text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-0.5">
                Kelola <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* 3. MAIN DASHBOARD GRID (7 COLS OPERASIONAL | 5 COLS ANALITIK) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT COLUMN: OPERASIONAL BOOKING & TOP KATEGORI (7 COLS) */}
          <div className="lg:col-span-7 space-y-5">

            {/* Antrean Reservasi Terkini */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Antrean Servis Terkini</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Reservasi masuk terbaru</p>
                </div>
                <Link
                  href="/admin/bookings"
                  className="text-[11px] font-bold text-[#E4002B] hover:underline"
                >
                  Semua ({bookingStats.total})
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100 flex items-center justify-between gap-3 hover:bg-zinc-100/80 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900 truncate">
                            {b.nama_customer}
                          </span>
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${
                            b.ticket_no?.startsWith("PRT")
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}>
                            {b.ticket_no?.startsWith("PRT") ? "PRT" : "SRV"}
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

                      <div className="shrink-0 flex items-center gap-1.5">
                        {(b.no_hp || b.no_telepon) && (
                          <a
                            href={getWhatsAppLink(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat WhatsApp Pelanggan"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {b.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={updatingBookingId === b.id}
                            onClick={() => handleQuickConfirm(b.id)}
                            title="Konfirmasi Booking"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-bold shadow-sm transition"
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
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Selesai
                          </span>
                        ) : b.status === "IN_PROGRESS" ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Dikerjakan
                          </span>
                        ) : b.status === "CONFIRMED" ? (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
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

            <div className="pt-3.5 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500">Operasional Bengkel AHASS</span>
              <Link
                href="/admin/bookings"
                className="text-[#E4002B] hover:underline flex items-center gap-1 group"
              >
                <span>Buka Jadwal &amp; Slip Mekanik</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Top 5 Kategori Part */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Top Kategori Suku Cadang</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Berdasarkan volume SKU aktif</p>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                  AHM Parts
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {categories.length > 0 ? (
                  categories.map((cat, idx) => {
                    const widthPct = Math.max(Math.round((cat.count / maxCategoryCount) * 100), 12);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-24 text-xs font-bold text-zinc-700 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                        <div className="flex-1 bg-zinc-100 rounded-full h-3 overflow-hidden relative">
                          <div
                            className="bg-[#E4002B] h-full rounded-full transition-all duration-700"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-[11px] font-mono font-bold text-zinc-600">
                          {cat.count.toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    Belum ada kategori terdata
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3.5 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>Suku Cadang Asli Honda</span>
              <Link href="/admin/spare-parts" className="text-[#E4002B] font-bold hover:underline flex items-center gap-1 group">
                Katalog Lengkap <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ANALITIK DISTRIBUSI & PERFORMA BOOKING (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Card C: Status Distribusi Inventaris */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
            <div className="pb-3 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Distribusi Stok Inventaris</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Kondisi ketersediaan seluruh suku cadang AHM</p>
            </div>

            {/* Gauge Semi-Circle */}
            <div className="relative w-full h-[140px] flex items-center justify-center mt-3">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="88%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute bottom-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-none font-display">
                  {totalSku.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  TOTAL SKU
                </span>
              </div>
            </div>

            {/* List Breakdown */}
            <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/70 border border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E4002B]" />
                  <span className="text-zinc-700 font-medium">Part Tersedia</span>
                </div>
                <span className="font-bold text-zinc-900">
                  {summary.totalActive.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctReady}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/70 border border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-zinc-700 font-medium">Part Kosong</span>
                </div>
                <span className="font-bold text-amber-700">
                  {summary.outOfStock.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctEmpty}%)</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/70 border border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-zinc-700 font-medium">Discontinue</span>
                </div>
                <span className="font-bold text-zinc-700">
                  {summary.totalDiscontinue.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctDisc}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card D: Performa & Filter Booking */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Performa Booking</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Rasio penyelesaian servis</p>
              </div>

              {/* Filter Bulan & Tahun */}
              <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-xl text-xs font-bold text-zinc-700">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setSelectedMonth(m);
                    fetchBookingsForMonth(m, selectedYear);
                  }}
                  className="bg-transparent cursor-pointer outline-none"
                  aria-label="Filter Bulan"
                >
                  <option value={1}>Jan</option>
                  <option value={2}>Feb</option>
                  <option value={3}>Mar</option>
                  <option value={4}>Apr</option>
                  <option value={5}>Mei</option>
                  <option value={6}>Jun</option>
                  <option value={7}>Jul</option>
                  <option value={8}>Agu</option>
                  <option value={9}>Sep</option>
                  <option value={10}>Okt</option>
                  <option value={11}>Nov</option>
                  <option value={12}>Des</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setSelectedYear(y);
                    fetchBookingsForMonth(selectedMonth, y);
                  }}
                  className="bg-transparent cursor-pointer outline-none"
                  aria-label="Filter Tahun"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* 3 Metric Mini Boxes */}
            <div className="grid grid-cols-3 gap-2.5 my-4">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <div className="text-[11px] font-semibold text-emerald-800">Selesai</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-display mt-0.5">
                  {bookingStats.done}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="text-[11px] font-semibold text-amber-800">Tertunda</div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 font-display mt-0.5">
                  {bookingStats.pending}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-100/70 border border-zinc-200 text-center">
                <div className="text-[11px] font-semibold text-zinc-600">Batal</div>
                <div className="text-xl sm:text-2xl font-black text-zinc-700 font-display mt-0.5">
                  {bookingStats.cancelled}
                </div>
              </div>
            </div>

            {/* Progress Bar Penyelesaian */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-600">Tingkat Penyelesaian</span>
                <span className="font-bold text-zinc-900">{bookingCompletionPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(Math.max(bookingCompletionPct, 4), 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100">
              <Link
                href="/admin/bookings"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95"
              >
                <span>Buka Manajemen Booking</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      </div>
      </div>
    </div>
  );
}
