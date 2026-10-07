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
    <div className="flex flex-col h-full overflow-y-auto bg-zinc-50 p-5 sm:p-7 font-sans text-zinc-900">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP BAR / GREETING CONTAINER */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4002B]" />
              <span className="text-xs font-semibold text-zinc-500">AHASS 10870 — AS Putra Rahmat</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-display">
              Selamat datang, <span className="text-[#B00020]">{user?.nama || (user?.role === "KEPALA_BENGKEL" ? "Kepala Bengkel" : "Administrator")}</span> 👋
            </h1>
            <p className="text-sm text-zinc-600 mt-0.5">
              Ringkasan operasional inventaris, status suku cadang, dan pemantauan antrean bengkel hari ini.
            </p>
          </div>

          {/* REAL-TIME CLOCK */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 shadow-xs flex items-center gap-3.5 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#E4002B] flex items-center justify-center text-white shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E4002B]" />
                  <span>{timeStr || "--:--:--"}</span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {dayName}, {dateStr}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRIC KPI CARDS - INTERACTIVE SHORTCUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Ready Stock */}
          <Link
            href="/admin/spare-parts"
            className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
            title="Buka Katalog Suku Cadang"
          >
            <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
            <div className="flex items-center justify-between mb-4 pl-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-800 transition-colors flex items-center gap-1">
                Total Part Ready
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="pl-2">
              <div className="text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
                {summary.totalActive.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Ready Stock
                </span>
                <span className="text-xs text-zinc-500">Lihat Katalog &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Stok Kosong */}
          <Link
            href="/admin/spare-parts"
            className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all group"
            title="Buka Data Stok untuk Evaluasi Restock"
          >
            <div className="w-1.5 h-full bg-amber-600 absolute left-0 top-0" />
            <div className="flex items-center justify-between mb-4 pl-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-800 transition-colors flex items-center gap-1">
                Perlu Restock
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-amber-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PackageX className="w-5 h-5" />
              </div>
            </div>
            <div className="pl-2">
              <div className="text-3xl font-extrabold text-amber-700 tracking-tight font-display">
                {summary.outOfStock}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Perlu Order AHM
                </span>
                <span className="text-xs text-zinc-500">Stok Menipis</span>
              </div>
            </div>
          </Link>

          {/* KPI 3: Booking Pending Confirmation */}
          <Link
            href="/admin/bookings?status=PENDING"
            className={`bg-white rounded-2xl p-6 border shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group ${
              pendingBookingsCount > 0 ? "border-blue-300 hover:border-blue-400" : "border-zinc-200 hover:border-zinc-300"
            }`}
            title="Buka Antrean Booking Servis Pending"
          >
            <div className="w-1.5 h-full bg-blue-600 absolute left-0 top-0" />
            <div className="flex items-center justify-between mb-4 pl-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-800 transition-colors flex items-center gap-1">
                Need Action
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-blue-600" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="pl-2">
              <div className="text-3xl font-extrabold text-blue-800 tracking-tight font-display">
                {pendingBookingsCount}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Pending Booking
                </span>
                <span className="text-xs text-blue-700 font-medium">Buka Antrean &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 4: Discontinue */}
          <Link
            href="/admin/spare-parts"
            className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-red-300 hover:shadow-md transition-all group"
            title="Buka Data Suku Cadang Non-Produksi"
          >
            <div className="w-1.5 h-full bg-[#E4002B] absolute left-0 top-0" />
            <div className="flex items-center justify-between mb-4 pl-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-800 transition-colors flex items-center gap-1">
                Discontinued
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#B00020]" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#B00020] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Archive className="w-5 h-5" />
              </div>
            </div>
            <div className="pl-2">
              <div className="text-3xl font-extrabold text-[#B00020] tracking-tight font-display">
                {summary.totalDiscontinue.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-[#B00020] border border-red-200/60">
                  Non-Produksi
                </span>
                <span className="text-xs text-zinc-500">Arsip Part</span>
              </div>
            </div>
          </Link>
        </div>

        {/* MAIN SECTION GRID: DONUT RATIO & TOP CATEGORY BAR CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Donut Ratio Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-slate-800">Status Rasio Stok</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4002B] bg-red-50 px-2.5 py-1 rounded-full">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-6">Persentase ketersediaan suku cadang</p>

              <div className="flex flex-col items-center">
                <div className="relative w-[180px] h-[180px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                        formatter={(val) => [val, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 leading-none font-display">{totalSku.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">TOTAL SKU</span>
                  </div>
                </div>

                <div className="w-full space-y-2.5 pt-3 border-t border-slate-100">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center gap-2.5 text-xs font-semibold">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                      <span className="text-slate-600 flex-1">{d.name}</span>
                      <span className="font-bold text-slate-800">{d.value.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400 w-10 text-right">
                        {totalSku ? Math.round((d.value / totalSku) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Top Categories */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-slate-800">Top 5 Kategori Spare Part</h3>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  Honda AHM <ArrowUpRight className="w-3.5 h-3.5 text-[#E4002B]" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mb-6">Berdasarkan volume unit terdaftar di database</p>

              <div className="h-[270px] w-full">
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                        width={130}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px' }}
                        formatter={(val) => [val, "Jumlah Part"]}
                      />
                      <Bar dataKey="count" fill="#E4002B" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Belum ada data kategori
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
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

