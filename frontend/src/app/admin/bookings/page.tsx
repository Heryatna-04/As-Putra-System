"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Mail,
  Bell,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
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

function AdminBookingsContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [tanggalFrom, setTanggalFrom] = useState("");
  const [tanggalTo, setTanggalTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchBookings = useCallback(async () => {
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

      const res = await fetch(`${baseUrl}/admin/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBookings(data.data.bookings || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        toast.error(data.message || "Gagal memuat daftar booking");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi server");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, statusFilter, debouncedSearch, tanggalFrom, tanggalTo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time polling setiap 30 detik untuk mendeteksi pesanan baru langsung di website
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBookings();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchBookings]);

  const handleExportExcel = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await fetch(`${baseUrl}/admin/bookings/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Gagal mengunduh file Excel");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Booking_AS_Putra_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rekap booking Excel berhasil diunduh!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal export data Excel";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Status diubah menjadi ${newStatus}`);
        fetchBookings();
      } else {
        toast.error(data.message || "Gagal mengubah status booking");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
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
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-zinc-100 to-zinc-200/80 text-zinc-600 border border-zinc-300 shadow-2xs">Dibatalkan</span>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#F2F4F8] via-[#F7F9FC] to-[#EEF2F6]">
      {/* Topbar */}
      <div className="h-[54px] bg-white/90 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between px-6 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <span>Admin</span>
          <span className="text-zinc-300">/</span>
          <span className="font-bold text-zinc-900">Booking Servis</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="text-xs font-bold text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-100/80 hover:from-emerald-100 hover:to-emerald-200 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-[0_2px_6px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] transition disabled:opacity-50"
          >
            <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
            {isExporting ? "Mengunduh Excel..." : "Export Excel"}
          </button>
          <button
            onClick={() => fetchBookings()}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-7">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                Manajemen Booking Servis Kendaraan
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Kelola antrean jadwal servis, verifikasi nomor mesin, dan perbarui status servis motor secara real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-zinc-700 bg-white border border-zinc-200/90 px-3.5 py-2 rounded-xl shadow-2xs">
                Total Reservasi: <strong className="text-zinc-900 font-black">{total}</strong>
              </div>
            </div>
          </div>

          {/* Notifikasi 3D Booking Baru di Website */}
          {pendingCount > 0 && (
            <div className="relative bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300/80 rounded-2xl p-4 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-950 font-medium">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(245,158,11,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-amber-400/40">
                  <Bell size={14} className="drop-shadow-2xs" />
                </div>
                <span>
                  <strong>Ada {pendingCount} antrean booking baru (Pending)</strong> yang menunggu verifikasi bukti akun customer dan konfirmasi jadwal.
                </span>
              </div>
              <button
                onClick={() => {
                  setStatusFilter("PENDING");
                  setPage(1);
                }}
                className="text-xs font-black text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-xl bg-amber-200/60 hover:bg-amber-200 border border-amber-300/80 shadow-2xs transition"
              >
                Lihat Pending &rarr;
              </button>
            </div>
          )}

          {/* Filter Bar 3D */}
          <div className="bg-white/90 backdrop-blur-md border border-zinc-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket, nama customer, no mesin, atau plat..."
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
                  <option value="CANCELLED">Dibatalkan</option>
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

          {/* Table 3D Container */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-[0_14px_36px_-6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-zinc-50 via-zinc-100/60 to-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    <th className="px-5 py-4">Tiket &amp; Customer</th>
                    <th className="px-4 py-4">Identitas Motor</th>
                    <th className="px-4 py-4">Jadwal Servis</th>
                    <th className="px-4 py-4">Layanan / Servis</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Ubah Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Memuat data booking...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                            <Search size={20} />
                          </div>
                          <h3 className="text-sm font-bold text-zinc-800">Tidak ada booking servis ditemukan</h3>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Coba sesuaikan kata kunci pencarian, rentang tanggal, atau filter status antrean.
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
                        <td className="px-5 py-4">
                          <span className="font-bold font-mono text-xs text-[#E4002B] bg-gradient-to-r from-red-50 to-red-100/60 border border-red-200/80 px-2.5 py-1 rounded-lg inline-block shadow-2xs mb-1">
                            {item.ticket_no}
                          </span>
                          <div className="font-bold text-sm text-zinc-900">{item.nama_customer}</div>
                          {item.email ? (
                            <div className="text-xs text-zinc-600 flex items-center gap-1 mt-1" title="Akun Gmail/Email Bukti Customer">
                              <Mail size={12} className="text-zinc-400 shrink-0" />
                              <span className="text-xs text-zinc-600 font-medium">{item.email}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400 italic mt-0.5">Email tidak tercatat</div>
                          )}
                          <div className="text-xs text-zinc-600 font-mono font-semibold mt-1">{item.no_hp}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-zinc-900 text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 inline-block font-mono shadow-2xs">
                            {item.plat_kendaraan}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono mt-1">
                            Mesin: <span className="font-bold text-zinc-800">{item.no_mesin}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                            <Clock size={13} className="text-[#E4002B]" /> {item.jam_booking} WIB
                          </div>
                          <div className="text-xs font-semibold text-zinc-600 mt-1">
                            {item.tanggal_booking}
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-2xs">
                            {item.jenis_servis}
                          </span>
                          {item.detail_lainnya && (
                            <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed" title={item.detail_lainnya}>
                              Ket: {item.detail_lainnya}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <select
                            disabled={updatingId === item.id}
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className="text-xs font-bold border border-zinc-200 rounded-xl px-3 py-1.5 bg-white text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 shadow-2xs disabled:opacity-50"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Konfirmasi</option>
                            <option value="IN_PROGRESS">Proses Servis</option>
                            <option value="DONE">Selesai</option>
                            <option value="CANCELLED">Batalkan</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 text-xs text-zinc-500">
                <span>
                  Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {total} booking)
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
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
          Memuat antrean booking servis...
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
