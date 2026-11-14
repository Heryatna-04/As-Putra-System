"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Phone,
  Clock,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Wrench,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import WhatsAppFollowUpModal from "@/components/admin/WhatsAppFollowUpModal";
import type { WaFollowUpItem } from "@/lib/whatsapp-followup";

interface BookingCRM {
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
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  catatan_admin?: string;
  tipe_booking?: "SERVIS" | "SPAREPART";
  items_json?: WaFollowUpItem[] | null;
  total_harga?: number;
  metode_layanan?: "AMBIL" | "PASANG";
  created_at: string;
}

export default function CrmBookingsPage() {
  const { token, authFetch } = useAuth();
  const [bookings, setBookings] = useState<BookingCRM[]>([]);
  const [waBooking, setWaBooking] = useState<BookingCRM | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SERVIS" | "SPAREPART">("ALL");
  const [tanggalFrom, setTanggalFrom] = useState("");
  const [tanggalTo, setTanggalTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCrmBookings = useCallback(async () => {
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

      const res = await authFetch(`${baseUrl}/crm/bookings?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBookings(data.data.bookings || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        toast.error(data.message || "Gagal mengambil data booking CRM");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala jaringan server");
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, page, limit, statusFilter, typeFilter, debouncedSearch, tanggalFrom, tanggalTo]);

  useEffect(() => {
    fetchCrmBookings();
  }, [fetchCrmBookings]);

  const handleExportExcelCrm = async () => {
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

      const res = await authFetch(`${baseUrl}/crm/bookings/export?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Gagal mengunduh file Excel CRM");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Booking_CRM_AS_Putra_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rekap booking CRM berhasil diexport!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal export data Excel CRM");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: BookingCRM["status"]) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/70">Pending</span>;
      case "CONFIRMED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/70">Dikonfirmasi</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/70">Dikerjakan</span>;
      case "DONE":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/70">Selesai</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">Batal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner CRM */}
      <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm overflow-hidden transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
              Data Monitoring Booking Customer
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-emerald-600 border border-emerald-500 px-3 py-1 rounded-full">
              <MessageSquare size={12} /> Follow-up CRM Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Data kontak dan nomor telepon customer resmi untuk follow-up konfirmasi jadwal dan kepuasan servis via WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-lg">
            Total Reservasi: <strong className="text-slate-900 dark:text-white font-bold">{total}</strong>
          </div>
          <button
            onClick={handleExportExcelCrm}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
            {isExporting ? "Mengunduh..." : "Export Excel"}
          </button>
          <button
            onClick={() => fetchCrmBookings()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
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
              : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
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
              : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Wrench size={13} />
          <span>Booking Servis</span>
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
              : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <ShoppingBag size={13} />
          <span>Booking Suku Cadang</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tiket, nama customer, no mesin, atau plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A] transition"
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
              className="text-xs bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 dark:[color-scheme:dark] focus:outline-none focus:border-[#E8272A] shadow-2xs"
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
              className="text-xs bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 dark:[color-scheme:dark] focus:outline-none focus:border-[#E8272A] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A] shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Dikonfirmasi</option>
              <option value="IN_PROGRESS">Dikerjakan</option>
              <option value="DONE">Selesai</option>
              <option value="CANCELLED">Batal</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#E8272A] dark:hover:text-red-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 shadow-2xs transition cursor-pointer"
              title="Reset Semua Filter"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel CRM */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-4">No. Tiket</th>
                <th className="px-4 py-4">Tipe</th>
                <th className="px-4 py-4">Customer &amp; Kontak</th>
                <th className="px-4 py-4">Identitas / Detail</th>
                <th className="px-4 py-4">Jadwal</th>
                <th className="px-4 py-4">Layanan / Suku Cadang</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Aksi WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-slate-400 dark:text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                    Memuat data CRM...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-inner">
                        <Search size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada data booking ditemukan</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Coba sesuaikan kata kunci pencarian, rentang tanggal kalender, atau filter status servis.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
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
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`font-bold font-mono text-xs border px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xs ${
                            isPart
                              ? "text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/70"
                              : "text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/70"
                          }`}
                        >
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              isPart
                                ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"
                                : "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {isPart ? "PRT" : "SRV"}
                          </span>
                          <span>{item.ticket_no}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {isPart ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/70">
                            <ShoppingBag size={11} className="text-emerald-700 dark:text-emerald-400" />
                            <span>Part</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/70">
                            <Wrench size={11} className="text-blue-700 dark:text-blue-400" />
                            <span>Servis</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{item.nama_customer}</div>
                        {item.email ? (
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1" title="Akun Gmail Bukti Customer">
                            <Mail size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{item.email}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">Email tidak tercatat</div>
                        )}
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold flex items-center gap-1 mt-1">
                          <Phone size={12} className="text-slate-400 dark:text-slate-500" /> {item.no_hp}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {isPart ? (
                          <div>
                            <span className="inline-block text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {item.tipe_motor || "Motor Honda"}
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                              {item.metode_layanan === "PASANG" ? "Pasang Mekanik" : "Ambil Toko"}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 shadow-2xs">
                              {item.plat_kendaraan || "-"}
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                              Mesin: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.no_mesin || "-"}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Clock size={12} className={isPart ? "text-emerald-700 dark:text-emerald-400" : "text-[#E8272A]"} /> {item.jam_booking} WIB
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {item.tanggal_booking}
                        </div>
                      </td>

                      <td className="px-4 py-4 max-w-sm">
                        {isPart && Array.isArray(item.items_json) && item.items_json.length > 0 ? (
                          <div>
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-0.5">
                              {item.items_json.length} Jenis Part &bull; Total: Rp {Number(item.total_harga || 0).toLocaleString("id-ID")}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {item.items_json.map((it) => `${it.part_name} (${it.quantity}x)`).join(", ")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              {item.jenis_servis}
                            </span>
                            {item.detail_lainnya && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed" title={item.detail_lainnya}>
                                Ket: {item.detail_lainnya}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setWaBooking(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.28)] border border-emerald-400/30 transition-transform active:scale-95 cursor-pointer"
                          title={`Follow up ${item.nama_customer} (${item.no_hp}) via WA`}
                        >
                          <MessageSquare size={13} />
                          <span>Chat WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Halaman <strong className="text-slate-700 dark:text-slate-200">{page}</strong> dari{" "}
              <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <WhatsAppFollowUpModal
        booking={waBooking}
        onClose={() => setWaBooking(null)}
        sourceLabel="Portal CRM"
      />
    </div>
  );
}
