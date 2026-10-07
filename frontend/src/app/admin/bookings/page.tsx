"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Mail,
  Bell
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

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
  }, [token, page, limit, statusFilter, debouncedSearch]);

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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Pending</span>;
      case "CONFIRMED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">Dikonfirmasi</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">Dikerjakan</span>;
      case "DONE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">Selesai</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">Dibatalkan</span>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
      {/* Topbar */}
      <div className="h-[52px] bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>Admin</span>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-900">Booking Servis</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
            {isExporting ? "Mengunduh Excel..." : "Export Excel"}
          </button>
          <button
            onClick={() => fetchBookings()}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-zinc-100 border border-zinc-200"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Manajemen Booking Servis Kendaraan</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Kelola antrean jadwal servis, verifikasi nomor mesin, dan perbarui status servis motor.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-zinc-500 bg-white border border-zinc-200 px-3 py-2 rounded-lg">
                Total Reservasi: <strong className="text-zinc-900">{total}</strong>
              </div>
            </div>
          </div>

          {/* Notifikasi Booking Baru di Website */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Bell size={13} />
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
                className="text-xs font-semibold text-amber-800 hover:underline px-2 py-1"
              >
                Lihat Pending &rarr;
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket, nama customer, no mesin, atau plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50/50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status:</span>
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
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    <th className="px-5 py-3.5">Tiket &amp; Customer</th>
                    <th className="px-4 py-3.5">Identitas Motor</th>
                    <th className="px-4 py-3.5">Jadwal Servis</th>
                    <th className="px-4 py-3.5">Layanan / Servis</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ubah Status</th>
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
                      <td colSpan={6} className="text-center py-12 text-zinc-400 text-sm">
                        Tidak ada antrean booking ditemukan.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold font-mono text-xs text-[#E4002B] bg-red-50 border border-red-200/60 px-2 py-0.5 rounded inline-block mb-1">
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
                          <div className="font-bold text-zinc-900 text-xs px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200/80 inline-block font-mono">
                            {item.plat_kendaraan}
                          </div>
                          <div className="text-xs text-zinc-600 mt-1 font-mono">
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
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-[#E8272A] border border-red-200/60">
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
                            className="text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 disabled:opacity-50"
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
