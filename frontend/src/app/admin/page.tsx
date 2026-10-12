"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Settings,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
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
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

        // 3. Bookings Stats
        const resBookings = await fetch(`${baseUrl}/admin/bookings?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dataBookings = await resBookings.json();
        if (resBookings.ok && dataBookings.success) {
          const bList: any[] = dataBookings.data.bookings || [];
          const done = bList.filter((b) => b.status === "DONE").length;
          const pending = bList.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS").length;
          const cancelled = bList.filter((b) => b.status === "CANCELLED").length;
          setBookingStats({
            total: dataBookings.data.total || bList.length,
            done,
            pending,
            cancelled,
          });
        }

        // 4. Import History
        const resImports = await fetch(`${baseUrl}/admin/imports`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dataImports = await resImports.json();
        if (resImports.ok && dataImports.success && Array.isArray(dataImports.data)) {
          setImportHistory(dataImports.data.slice(0, 2));
        }
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
    { name: "Part Kosong", value: summary.outOfStock || 0, color: "#F97316" },
    { name: "Discontinue", value: summary.totalDiscontinue || 0, color: "#9CA3AF" },
  ];

  // Booking completion percentage
  const bookingCompletionPct = bookingStats.total > 0
    ? Math.round((bookingStats.done / bookingStats.total) * 100)
    : 0;

  // Find max count for relative bar width
  const maxCategoryCount = categories.length > 0
    ? Math.max(...categories.map((c) => c.count))
    : 1;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#E5E7EB]/40 p-4 sm:p-6 lg:p-8 font-sans text-zinc-900">
      <div className="max-w-[1400px] w-full mx-auto space-y-6">

        {/* 1. TOP HEADER BAR: Search input, Notification Pill, Settings */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari data sparepart, booking servis, atau riwayat di dashboard..."
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-zinc-200/80 text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/30 shadow-xs transition"
            />
          </div>

          <Link
            href="/admin/bookings?status=PENDING"
            className="relative p-3 bg-red-50 text-[#E4002B] hover:bg-red-100 rounded-2xl border border-red-100 transition shadow-xs"
            title="Notifikasi Booking"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {bookingStats.pending > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E4002B] rounded-full ring-2 ring-white" />
            )}
          </Link>

          <Link
            href="/admin/spare-parts"
            className="p-3 bg-red-50 text-[#E4002B] hover:bg-red-100 rounded-2xl border border-red-100 transition shadow-xs"
            title="Pengaturan & Master Data"
            aria-label="Pengaturan"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* 2. WELCOME BANNER CARD */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
              Hallo, Selamat datang !
            </h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              Selamat pagi {user?.nama || "Admin"}, semangat bekerja melayani pelanggan AHASS 10870.
            </p>
          </div>

          <Link
            href="/admin/import"
            className="inline-flex items-center justify-center gap-2 bg-[#E4002B] hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-sm hover:shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Data</span>
          </Link>
        </div>

        {/* 3. ROW 1: STATUS INVENTARIS + BOOKING HERO BANNER + 3 MINI KPI CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COL LEFT (Lg 4): Status Inventaris (Semi-Circle Gauge) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Status inventaris</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Distribusi ketersediaan stok sparepart</p>

              {/* Gauge Semi-Circle */}
              <div className="relative w-full h-[160px] flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="90%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={65}
                      outerRadius={95}
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

                {/* Center Value */}
                <div className="absolute bottom-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-none font-display">
                    {totalSku.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    TOTAL
                  </span>
                </div>
              </div>
            </div>

            {/* List Breakdown */}
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Part tersedia</span>
                <span className="text-zinc-900">
                  {summary.totalActive.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctReady}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Part kosong</span>
                <span className="text-zinc-900">
                  {summary.outOfStock.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctEmpty}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Discontinue</span>
                <span className="text-zinc-900">
                  {summary.totalDiscontinue.toLocaleString("id-ID")}{" "}
                  <span className="text-zinc-400 font-normal">({pctDisc}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* COL RIGHT (Lg 8): Booking Hero Card + 3 Mini KPI Cards */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Booking Big Red Card */}
            <div className="bg-[#E4002B] text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Booking</h2>
                    <p className="text-xs text-white/80 font-medium">Total booking servis</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20">
                    <span>Okt</span>
                    <span>2026</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4">
                  <div>
                    <div className="text-xs font-medium text-white/80">Selesai</div>
                    <div className="text-3xl font-extrabold tracking-tight mt-1">
                      {bookingStats.done}
                    </div>
                    <div className="text-[11px] text-white/70 mt-0.5">booking selesai</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-white/80">Pending / Berjalan</div>
                    <div className="text-3xl font-extrabold tracking-tight mt-1">
                      {bookingStats.pending}
                    </div>
                    <div className="text-[11px] text-white/70 mt-0.5">booking tertunda</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(bookingCompletionPct, 5), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-white/80 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* 3 Mini White KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Card 1: Total Part Tersedia */}
              <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs flex flex-col justify-between text-center">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-600">Total Part Tersedia</h3>
                  <div className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-2 font-display">
                    {summary.totalActive.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">SKU tersedia</div>
                </div>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-red-50 text-[#E4002B] text-[11px] font-bold rounded-lg border border-red-100 mb-3">
                    Tersedia
                  </span>
                  <Link
                    href="/admin/spare-parts?stock_only=true"
                    className="block w-full py-2 bg-[#E4002B] hover:bg-red-700 text-white text-xs font-bold rounded-xl transition text-center shadow-xs"
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>

              {/* Card 2: Part Kosong */}
              <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs flex flex-col justify-between text-center">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-600">Part Kosong</h3>
                  <div className="text-2xl font-extrabold text-[#F97316] tracking-tight mt-2 font-display">
                    {summary.outOfStock.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">Segera restock</div>
                </div>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-[11px] font-bold rounded-lg border border-orange-100 mb-3">
                    Kosong
                  </span>
                  <Link
                    href="/admin/spare-parts"
                    className="block w-full py-2 bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition text-center shadow-xs"
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>

              {/* Card 3: Part Discontinue */}
              <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs flex flex-col justify-between text-center">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-600">Part Discontinue</h3>
                  <div className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-2 font-display">
                    {summary.totalDiscontinue.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">Tidak dijual</div>
                </div>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100 mb-3">
                    Discontinue
                  </span>
                  <Link
                    href="/admin/spare-parts?status=DISCONTINUE"
                    className="block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition text-center shadow-xs"
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 4. ROW 2: EXCEL PROGRESS (LEFT) + TOP KATEGORI PART (CENTER) + TAMBAH SPAREPART HERO (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COL LEFT (Lg 4): In Progress / Complete Import Excel Files */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* In Progress Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
              <div className="text-xs font-bold text-zinc-800 mb-3">In Progress</div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-900 truncate">
                    {importHistory.length > 0 ? importHistory[0].file_name : "Bulanan_oktober.xlsx"}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {importHistory.length > 0 ? `${importHistory[0].total_rows || 0} baris` : "12kb"}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E4002B] rounded-full w-2/3" />
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 mt-1 block">In Progress</span>
              </div>
            </div>

            {/* Complete Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-xs">
              <div className="text-xs font-bold text-zinc-800 mb-3">Complete</div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-zinc-900 truncate">
                    {importHistory.length > 1 ? importHistory[1].file_name : "Bulanan_september.xlsx"}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {importHistory.length > 1 ? `${importHistory[1].total_rows || 0} baris` : "25kb"}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-semibold text-emerald-600 mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </span>
              </div>
            </div>

          </div>

          {/* COL CENTER (Lg 5): Top Kategori Part (Horizontal Red Bars) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Top Kategori Part</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Berdasarkan jumlah SKU aktif</p>

              <div className="mt-6 space-y-4">
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
                            className="bg-[#E4002B] h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[11px] font-mono font-bold text-zinc-500">
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

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>Honda Genuine Parts</span>
              <Link href="/admin/spare-parts" className="text-[#E4002B] font-bold hover:underline flex items-center gap-1">
                Katalog Lengkap <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* COL RIGHT (Lg 3): Tambah Sparepart Big Red CTA Button */}
          <div className="lg:col-span-3">
            <Link
              href="/admin/spare-parts?action=create"
              className="w-full h-full min-h-[220px] bg-[#E4002B] hover:bg-red-700 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 group-hover:scale-110 group-hover:bg-white/30 transition-all flex items-center justify-center mb-4">
                <Plus className="w-10 h-10 text-white stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Tambah Sparepart
              </span>
              <span className="text-xs text-white/80 font-medium mt-1">
                Input master SKU manual
              </span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
