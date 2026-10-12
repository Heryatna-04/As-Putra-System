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
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  Sparkles
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

        {/* 1. TOP HEADER BAR: Search, Notification, Settings */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#E4002B] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari suku cadang, pelanggan booking, atau data gudang..."
              className="w-full pl-12 pr-4 py-3 bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 text-sm font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all"
            />
          </div>

          <Link
            href="/admin/bookings?status=PENDING"
            className="relative p-3 bg-white/95 hover:bg-white text-zinc-700 hover:text-[#E4002B] rounded-2xl border border-zinc-200/80 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md"
            title="Notifikasi Antrean Booking"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {bookingStats.pending > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E4002B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E4002B] ring-2 ring-white"></span>
              </span>
            )}
          </Link>

          <Link
            href="/admin/spare-parts"
            className="p-3 bg-white/95 hover:bg-white text-zinc-700 hover:text-[#E4002B] rounded-2xl border border-zinc-200/80 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md"
            title="Katalog & Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* 2. WELCOME BANNER CARD */}
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
                  <p className="text-[11px] text-white/80 font-medium">Total booking</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-white/20">
                  <span>Okt</span>
                  <span>2026</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
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

          {/* 4A. File Import Cards (Lg: col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-3.5">

            {/* In Progress Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all">
              <div className="text-xs font-bold text-zinc-700 mb-2.5">In Progress</div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E4002B] border border-red-100 flex items-center justify-center shrink-0">
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
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all">
              <div className="text-xs font-bold text-zinc-700 mb-2.5">Complete</div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
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
                <span className="text-[10px] font-semibold text-emerald-700 mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Complete
                </span>
              </div>
            </div>

          </div>

          {/* 4B. Top Kategori Part (Lg: col-span-6) */}
          <div className="lg:col-span-6 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-all">
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
              href="/admin/spare-parts"
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
