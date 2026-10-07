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
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface BookingCRM {
  id: string;
  ticket_no: string;
  nama_customer: string;
  email?: string;
  no_hp: string;
  no_mesin: string;
  plat_kendaraan: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  detail_lainnya?: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  catatan_admin?: string;
  created_at: string;
}

export default function CrmBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingCRM[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tanggalFrom, setTanggalFrom] = useState("");
  const [tanggalTo, setTanggalTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = Boolean(search || debouncedSearch || tanggalFrom || tanggalTo || statusFilter !== "ALL");

  const resetAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTanggalFrom("");
    setTanggalTo("");
    setStatusFilter("ALL");
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await fetch(`${baseUrl}/crm/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, [token, page, limit, statusFilter, debouncedSearch, tanggalFrom, tanggalTo]);

  useEffect(() => {
    fetchCrmBookings();
  }, [fetchCrmBookings]);

  const handleExportExcelCrm = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await fetch(`${baseUrl}/crm/bookings/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-amber-50 to-amber-100/80 text-amber-800 border border-amber-300 shadow-[0_2px_6px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]">Pending</span>;
      case "CONFIRMED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-blue-50 to-blue-100/80 text-blue-800 border border-blue-300 shadow-[0_2px_6px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]">Dikonfirmasi</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-purple-50 to-purple-100/80 text-purple-800 border border-purple-300 shadow-[0_2px_6px_rgba(168,85,247,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]">Dikerjakan</span>;
      case "DONE":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-emerald-50 to-emerald-100/80 text-emerald-800 border border-emerald-300 shadow-[0_2px_6px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]">Selesai</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-zinc-100 to-zinc-200/80 text-zinc-600 border border-zinc-300 shadow-2xs">Batal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Elevated Banner CRM */}
      <div className="relative bg-gradient-to-br from-white via-white to-zinc-50/80 border border-zinc-200/90 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_14px_36px_-6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] overflow-hidden">
        {/* Top 3D Highlight Specular Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8272A] to-transparent opacity-75" />

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight font-display drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              Data Monitoring Booking Customer
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400/40 px-3 py-1 rounded-full shadow-[0_3px_10px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <MessageSquare size={12} /> Follow-up CRM Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
            Data kontak dan nomor telepon customer resmi untuk follow-up konfirmasi jadwal dan kepuasan servis via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-500 font-medium bg-zinc-100/80 border border-zinc-200 px-3.5 py-2 rounded-xl shadow-2xs">
            Total Reservasi: <strong className="text-zinc-900 font-bold">{total}</strong>
          </div>
          <button
            onClick={handleExportExcelCrm}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-xs font-bold text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] transition disabled:opacity-50"
          >
            <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
            {isExporting ? "Mengunduh..." : "Export Excel"}
          </button>
          <button
            onClick={() => fetchCrmBookings()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Strip 3D */}
      <div className="bg-white/90 backdrop-blur-md border border-zinc-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tiket, nama customer, no mesin, atau plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50/70 border border-zinc-200/80 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A] shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-500 uppercase">Dari:</span>
            <input
              type="date"
              value={tanggalFrom}
              onChange={(e) => {
                setTanggalFrom(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-[#E8272A] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-500 uppercase">Sampai:</span>
            <input
              type="date"
              value={tanggalTo}
              onChange={(e) => {
                setTanggalTo(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-[#E8272A] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A] shadow-2xs"
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-[#E8272A] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-red-50 border border-zinc-200 hover:border-red-200 shadow-2xs transition"
              title="Reset Semua Filter"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel CRM 3D Container */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-[0_14px_36px_-6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-50 via-zinc-100/60 to-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                <th className="px-5 py-4">No. Tiket</th>
                <th className="px-4 py-4">Customer &amp; Kontak</th>
                <th className="px-4 py-4">No. Mesin &amp; Plat</th>
                <th className="px-4 py-4">Jadwal Servis</th>
                <th className="px-4 py-4">Jenis Servis</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Aksi WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat data CRM...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
                        <Search size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-800">Tidak ada data booking ditemukan</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Coba sesuaikan kata kunci pencarian, rentang tanggal kalender, atau filter status servis.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition"
                        >
                          <RotateCcw size={12} /> Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold font-mono text-xs text-[#E4002B] bg-gradient-to-r from-red-50 to-red-100/60 border border-red-200/80 px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                        {item.ticket_no}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-sm text-zinc-900">{item.nama_customer}</div>
                      {item.email ? (
                        <div className="text-xs text-zinc-600 flex items-center gap-1 mt-1" title="Akun Gmail Bukti Customer">
                          <Mail size={12} className="text-zinc-400 shrink-0" />
                          <span className="text-xs text-zinc-600 font-medium">{item.email}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400 italic mt-0.5">Email tidak tercatat</div>
                      )}
                      <div className="text-xs text-zinc-600 font-mono font-semibold flex items-center gap-1 mt-1">
                        <Phone size={12} className="text-zinc-400" /> {item.no_hp}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 border border-zinc-200/80 rounded-lg text-zinc-900 shadow-2xs">
                        {item.plat_kendaraan}
                      </span>
                      <div className="text-xs text-zinc-500 font-mono mt-1">
                        Mesin: <span className="font-semibold text-zinc-700">{item.no_mesin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Clock size={12} className="text-[#E8272A]" /> {item.jam_booking} WIB
                      </div>
                      <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                        {item.tanggal_booking}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-sm">
                      <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-2xs">
                        {item.jenis_servis}
                      </span>
                      {item.detail_lainnya && (
                        <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed" title={item.detail_lainnya}>
                          Ket: {item.detail_lainnya}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {(() => {
                        const cleanPhone = item.no_hp.replace(/\D/g, "");
                        const waNum = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                        return (
                          <a
                            href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Halo ${item.nama_customer}, kami dari CRM AHASS Honda AS Putra Motor Kuningan mengonfirmasi tiket booking servis Anda (${item.ticket_no}) jadwal ${item.tanggal_booking} jam ${item.jam_booking}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-400/30 transition-transform active:scale-95"
                            title={`Follow up ${item.nama_customer} (${item.no_hp}) via WA`}
                          >
                            <MessageSquare size={13} />
                            <span>Chat WA</span>
                          </a>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 text-xs text-zinc-500">
            <span>
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
