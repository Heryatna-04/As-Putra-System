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
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Pending</span>;
      case "CONFIRMED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">Dikonfirmasi</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">Dikerjakan</span>;
      case "DONE":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">Selesai</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">Batal</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner CRM */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Data Monitoring Booking Customer</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <MessageSquare size={12} /> Follow-up CRM Aktif
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Data kontak dan nomor telepon customer resmi untuk follow-up konfirmasi jadwal dan kepuasan servis via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-xs text-zinc-500 font-medium mr-1">
            Total Booking: <strong className="text-zinc-900">{total}</strong>
          </div>
          <button
            onClick={handleExportExcelCrm}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
            {isExporting ? "Mengunduh..." : "Export Excel"}
          </button>
          <button
            onClick={() => fetchCrmBookings()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tiket, nama customer, no mesin, atau plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50/50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A]"
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
              className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-[#E8272A]"
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
              className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-[#E8272A]"
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
              className="text-xs font-medium bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A]"
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-[#E8272A] px-2 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              title="Reset Semua Filter"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel CRM */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                <th className="px-5 py-3.5">No. Tiket</th>
                <th className="px-4 py-3.5">Customer &amp; Kontak</th>
                <th className="px-4 py-3.5">No. Mesin &amp; Plat</th>
                <th className="px-4 py-3.5">Jadwal Servis</th>
                <th className="px-4 py-3.5">Jenis Servis</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat data CRM...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
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
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold font-mono text-xs text-[#E4002B] bg-red-50 border border-red-200/60 px-2 py-0.5 rounded inline-block">
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
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-900">
                        {item.plat_kendaraan}
                      </span>
                      <div className="text-xs text-zinc-500 font-mono mt-1">
                        Mesin: <span className="font-semibold text-zinc-700">{item.no_mesin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-zinc-900 flex items-center gap-1">
                        <Clock size={11} className="text-zinc-400" /> {item.jam_booking} WIB
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {item.tanggal_booking}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-sm">
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                            title={`Follow up ${item.nama_customer} (${item.no_hp}) via WA`}
                          >
                            <MessageSquare size={12} />
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
