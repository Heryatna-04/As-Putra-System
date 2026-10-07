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
    <div className="relative flex flex-col h-full overflow-y-auto bg-gradient-to-b from-[#F2F4F8] via-[#F7F9FC] to-[#EEF2F6] p-5 sm:p-8 font-sans text-zinc-900">
      {/* Ambient 3D Directional Lighting */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[350px] bg-red-500/8 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-blue-500/6 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto w-full space-y-7">
        
        {/* TOP BAR / 3D COCKPIT CONTROL PANEL */}
        <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-white/95 via-white/90 to-zinc-50/80 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.07),0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,1)] flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
          {/* 3D Top Specular Light Line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E4002B] to-transparent opacity-80" />

          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-[#E4002B] text-white shadow-[0_4px_12px_rgba(228,0,43,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-red-400/40">
                AHASS 10870
              </span>
              <span className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
                AS Putra Rahmat Kuningan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              Selamat datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-red-600">{user?.nama || (user?.role === "KEPALA_BENGKEL" ? "Kepala Bengkel" : "Administrator")}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
              Cockpit monitoring operasional suku cadang, rasio inventaris AHM, dan antrean servis kendaraan.
            </p>
          </div>

          {/* 3D SPEEDOMETER DIGITAL CLUSTER */}
          <div className="shrink-0">
            <div className="relative bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 p-[1.5px] rounded-2xl shadow-[0_14px_30px_-6px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-2xl px-5 py-3.5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E4002B] via-red-600 to-red-900 text-white flex items-center justify-center shadow-[0_8px_18px_rgba(228,0,43,0.45),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-400/40 shrink-0">
                  <Clock className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                </div>
                <div>
                  <div className="font-mono text-sm sm:text-base font-black text-red-400 tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.6)] flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>{timeStr || "--:--:--"}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-300 mt-0.5 flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-zinc-400" />
                    <span>{dayName}, {dateStr}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRIC KPI CARDS - 3D TACTILE ELEVATED TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Ready Stock */}
          <Link
            href="/admin/spare-parts"
            className="relative rounded-3xl p-6 bg-gradient-to-b from-white via-white to-zinc-50/70 border border-zinc-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),0_2px_4px_rgba(0,0,0,0.02),inset_0_2px_1px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[0_24px_50px_-10px_rgba(16,185,129,0.2),inset_0_2px_1px_rgba(255,255,255,1)] transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[180px]"
            title="Buka Katalog Suku Cadang"
          >
            {/* Ambient Radial Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl group-hover:bg-emerald-500/30 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                Total Part Ready
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600" />
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-[0_10px_22px_rgba(16,185,129,0.35),inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.25)] border border-emerald-300/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Package className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {summary.totalActive.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-emerald-100/70 text-emerald-800">
                  Ready Stock
                </span>
                <span className="text-xs text-zinc-400 font-medium group-hover:text-emerald-600 transition-colors">Lihat Katalog &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Stok Kosong */}
          <Link
            href="/admin/spare-parts"
            className="relative rounded-3xl p-6 bg-gradient-to-b from-white via-white to-zinc-50/70 border border-zinc-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),0_2px_4px_rgba(0,0,0,0.02),inset_0_2px_1px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[0_24px_50px_-10px_rgba(245,158,11,0.2),inset_0_2px_1px_rgba(255,255,255,1)] transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[180px]"
            title="Buka Data Stok untuk Evaluasi Restock"
          >
            {/* Ambient Radial Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl group-hover:bg-amber-500/30 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-amber-700 transition-colors flex items-center gap-1">
                Perlu Restock
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-amber-600" />
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-white flex items-center justify-center shadow-[0_10px_22px_rgba(245,158,11,0.35),inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.25)] border border-amber-300/40 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <PackageX className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {summary.outOfStock}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-amber-200/80 bg-gradient-to-b from-amber-50 to-amber-100/70 text-amber-800">
                  Perlu Order AHM
                </span>
                <span className="text-xs text-zinc-400 font-medium group-hover:text-amber-600 transition-colors">Stok Menipis</span>
              </div>
            </div>
          </Link>

          {/* KPI 3: Booking Pending Confirmation */}
          <Link
            href="/admin/bookings?status=PENDING"
            className={`relative rounded-3xl p-6 bg-gradient-to-b from-white via-white to-zinc-50/70 border shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),0_2px_4px_rgba(0,0,0,0.02),inset_0_2px_1px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[0_24px_50px_-10px_rgba(59,130,246,0.25),inset_0_2px_1px_rgba(255,255,255,1)] transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[180px] ${
              pendingBookingsCount > 0 ? "border-blue-300 ring-2 ring-blue-400/20" : "border-zinc-200/90"
            }`}
            title="Buka Antrean Booking Servis Pending"
          >
            {/* Ambient Radial Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue-500/15 blur-2xl group-hover:bg-blue-500/35 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                Need Action
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-blue-600" />
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-[0_10px_22px_rgba(59,130,246,0.35),inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.25)] border border-blue-300/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <CalendarDays className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-800 tracking-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {pendingBookingsCount}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-blue-200/80 bg-gradient-to-b from-blue-50 to-blue-100/70 text-blue-800">
                  Pending Booking
                </span>
                <span className="text-xs text-blue-700 font-bold group-hover:underline">Buka Antrean &rarr;</span>
              </div>
            </div>
          </Link>

          {/* KPI 4: Discontinue */}
          <Link
            href="/admin/spare-parts"
            className="relative rounded-3xl p-6 bg-gradient-to-b from-white via-white to-zinc-50/70 border border-zinc-200/90 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),0_2px_4px_rgba(0,0,0,0.02),inset_0_2px_1px_rgba(255,255,255,1)] hover:-translate-y-2 hover:shadow-[0_24px_50px_-10px_rgba(228,0,43,0.2),inset_0_2px_1px_rgba(255,255,255,1)] transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[180px]"
            title="Buka Data Suku Cadang Non-Produksi"
          >
            {/* Ambient Radial Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-red-500/15 blur-2xl group-hover:bg-red-500/30 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#B00020] transition-colors flex items-center gap-1">
                Discontinued
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#B00020]" />
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-[#E4002B] to-red-800 text-white flex items-center justify-center shadow-[0_10px_22px_rgba(228,0,43,0.35),inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.25)] border border-red-300/40 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Archive className="w-6 h-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-[#B00020] tracking-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {summary.totalDiscontinue.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-red-200/80 bg-gradient-to-b from-red-50 to-red-100/70 text-[#B00020]">
                  Non-Produksi
                </span>
                <span className="text-xs text-zinc-400 font-medium group-hover:text-[#B00020] transition-colors">Arsip Part</span>
              </div>
            </div>
          </Link>
        </div>

        {/* 3D CHARTS PANELS: DONUT RATIO & TUBULAR BAR CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Donut Ratio Chart (3D Cylinder Disc) */}
          <div className="lg:col-span-5 relative rounded-3xl p-6 sm:p-7 bg-white border border-zinc-200/90 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">Status Rasio Stok</h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E4002B] bg-red-50 border border-red-200/60 px-3 py-1 rounded-full shadow-2xs">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mb-6">Persentase ketersediaan suku cadang</p>

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
                        contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                        formatter={(val) => [val, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Floating 3D Central Bevel Disc */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-[110px] h-[110px] rounded-full bg-gradient-to-b from-white via-zinc-50 to-zinc-100 shadow-[0_10px_24px_rgba(0,0,0,0.08),inset_0_2px_3px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.05)] border border-zinc-200/80 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-zinc-900 leading-none font-display drop-shadow-2xs">{totalSku.toLocaleString()}</span>
                      <span className="text-[9px] font-extrabold text-zinc-400 mt-1 uppercase tracking-widest">TOTAL SKU</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-4 border-t border-zinc-100">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center gap-3 text-xs font-semibold">
                      <div className="w-3.5 h-3.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.15)] border border-white" style={{ backgroundColor: d.color }}></div>
                      <span className="text-zinc-600 flex-1">{d.name}</span>
                      <span className="font-bold text-zinc-900">{d.value.toLocaleString()}</span>
                      <span className="text-[11px] font-mono font-bold text-zinc-400 w-10 text-right">
                        {totalSku ? Math.round((d.value / totalSku) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Top Categories (3D Tubular Gradient) */}
          <div className="lg:col-span-7 relative rounded-3xl p-6 sm:p-7 bg-white border border-zinc-200/90 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">Top 5 Kategori Spare Part</h3>
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                  Honda AHM <ArrowUpRight className="w-3.5 h-3.5 text-[#E4002B]" />
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mb-6">Berdasarkan volume unit terdaftar di database</p>

              <div className="h-[280px] w-full">
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bar3dGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#CC0025" />
                          <stop offset="60%" stopColor="#E4002B" />
                          <stop offset="100%" stopColor="#FF4D6D" />
                        </linearGradient>
                      </defs>
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
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                        contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '8px 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                        formatter={(val) => [val, "Jumlah Part"]}
                      />
                      <Bar dataKey="count" fill="url(#bar3dGradient)" radius={[0, 8, 8, 0]} barSize={26} />
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

