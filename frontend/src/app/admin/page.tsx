"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
  Calendar,
  Clock,
  Bike,
  MessageSquare,
  Check
} from "lucide-react";
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
  const { token, user } = useAuth();
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
    const message = `Halo Kak *${item.nama_customer}*,\n\nReservasi servis motor Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *No Tiket:* ${item.ticket_no}\n• *Jadwal:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Plat:* ${item.plat_kendaraan}\n• *Paket:* ${item.jenis_servis}\n• *Status:* *DIKONFIRMASI*\n\nSilakan datang tepat waktu ke bengkel kami ya Kak. Terima kasih! 🙏`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleQuickConfirm = async (id: string) => {
    if (!token) return;
    setUpdatingBookingId(id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await fetch(`${baseUrl}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
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
  const [isFilteringBooking, setIsFilteringBooking] = useState(false);

  const fetchBookingsForMonth = async (month: number, year: number) => {
    if (!token) return;
    setIsFilteringBooking(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      // Construct date range
      const monthStr = month.toString().padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      const tanggalFrom = `${year}-${monthStr}-01`;
      const tanggalTo = `${year}-${monthStr}-${lastDay}`;

      const res = await fetch(
        `${baseUrl}/admin/bookings?tanggal_from=${tanggalFrom}&tanggal_to=${tanggalTo}&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const bList: any[] = data.data.bookings || [];
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
    } finally {
      setIsFilteringBooking(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";

        // 1. Summary Spare Parts
        const resSummary = await fetch(`${baseUrl}/admin/summary`, {
          headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

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
    <div className="flex flex-col h-full overflow-y-auto bg-[#F1F3F6] p-4 sm:p-6 lg:p-7 font-sans text-zinc-900">
      <div className="max-w-[1440px] w-full mx-auto space-y-5">

        {/* 1. WELCOME BANNER CARD */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E4002B] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                <Sparkles className="w-3 h-3" /> AHASS 10870 Live Workspace
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
              Hallo, Selamat datang !
            </h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-0.5">
              Selamat pagi {user?.nama || "Admin"}, semangat bekerja melayani pelanggan AHASS.
            </p>
          </div>

          <Link
            href="/admin/import"
            className="relative shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#E4002B] to-[#C90025] hover:from-[#C90025] hover:to-[#B00020] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-[0_4px_14px_rgba(228,0,43,0.3)] hover:shadow-[0_6px_18px_rgba(228,0,43,0.4)] transition-all transform active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Data</span>
          </Link>
        </div>

        {/* 3. ROW 1: STATUS INVENTARIS (KIRI) | BOOKING MERAH KOMPAK (TENGAH) | 3 MINI KPI CARDS (SEBELAH KANAN) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">

          {/* 3A. Status Inventaris (Lg: col-span-3) */}
          <div className="lg:col-span-3 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Status inventaris</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Distribusi ketersediaan stok</p>

              {/* Gauge Semi-Circle */}
              <div className="relative w-full h-[135px] flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height={135}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="88%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={54}
                      outerRadius={78}
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
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    TOTAL
                  </span>
                </div>
              </div>
            </div>

            {/* List Breakdown */}
            <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Part tersedia</span>
                <span className="text-zinc-900 font-bold">
                  {summary.totalActive.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal text-[11px]">{pctReady}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Part kosong</span>
                <span className="text-zinc-900 font-bold">
                  {summary.outOfStock.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal text-[11px]">{pctEmpty}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Discontinue</span>
                <span className="text-zinc-900 font-bold">
                  {summary.totalDiscontinue.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal text-[11px]">{pctDisc}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3B. Booking Kotak Merah Kompak (Lg: col-span-4) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#E4002B] via-[#D50028] to-[#B00020] text-white rounded-3xl p-5 shadow-[0_6px_24px_rgba(228,0,43,0.3)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">Booking</h2>
                  <p className="text-[11px] text-white/80 font-medium">Total booking servis</p>
                </div>

                {/* Interactive Month & Year Selector */}
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white text-[11px] font-bold">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setSelectedMonth(m);
                      fetchBookingsForMonth(m, selectedYear);
                    }}
                    className="bg-transparent text-white font-bold cursor-pointer outline-none [color-scheme:dark]"
                    aria-label="Filter Bulan"
                  >
                    <option value={1} className="bg-zinc-900 text-white">Jan</option>
                    <option value={2} className="bg-zinc-900 text-white">Feb</option>
                    <option value={3} className="bg-zinc-900 text-white">Mar</option>
                    <option value={4} className="bg-zinc-900 text-white">Apr</option>
                    <option value={5} className="bg-zinc-900 text-white">Mei</option>
                    <option value={6} className="bg-zinc-900 text-white">Jun</option>
                    <option value={7} className="bg-zinc-900 text-white">Jul</option>
                    <option value={8} className="bg-zinc-900 text-white">Agu</option>
                    <option value={9} className="bg-zinc-900 text-white">Sep</option>
                    <option value={10} className="bg-zinc-900 text-white">Okt</option>
                    <option value={11} className="bg-zinc-900 text-white">Nov</option>
                    <option value={12} className="bg-zinc-900 text-white">Des</option>
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const y = parseInt(e.target.value, 10);
                      setSelectedYear(y);
                      fetchBookingsForMonth(selectedMonth, y);
                    }}
                    className="bg-transparent text-white font-bold cursor-pointer outline-none [color-scheme:dark]"
                    aria-label="Filter Tahun"
                  >
                    <option value={2025} className="bg-zinc-900 text-white">2025</option>
                    <option value={2026} className="bg-zinc-900 text-white">2026</option>
                    <option value={2027} className="bg-zinc-900 text-white">2027</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                  <div className="text-[11px] font-semibold text-white/80">Selesai</div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 font-display">
                    {bookingStats.done}
                  </div>
                  <div className="text-[10px] text-white/70">booking selesai</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-right">
                  <div className="text-[11px] font-semibold text-white/80">Batal / Tertunda</div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 font-display">
                    {bookingStats.pending}
                  </div>
                  <div className="text-[10px] text-white/70">booking tertunda</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-1">
              <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(Math.max(bookingCompletionPct, 6), 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-white/80 mt-1.5 px-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* 3C. 3 MINI KPI CARDS DI SEBELAH KANAN (Lg: col-span-5) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">

            {/* Total Part Tersedia */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between text-center group">
              <div>
                <h3 className="text-xs font-semibold text-zinc-600">Total Part Tersedia</h3>
                <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight mt-1.5 font-display group-hover:text-[#E4002B] transition-colors">
                  {summary.totalActive.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">SKU tersedia</div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2.5 py-0.5 bg-red-50 text-[#E4002B] text-[10px] font-bold rounded-md border border-red-100 mb-2.5">
                  Tersedia
                </span>
                <Link
                  href="/admin/spare-parts?stock_only=true"
                  className="block w-full py-1.5 bg-[#E4002B] hover:bg-red-700 text-white text-[11px] font-bold rounded-xl transition text-center shadow-xs"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>

            {/* Part Kosong */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between text-center group">
              <div>
                <h3 className="text-xs font-semibold text-zinc-600">Part Kosong</h3>
                <div className="text-xl sm:text-2xl font-extrabold text-[#F97316] tracking-tight mt-1.5 font-display group-hover:text-amber-600 transition-colors">
                  {summary.outOfStock.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">Segera restock</div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md border border-orange-100 mb-2.5">
                  Kosong
                </span>
                <Link
                  href="/admin/spare-parts"
                  className="block w-full py-1.5 bg-[#F97316] hover:bg-orange-600 text-white text-[11px] font-bold rounded-xl transition text-center shadow-xs"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>

            {/* Part Discontinue */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between text-center group">
              <div>
                <h3 className="text-xs font-semibold text-zinc-600">Part Discontinue</h3>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight mt-1.5 font-display">
                  {summary.totalDiscontinue.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">Tidak dijual</div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100 mb-2.5">
                  Discontinue
                </span>
                <Link
                  href="/admin/spare-parts?status=DISCONTINUE"
                  className="block w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition text-center shadow-xs"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* 4. ROW 2: FILE IMPORT PROGRESS (KIRI) | TOP KATEGORI PART (TENGAH) | TAMBAH SPAREPART (KANAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* 4A. Antrean Booking Terkini (Lg: col-span-4) */}
          <div className="lg:col-span-4 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 truncate">
                            {b.nama_customer}
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
                            onClick={() => handleQuickConfirm(b.id)}
                            title="Konfirmasi Booking"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold shadow-sm transition"
                          >
                            <Check className="w-3 h-3" />
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

            <div className="pt-3 mt-3 border-t border-zinc-100">
              <Link
                href="/admin/bookings"
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <span>Buka Jadwal &amp; Slip Mekanik</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 4B. Top Kategori Part (Lg: col-span-5) */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Top Kategori Part</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Berdasarkan jumlah SKU aktif</p>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                  AHM Parts
                </span>
              </div>

              <div className="mt-5 space-y-3.5">
                {categories.length > 0 ? (
                  categories.map((cat, idx) => {
                    const widthPct = Math.max(Math.round((cat.count / maxCategoryCount) * 100), 12);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-bold text-zinc-700 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                        <div className="flex-1 bg-zinc-100 rounded-full h-4 overflow-hidden relative">
                          <div
                            className="bg-[#E4002B] h-full rounded-full transition-all duration-700"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[11px] font-mono font-bold text-zinc-600">
                          {cat.count}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400">
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

          {/* 4C. Tambah Sparepart Big Red CTA (Lg: col-span-3) */}
          <div className="lg:col-span-3">
            <Link
              href="/admin/spare-parts?action=create"
              className="relative overflow-hidden w-full h-full min-h-[200px] bg-gradient-to-br from-[#E4002B] via-[#D50028] to-[#99001B] hover:opacity-95 text-white rounded-3xl p-6 shadow-[0_6px_24px_rgba(228,0,43,0.35)] hover:shadow-[0_10px_30px_rgba(228,0,43,0.45)] transition-all flex flex-col items-center justify-center text-center group active:scale-98"
            >
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md group-hover:scale-110 group-hover:bg-white/30 transition-all flex items-center justify-center mb-3.5 shadow-inner border border-white/25">
                <Plus className="w-9 h-9 text-white stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight drop-shadow-xs">
                Tambah Sparepart
              </span>
              <span className="text-xs text-white/80 font-medium mt-0.5">
                Input master SKU manual
              </span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
