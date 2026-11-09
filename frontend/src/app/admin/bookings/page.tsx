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
  RotateCcw,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Eye,
  X,
  Store,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface BookingItem {
  part_no: string;
  part_name: string;
  nama_umum?: string | null;
  quantity: number;
  het: number;
  gambar_url?: string | null;
}

interface Booking {
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
  items_json?: BookingItem[] | null;
  total_harga?: number;
  metode_layanan?: "AMBIL" | "PASANG";
  created_at: string;
}

function getWhatsAppLink(item: Booking) {
  let cleanPhone = item.no_hp.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  let statusText = "DIKONFIRMASI";
  if (item.status === "DONE") statusText = "SELESAI";
  if (item.status === "IN_PROGRESS") statusText = "SEDANG DIKERJAKAN";
  if (item.status === "CANCELLED") statusText = "DIBATALKAN";
  if (item.status === "PENDING") statusText = "MENUNGGU VERIFIKASI";

  const isPart = item.tipe_booking === "SPAREPART";

  if (isPart) {
    const itemsList = Array.isArray(item.items_json) && item.items_json.length > 0
      ? item.items_json.map((it, idx) => `${idx + 1}. ${it.part_name} (${it.part_no}) x${it.quantity}`).join("\n")
      : item.jenis_servis;
    const totalFormatted = item.total_harga ? `Rp ${Number(item.total_harga).toLocaleString("id-ID")}` : "-";
    const metode = item.metode_layanan === "PASANG" ? "Sekalian Pasang oleh Mekanik AHASS" : "Ambil di Toko / Kasir Part";

    const message = `Halo Kak *${item.nama_customer}*,\n\nInformasi reservasi *Suku Cadang Honda* Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *Kode Booking (Part):* ${item.ticket_no}\n• *Jadwal Kedatangan:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Metode:* ${metode}\n• *Daftar Barang:*\n${itemsList}\n• *Total Estimasi:* *${totalFormatted}*\n• *Status Reservasi:* *${statusText}*\n\nSilakan tunjukkan kode booking ini saat tiba di bengkel/kasir kami. Terima kasih! 🙏`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  const message = `Halo Kak *${item.nama_customer}*,\n\nInformasi reservasi *Servis Motor Honda* Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *Kode Booking (Servis):* ${item.ticket_no}\n• *Jadwal:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Plat Kendaraan:* ${item.plat_kendaraan || '-'}\n• *Paket Servis:* ${item.jenis_servis}\n• *Status Reservasi:* *${statusText}*\n\nTerima kasih telah mempercayakan perawatan motor Honda Anda di AHASS AS Putra Rahmat! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function AdminBookingsContent() {
  const { token, authFetch } = useAuth();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SERVIS" | "SPAREPART">("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tanggalFrom, setTanggalFrom] = useState("");
  const [tanggalTo, setTanggalTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

      const res = await authFetch(`${baseUrl}/admin/bookings?${params.toString()}`, {
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
  }, [token, page, limit, statusFilter, typeFilter, debouncedSearch, tanggalFrom, tanggalTo, authFetch]);

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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("tipe_booking", typeFilter);
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (tanggalFrom) params.append("tanggal_from", tanggalFrom);
      if (tanggalTo) params.append("tanggal_to", tanggalTo);

      const res = await authFetch(`${baseUrl}/admin/bookings/export?${params.toString()}`);

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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (newStatus === "CANCELLED") {
          toast.success("Status diubah ke Dibatalkan. Stok suku cadang otomatis dikembalikan ke katalog.");
        } else {
          toast.success(`Status diubah menjadi ${newStatus}`);
        }
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
    <div className="flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <AdminPageHeader
        title="Manajemen Booking & Reservasi"
        subtitle={`${total} total reservasi · antrean servis & suku cadang Honda`}
        breadcrumb="Booking Servis"
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition disabled:opacity-50"
            >
              <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
              {isExporting ? "Mengunduh..." : "Export Excel"}
            </button>
            <button
              onClick={() => fetchBookings()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Tipe Booking Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "ALL"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "SERVIS"
                  ? "bg-[#E4002B] text-white shadow-xs"
                  : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
              }`}
            >
              <Wrench size={13} />
              <span>Servis Motor (SRV)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("SPAREPART");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "SPAREPART"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200"
              }`}
            >
              <ShoppingBag size={13} />
              <span>Suku Cadang (PRT)</span>
            </button>
          </div>

          {/* Notifikasi Booking Baru */}
          {pendingCount > 0 && (
            <div className="relative bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-950 font-medium">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 border border-amber-400">
                  <Bell size={14} />
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
                className="text-xs font-bold text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-200 border border-amber-300 shadow-xs transition"
              >
                Lihat Pending &rarr;
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket, nama customer, no mesin, atau plat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A]"
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
                  className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 focus:border-[#E8272A]"
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-[#E8272A] px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition"
                  title="Reset Semua Filter"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-[0_14px_36px_-6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-zinc-50 via-zinc-100/60 to-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    <th className="px-5 py-4">Tiket &amp; Customer</th>
                    <th className="px-4 py-4">Tipe Booking</th>
                    <th className="px-4 py-4">Identitas / Detail</th>
                    <th className="px-4 py-4">Jadwal &amp; Metode</th>
                    <th className="px-4 py-4">Layanan / Suku Cadang</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Memuat data booking...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center px-4">
                          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                            <Search size={20} />
                          </div>
                          <h3 className="text-sm font-bold text-zinc-800">Tidak ada reservasi ditemukan</h3>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            Coba sesuaikan kata kunci pencarian, filter tipe booking, atau rentang tanggal.
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
                    bookings.map((item) => {
                      const isPart = item.tipe_booking === "SPAREPART";
                      return (
                        <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <span
                              className={`font-bold font-mono text-xs border px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-2xs mb-1.5 ${
                                isPart
                                  ? "text-emerald-900 bg-emerald-50 border-emerald-300"
                                  : "text-blue-900 bg-blue-50 border-blue-300"
                              }`}
                            >
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  isPart
                                    ? "bg-emerald-200 text-emerald-900"
                                    : "bg-blue-200 text-blue-900"
                                }`}
                              >
                                {isPart ? "PRT" : "SRV"}
                              </span>
                              <span>{item.ticket_no}</span>
                            </span>
                            <div className="font-bold text-sm text-zinc-900">{item.nama_customer}</div>
                            {item.email ? (
                              <div className="text-xs text-zinc-600 flex items-center gap-1 mt-1" title="Akun Gmail Bukti Customer">
                                <Mail size={12} className="text-zinc-400 shrink-0" />
                                <span className="text-xs text-zinc-600 font-medium">{item.email}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-400 italic mt-0.5">Email tidak tercatat</div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-zinc-600 font-mono font-semibold">{item.no_hp}</span>
                              <a
                                href={getWhatsAppLink(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                                title="Kirim notifikasi WhatsApp ke pemesan"
                              >
                                <MessageSquare size={11} className="text-emerald-600 shrink-0" />
                                <span>Chat WA</span>
                              </a>
                            </div>
                          </td>

                          {/* Tipe Booking Badge */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isPart ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-b from-emerald-50 to-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs">
                                <ShoppingBag size={12} className="text-emerald-700" />
                                <span>Suku Cadang</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-b from-blue-50 to-blue-100/80 text-blue-900 border border-blue-300 shadow-2xs">
                                <Wrench size={12} className="text-blue-700" />
                                <span>Servis Motor</span>
                              </span>
                            )}
                          </td>

                          {/* Identitas / Detail */}
                          <td className="px-4 py-4">
                            {isPart ? (
                              <div>
                                <span className="inline-block text-xs font-bold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                                  {item.tipe_motor || "Motor Honda"}
                                </span>
                                <div className="text-xs text-zinc-600 font-medium mt-1">
                                  Metode:{" "}
                                  <strong className={item.metode_layanan === "PASANG" ? "text-blue-700" : "text-emerald-700"}>
                                    {item.metode_layanan === "PASANG" ? "Pasang di Bengkel" : "Ambil di Kasir"}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-zinc-900 text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 inline-block font-mono shadow-2xs">
                                  {item.plat_kendaraan || "-"}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono mt-1">
                                  Mesin: <span className="font-bold text-zinc-800">{item.no_mesin || "-"}</span>
                                </div>
                                {item.tipe_motor && (
                                  <div className="text-[11px] text-zinc-500 mt-0.5">{item.tipe_motor}</div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Jadwal */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                              <Clock size={13} className={isPart ? "text-emerald-600" : "text-[#E4002B]"} /> {item.jam_booking} WIB
                            </div>
                            <div className="text-xs font-semibold text-zinc-600 mt-1">
                              {item.tanggal_booking}
                            </div>
                          </td>

                          {/* Layanan / Part */}
                          <td className="px-4 py-4 max-w-xs">
                            {isPart && Array.isArray(item.items_json) && item.items_json.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[11px]">
                                    {item.items_json.length} jenis
                                  </span>
                                  {item.total_harga ? (
                                    <span className="text-emerald-800 font-extrabold text-xs">
                                      Rp {Number(item.total_harga).toLocaleString("id-ID")}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-zinc-600 line-clamp-2 leading-snug">
                                  {item.items_json.map((it) => `${it.part_name} (${it.quantity}x)`).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-2xs">
                                  {item.jenis_servis}
                                </span>
                                {item.detail_lainnya && (
                                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed" title={item.detail_lainnya}>
                                    Ket: {item.detail_lainnya}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStatusBadge(item.status)}
                          </td>

                          {/* Aksi & Ubah Status */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(item)}
                                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition shadow-2xs"
                                title="Lihat detail lengkap"
                              >
                                <Eye size={14} />
                              </button>

                              <select
                                disabled={updatingId === item.id}
                                value={item.status}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                className="text-xs font-bold border border-zinc-200 rounded-xl px-2.5 py-1.5 bg-white text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 shadow-2xs disabled:opacity-50"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Konfirmasi</option>
                                <option value="IN_PROGRESS">{isPart ? "Disiapkan" : "Proses Servis"}</option>
                                <option value="DONE">Selesai</option>
                                <option value="CANCELLED">Batalkan</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

      {/* Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 flex items-center justify-between text-white ${
              selectedBooking.tipe_booking === "SPAREPART"
                ? "bg-gradient-to-r from-emerald-600 to-teal-800"
                : "bg-gradient-to-r from-[#E4002B] to-[#99001C]"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  {selectedBooking.tipe_booking === "SPAREPART" ? <ShoppingBag size={18} /> : <Wrench size={18} />}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
                    {selectedBooking.tipe_booking === "SPAREPART" ? "Booking Suku Cadang (PRT)" : "Booking Servis Motor (SRV)"}
                  </span>
                  <h3 className="font-mono font-bold text-lg leading-tight mt-0.5">
                    {selectedBooking.ticket_no}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <span className="text-zinc-500 font-semibold">Status Reservasi:</span>
                <div>{getStatusBadge(selectedBooking.status)}</div>
              </div>

              {/* Data Customer */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2.5">
                <div className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Data Pelanggan</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Nama Pemesan</span>
                    <strong className="text-zinc-900 text-sm">{selectedBooking.nama_customer}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">No. WhatsApp</span>
                    <strong className="font-mono text-zinc-900">{selectedBooking.no_hp}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block">Email / Akun Bukti</span>
                    <span className="font-medium text-zinc-800">{selectedBooking.email || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Data Kendaraan / Layanan */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2.5">
                <div className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                  {selectedBooking.tipe_booking === "SPAREPART" ? "Informasi Pengambilan" : "Identitas Kendaraan"}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Jadwal Kedatangan</span>
                    <strong className="text-zinc-900">{selectedBooking.tanggal_booking} ({selectedBooking.jam_booking} WIB)</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">
                      {selectedBooking.tipe_booking === "SPAREPART" ? "Metode Layanan" : "Plat Nomor"}
                    </span>
                    <strong className="text-zinc-900">
                      {selectedBooking.tipe_booking === "SPAREPART"
                        ? (selectedBooking.metode_layanan === "PASANG" ? "Pasang di Bengkel" : "Ambil di Toko / Kasir")
                        : (selectedBooking.plat_kendaraan || "-")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Tipe Motor Honda</span>
                    <span className="font-medium text-zinc-800">{selectedBooking.tipe_motor || "-"}</span>
                  </div>
                  {selectedBooking.tipe_booking !== "SPAREPART" && (
                    <div>
                      <span className="text-zinc-500 block">Nomor Mesin</span>
                      <span className="font-mono font-medium text-zinc-800">{selectedBooking.no_mesin || "-"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Suku Cadang atau Servis */}
              {selectedBooking.tipe_booking === "SPAREPART" ? (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <div className="bg-zinc-100/80 px-4 py-2.5 text-xs font-bold text-zinc-800 border-b border-zinc-200 flex justify-between items-center">
                    <span>Daftar Suku Cadang yang Dipesan</span>
                    {selectedBooking.items_json && (
                      <span className="text-[11px] font-normal text-zinc-500">
                        {selectedBooking.items_json.length} item
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-zinc-200 p-3 bg-white space-y-2">
                    {Array.isArray(selectedBooking.items_json) && selectedBooking.items_json.length > 0 ? (
                      selectedBooking.items_json.map((it) => (
                        <div key={it.part_no} className="flex items-center justify-between py-1.5 text-xs">
                          <div>
                            <div className="font-bold text-zinc-900">{it.part_name}</div>
                            <div className="font-mono text-zinc-500 text-[11px]">{it.part_no} &bull; {it.quantity} pcs</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-800">
                              Rp {(it.het * it.quantity).toLocaleString("id-ID")}
                            </div>
                            <div className="text-[10px] text-zinc-400">@ Rp {it.het.toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-600 py-2">{selectedBooking.jenis_servis}</div>
                    )}
                  </div>
                  {selectedBooking.total_harga ? (
                    <div className="bg-emerald-50/60 px-4 py-3 border-t border-zinc-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-700">Total Estimasi Biaya:</span>
                      <span className="text-sm font-extrabold text-emerald-800">
                        Rp {Number(selectedBooking.total_harga).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : null}

                  {/* Stock Guarantee Notice */}
                  <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>Stok dipotong otomatis oleh sistem</span>
                    </span>
                    {selectedBooking.status === "CANCELLED" && (
                      <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        Stok dikembalikan ke katalog
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                  <span className="text-zinc-500 text-xs block mb-1">Paket Layanan Servis:</span>
                  <div className="font-bold text-zinc-900 text-sm">{selectedBooking.jenis_servis}</div>
                </div>
              )}

              {/* Catatan Customer */}
              {selectedBooking.detail_lainnya && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                  <span className="font-bold block mb-0.5">Catatan Customer:</span>
                  <p className="leading-relaxed">{selectedBooking.detail_lainnya}</p>
                </div>
              )}

              {/* Catatan Admin */}
              {selectedBooking.catatan_admin && (
                <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-800">
                  <span className="font-bold block mb-0.5">Catatan Internal Admin:</span>
                  <p className="leading-relaxed">{selectedBooking.catatan_admin}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <a
                href={getWhatsAppLink(selectedBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
              >
                <MessageSquare size={14} />
                <span>Kirim WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-semibold">Ubah:</span>
                <select
                  disabled={updatingId === selectedBooking.id}
                  value={selectedBooking.status}
                  onChange={(e) => {
                    handleUpdateStatus(selectedBooking.id, e.target.value);
                    setSelectedBooking((prev) => prev ? { ...prev, status: e.target.value as any } : null);
                  }}
                  className="text-xs font-bold border border-zinc-200 rounded-xl px-3 py-1.5 bg-white text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#E8272A]/20 shadow-2xs"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Konfirmasi</option>
                  <option value="IN_PROGRESS">{selectedBooking.tipe_booking === "SPAREPART" ? "Disiapkan" : "Proses Servis"}</option>
                  <option value="DONE">Selesai</option>
                  <option value="CANCELLED">Batalkan</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
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
