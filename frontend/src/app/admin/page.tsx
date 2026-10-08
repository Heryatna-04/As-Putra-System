"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, PackageX, Archive, RefreshCw, Calendar as CalendarIcon, Clock, ArrowUpRight, ShieldCheck, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
  const [isLoading, setIsLoading] = useState(true);

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const resSummary = await fetch(`${baseUrl}/admin/summary`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dataSummary = await resSummary.json();
        if (resSummary.ok && dataSummary.success) setSummary(dataSummary.data);

        const resCategories = await fetch(`${baseUrl}/spare-parts/categories`, {
          cache: "no-store",
        });
        const dataCategories = await resCategories.json();
        if (resCategories.ok && dataCategories.success) {
          setCategories(dataCategories.data.categories.slice(0, 5));
        }

        // Fetch Pending Bookings count for Executive KPI
        const resPendingBookings = await fetch(`${baseUrl}/admin/bookings?limit=1&status=PENDING`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const dataPendingBookings = await resPendingBookings.json();
        if (resPendingBookings.ok && dataPendingBookings.success) {
          setPendingBookingsCount(dataPendingBookings.data.total || 0);
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
      <div className="flex items-center justify-center min-h-[60vh] bg-zinc-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E4002B]" />
          <span className="text-xs font-semibold text-zinc-500">Memuat Dashboard...</span>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: "Part Aktif", value: summary.totalActive, color: "#16a34a" },
    { name: "Stok Kosong", value: summary.outOfStock, color: "#d97706" },
    { name: "Discontinue", value: summary.totalDiscontinue, color: "#E4002B" },
  ];

  const totalSku = summary.totalActive + summary.outOfStock + summary.totalDiscontinue;

  // Real-Time Calendar Formatters
  const dayName = currentTime ? currentTime.toLocaleDateString("id-ID", { weekday: "long" }) : "";
  const dateStr = currentTime ? currentTime.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
  const timeStr = currentTime ? currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";

  return (
    <div className="relative flex flex-col h-full overflow-y-auto bg-zinc-50 p-5 sm:p-8 font-sans text-zinc-900">
      <div className="max-w-7xl mx-auto w-full space-y-7">
        
        {/* TOP BAR / HEADER CONTROL PANEL */}
        <div className="relative rounded-2xl p-6 sm:p-7 bg-white border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white border border-red-500">
                AHASS 10870
              </span>
              <span className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
                AS Putra Rahmat Kuningan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
              Selamat datang, <span className="text-[#E4002B]">{user?.nama || (user?.role === "KEPALA_BENGKEL" ? "Kepala Bengkel" : "Administrator")}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              Panel monitoring operasional suku cadang, inventaris AHM, dan antrean servis kendaraan.
            </p>
          </div>

          {/* REALTIME CLOCK & DATE */}
          <div className="shrink-0">
            <div className="bg-zinc-900 text-white rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-sm border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-[#E4002B] text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-mono text-sm sm:text-base font-bold text-red-400 tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>{timeStr || "--:--:--"}</span>
                </div>
                <div className="text-xs text-zinc-300 mt-0.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3 text-zinc-400" />
                  <span>{dayName}, {dateStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRIC KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Ready Stock */}
          <Link
            href="/admin/spare-parts"
            className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm hover:shadow-md transition duration-200 group flex flex-col justify-between min-h-[160px]"
            title="Buka Katalog Suku Cadang"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                Total Part Ready
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-emerald-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
                {summary.totalActive.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800">
                  Ready Stock
                </span>
                <span className="text-xs text-zinc-500 font-medium group-hover:text-emerald-600 transition-colors">Lihat Katalog &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Stok Kosong */}
          <Link
            href="/admin/spare-parts"
            className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm hover:shadow-md transition duration-200 group flex flex-col justify-between min-h-[160px]"
            title="Buka Data Stok untuk Evaluasi Restock"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-amber-700 transition-colors flex items-center gap-1">
                Perlu Restock
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-amber-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <PackageX className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-amber-700 tracking-tight font-display">
                {summary.outOfStock}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-amber-200 bg-amber-50 text-amber-800">
                  Perlu Order AHM
                </span>
                <span className="text-xs text-zinc-500 font-medium group-hover:text-amber-600 transition-colors">Stok Menipis</span>
              </div>
            </div>
          </Link>

          {/* KPI 3: Booking Pending Confirmation */}
          <Link
            href="/admin/bookings?status=PENDING"
            className={`rounded-2xl p-6 bg-white border shadow-sm hover:shadow-md transition duration-200 group flex flex-col justify-between min-h-[160px] ${
              pendingBookingsCount > 0 ? "border-blue-300 ring-2 ring-blue-400/20" : "border-zinc-200"
            }`}
            title="Buka Antrean Booking Servis Pending"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                Need Action
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-blue-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-blue-800 tracking-tight font-display">
                {pendingBookingsCount}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-blue-200 bg-blue-50 text-blue-800">
                  Pending Booking
                </span>
                <span className="text-xs text-blue-700 font-bold group-hover:underline">Buka Antrean &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 4: Discontinue */}
          <Link
            href="/admin/spare-parts"
            className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm hover:shadow-md transition duration-200 group flex flex-col justify-between min-h-[160px]"
            title="Buka Data Suku Cadang Non-Produksi"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-red-700 transition-colors flex items-center gap-1">
                Discontinued
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-red-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#B00020] tracking-tight font-display">
                {summary.totalDiscontinue.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-red-200 bg-red-50 text-red-800">
                  Non-Produksi
                </span>
                <span className="text-xs text-zinc-500 font-medium group-hover:text-[#B00020] transition-colors">Arsip Part</span>
              </div>
            </div>
          </Link>
        </div>

        {/* CHARTS PANELS: DONUT RATIO & BAR CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Donut Ratio Chart */}
          <div className="lg:col-span-5 rounded-2xl p-6 sm:p-7 bg-white border border-zinc-200 shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">Status Rasio Stok</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4002B] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-6">Persentase ketersediaan suku cadang</p>

              <div className="flex flex-col items-center">
                <div className="relative w-[210px] h-[210px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={66}
                        outerRadius={92}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(val) => [val, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-[110px] h-[110px] rounded-full bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-zinc-900 leading-none font-display">{totalSku.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">TOTAL SKU</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-4 border-t border-zinc-100">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center gap-3 text-xs font-semibold">
                      <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: d.color }}></div>
                      <span className="text-zinc-600 flex-1">{d.name}</span>
                      <span className="font-bold text-zinc-900">{d.value.toLocaleString()}</span>
                      <span className="text-[11px] font-mono font-bold text-zinc-500 w-10 text-right">
                        {totalSku ? Math.round((d.value / totalSku) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Top Categories */}
          <div className="lg:col-span-7 rounded-2xl p-6 sm:p-7 bg-white border border-zinc-200 shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">Top 5 Kategori Spare Part</h3>
                <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                  Honda AHM <ArrowUpRight className="w-3.5 h-3.5 text-[#E4002B]" />
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-6">Berdasarkan volume unit terdaftar di database</p>

              <div className="h-[280px] w-full">
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                        width={130}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(val) => [val, "Jumlah Part"]}
                      />
                      <Bar dataKey="count" fill="#E4002B" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs font-semibold">
                    Belum ada data kategori
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                Data terhubung langsung ke server Supabase
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

