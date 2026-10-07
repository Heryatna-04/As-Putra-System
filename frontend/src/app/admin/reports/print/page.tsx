"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatIDR } from "@/lib/utils";

interface SparePartSummary {
  totalActive: number;
  outOfStock: number;
  totalDiscontinue: number;
}

interface CategoryCount {
  name: string;
  count: number;
}

interface CriticalPart {
  id: string;
  part_no: string;
  part_name: string;
  category_detail?: string;
  het?: number;
  stok: number;
}

export default function PrintReportPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [summary, setSummary] = useState<SparePartSummary>({ totalActive: 0, outOfStock: 0, totalDiscontinue: 0 });
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [criticalParts, setCriticalParts] = useState<CriticalPart[]>([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, done: 0, pending: 0, confirmed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

      // 1. Summary Spare Parts
      const resSummary = await fetch(`${baseUrl}/admin/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataSummary = await resSummary.json();
      if (resSummary.ok && dataSummary.success) setSummary(dataSummary.data);

      // 2. Categories
      const resCat = await fetch(`${baseUrl}/spare-parts/categories`);
      const dataCat = await resCat.json();
      if (resCat.ok && dataCat.success) setCategories(dataCat.data.categories || []);

      // 3. Critical Low Stock Parts
      const resCritical = await fetch(`${baseUrl}/admin/spare-parts?limit=10&status=ACTIVE&sort=price_desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCritical = await resCritical.json();
      if (resCritical.ok && dataCritical.success) {
        setCriticalParts((dataCritical.data.parts || []).filter((p: CriticalPart) => p.stok <= 2));
      }

      // 4. Bookings Summary
      const resBookings = await fetch(`${baseUrl}/admin/bookings?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataBookings = await resBookings.json();
      if (resBookings.ok && dataBookings.success) {
        const bookings = dataBookings.data.bookings || [];
        const total = dataBookings.data.total || bookings.length;
        const done = bookings.filter((b: { status: string }) => b.status === "DONE").length;
        const pending = bookings.filter((b: { status: string }) => b.status === "PENDING").length;
        const confirmed = bookings.filter((b: { status: string }) => b.status === "CONFIRMED").length;
        setBookingStats({ total, done, pending, confirmed });
      }
    } catch (err) {
      console.error("Gagal memuat data laporan", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentMonthPeriod = new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-10 h-10 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-600">Menyiapkan Dokumen Laporan Eksekutif...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans print:bg-white print:min-h-0 text-zinc-900">
      {/* FLOATING ACTION BAR (Hidden when printing) */}
      <div className="sticky top-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-white px-6 py-3 flex items-center justify-between shadow-lg print:hidden">
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Pratinjau Cetak Laporan Eksekutif AHASS 10870
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E4002B] hover:bg-[#C20026] text-white text-xs font-bold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* PAPER CONTAINER (A4 Style) */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 bg-white p-8 sm:p-12 shadow-xl print:shadow-none border border-zinc-200 print:border-none rounded-2xl print:rounded-none">
        {/* 1. KOP SURAT AHASS RESMI */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#E4002B] text-white font-extrabold text-2xl flex items-center justify-center rounded-xl shrink-0">
                AHASS
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 uppercase">
                  Dealer &amp; AHASS Honda AS Putra Motor
                </h1>
                <p className="text-xs font-semibold text-[#B00020]">
                  No. Reg. Bengkel Resmi: AHASS 10870 — Kabupaten Kuningan
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Jl. Raya Kuningan, Kab. Kuningan, Jawa Barat 45511 | Telp: (0232) 871234 | WA CS: 0812-3456-7890
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 rounded">
                Dokumen Resmi Internal
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">Dicetak: {currentDateStr}</p>
            </div>
          </div>
          <div className="h-0.5 bg-[#E4002B] mt-3" />
        </div>

        {/* 2. JUDUL DOKUMEN */}
        <div className="text-center my-6">
          <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight uppercase underline decoration-[#E4002B] underline-offset-4">
            LAPORAN EKSEKUTIF REKAPITULASI OPERASIONAL &amp; INVENTARIS
          </h2>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            PERIODE LAPORAN: <span className="uppercase text-zinc-900">{currentMonthPeriod}</span>
          </p>
        </div>

        {/* 3. EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-4 gap-4 my-6">
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Part Ready</span>
            <span className="text-xl font-extrabold text-zinc-900 block mt-1">{summary.totalActive}</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Stok Aktif DB</span>
          </div>

          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Perlu Restock</span>
            <span className="text-xl font-extrabold text-amber-900 block mt-1">{summary.outOfStock}</span>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Order AHM</span>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Total Servis</span>
            <span className="text-xl font-extrabold text-blue-900 block mt-1">{bookingStats.total}</span>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Booking Masuk</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Servis Selesai</span>
            <span className="text-xl font-extrabold text-emerald-900 block mt-1">{bookingStats.done}</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Completed</span>
          </div>
        </div>

        {/* 4. SEKSI TABEL DETAIL */}
        <div className="space-y-6 my-8">
          {/* TABEL 1: DISTRIBUSI KATEGORI SUKU CADANG */}
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#E4002B] rounded-full inline-block" />
              1. Distribusi Suku Cadang per Kategori Utama
            </h3>
            <table className="w-full text-left text-xs border border-zinc-200 border-collapse">
              <thead>
                <tr className="bg-zinc-100 font-bold text-zinc-800 border-b border-zinc-200">
                  <th className="py-2 px-3 border-r border-zinc-200 w-12 text-center">No</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Nama Kategori Suku Cadang</th>
                  <th className="py-2 px-3 text-right w-36">Jumlah Varian (SKU)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-3 text-center text-zinc-400 italic">Data kategori tidak tersedia</td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.name} className="even:bg-zinc-50/50">
                      <td className="py-2 px-3 border-r border-zinc-200 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-zinc-200 font-semibold">{cat.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{cat.count.toLocaleString("id-ID")} Item</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABEL 2: PERHATIAN KHUSUS STOK KRITIS */}
          <div>
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-amber-500 rounded-full inline-block" />
              2. Daftar Suku Cadang Kritis / Perlu Pengadaan Segera
            </h3>
            <table className="w-full text-left text-xs border border-zinc-200 border-collapse">
              <thead>
                <tr className="bg-zinc-100 font-bold text-zinc-800 border-b border-zinc-200">
                  <th className="py-2 px-3 border-r border-zinc-200">Part No (AHM)</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Nama Resmi Suku Cadang</th>
                  <th className="py-2 px-3 border-r border-zinc-200">Kategori</th>
                  <th className="py-2 px-3 border-r border-zinc-200 text-right">Harga HET</th>
                  <th className="py-2 px-3 text-center w-24">Sisa Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {criticalParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-emerald-700 font-semibold">Semua persediaan stok aman di atas ambang batas.</td>
                  </tr>
                ) : (
                  criticalParts.map((part) => (
                    <tr key={part.id} className="even:bg-zinc-50/50">
                      <td className="py-2 px-3 border-r border-zinc-200 font-mono font-bold text-[#B00020]">{part.part_no}</td>
                      <td className="py-2 px-3 border-r border-zinc-200 font-semibold">{part.part_name}</td>
                      <td className="py-2 px-3 border-r border-zinc-200 text-zinc-600">{part.category_detail || "—"}</td>
                      <td className="py-2 px-3 border-r border-zinc-200 text-right font-mono">{formatIDR(part.het)}</td>
                      <td className="py-2 px-3 text-center font-bold text-amber-800 bg-amber-50 font-mono">{part.stok} Unit</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. LEMBAR PENGESAHAN KEPALA BENGKEL */}
        <div className="mt-12 pt-6 border-t border-zinc-200 grid grid-cols-2 gap-8 text-xs text-zinc-800">
          <div>
            <p className="font-bold text-zinc-900">Catatan &amp; Evaluasi Kepala Bengkel:</p>
            <div className="mt-2 p-3 border border-zinc-200 rounded-lg min-h-[90px] bg-zinc-50/50 text-zinc-600 text-[11px] leading-relaxed">
              Seluruh operasional servis dan stok persediaan telah disiapkan sesuai dengan standar AHASS Honda. Pengadaan stok kritis agar segera diajukan ke distributor utama AHM.
            </div>
          </div>

          <div className="text-center flex flex-col justify-between h-36">
            <div>
              <p className="text-zinc-600">Kuningan, {currentDateStr}</p>
              <p className="font-bold text-zinc-900 mt-0.5">Mengetahui &amp; Mengesahkan,</p>
              <p className="text-[11px] text-zinc-500">Kepala Bengkel AHASS 10870</p>
            </div>

            <div>
              <p className="font-extrabold text-zinc-900 underline uppercase tracking-wide">
                {user?.nama || "KEPALA BENGKEL AHASS"}
              </p>
              <p className="text-[10px] font-mono text-zinc-500">NIP / ID AHASS: 10870-KB-01</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
