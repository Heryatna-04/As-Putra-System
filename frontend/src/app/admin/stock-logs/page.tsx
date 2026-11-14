"use client";

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { useAuth } from "@/context/AuthContext";
import { History, RefreshCw, ChevronLeft, ChevronRight, User, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface StockLogItem {
  id: string;
  spare_part_id: string;
  changed_by: string;
  stok_sebelum: number;
  stok_sesudah: number;
  selisih: number;
  tipe_perubahan: "TAMBAH" | "KURANG" | "MANUAL" | "IMPORT";
  keterangan?: string;
  created_at: string;
  spare_parts?: {
    part_no: string;
    part_name: string;
  };
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface StockLogsResponse {
  success: boolean;
  message?: string;
  data?: {
    logs?: StockLogItem[];
    total?: number;
    totalPages?: number;
  };
}

export default function StockLogsPage() {
  const { token, authFetch } = useAuth();
  const [logs, setLogs] = useState<StockLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStockLogs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const res = await authFetch(`${baseUrl}/admin/stock-logs?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as StockLogsResponse;

      if (res.ok && data.success && data.data) {
        setLogs(data.data.logs || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        toast.error(data.message || "Gagal mengambil riwayat perubahan stok");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kendala jaringan server");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, authFetch]);

  useEffect(() => {
    fetchStockLogs();
  }, [fetchStockLogs]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inboundCount = logs.filter((l) => l.selisih > 0).length;
  const outboundCount = logs.filter((l) => l.selisih < 0).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Audit Trail Perubahan Stok"
        subtitle={`${total.toLocaleString("id-ID")} catatan perubahan stok suku cadang`}
        breadcrumb="Riwayat Stok"
        icon={History}
        actions={
          <button
            type="button"
            onClick={() => fetchStockLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              style={{ "--stagger-index": 0 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#E4002B]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Catatan Mutasi
              </span>
              <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {total.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Audit log tersimpan
              </span>
            </div>

            <div
              style={{ "--stagger-index": 1 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mutasi Masuk (Halaman Ini)
              </span>
              <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{inboundCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Penambahan / pengembalian stok
              </span>
            </div>

            <div
              style={{ "--stagger-index": 2 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mutasi Keluar (Halaman Ini)
              </span>
              <div className="mt-1.5 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {outboundCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Pengurangan / pemakaian part
              </span>
            </div>
          </div>

          {/* Table */}
          <div
            style={{ "--stagger-index": 3 } as CSSProperties}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3.5">Waktu Perubahan</th>
                    <th className="px-4 py-3.5">Kode &amp; Nama Part</th>
                    <th className="px-4 py-3.5">Perubahan Stok</th>
                    <th className="px-4 py-3.5">Tipe</th>
                    <th className="px-5 py-3.5">Diubah Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                        Memuat riwayat stok...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                        Belum ada catatan perubahan stok.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Package size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                            <div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                                {log.spare_parts?.part_no || "-"}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                {log.spare_parts?.part_name || "Spare Part"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500 line-through tabular-nums">
                              {log.stok_sebelum}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                              ➔ {log.stok_sesudah}
                            </span>
                            {log.selisih > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50 tabular-nums">
                                <ArrowUpRight size={13} /> +{log.selisih}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/50 tabular-nums">
                                <ArrowDownRight size={13} /> {log.selisih}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                            {log.tipe_perubahan}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E4002B]/10 dark:bg-red-950/50 text-[#E4002B] dark:text-red-400 flex items-center justify-center text-xs font-bold shrink-0">
                              <User size={13} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                                {log.profiles?.full_name || "Sistem"}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono">
                                {log.profiles?.role || "ADMIN"}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Halaman <strong className="text-slate-900 dark:text-white">{page}</strong> dari{" "}
                  <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
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
