"use client";

import { useEffect, useState, useCallback } from "react";
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
      const data = await res.json();

      if (res.ok && data.success) {
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Audit Trail Perubahan Stok"
        subtitle={`${total} catatan perubahan stok suku cadang`}
        breadcrumb="Riwayat Stok"
        icon={History}
        actions={
          <button
            onClick={() => fetchStockLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-[1400px] mx-auto space-y-4">

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                    <th className="px-5 py-3.5">Waktu Perubahan</th>
                    <th className="px-4 py-3.5">Kode &amp; Nama Part</th>
                    <th className="px-4 py-3.5">Perubahan Stok</th>
                    <th className="px-4 py-3.5">Tipe</th>
                    <th className="px-5 py-3.5">Diubah Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Memuat riwayat stok...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-400 text-sm">
                        Belum ada catatan perubahan stok.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-4 text-xs font-medium text-zinc-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Package size={15} className="text-zinc-400 shrink-0" />
                            <div>
                              <span className="text-xs text-zinc-500 block">{log.spare_parts?.part_no || "-"}</span>
                              <span className="font-semibold text-zinc-900 text-xs">{log.spare_parts?.part_name || "Spare Part"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 line-through">{log.stok_sebelum}</span>
                            <span className="text-xs font-bold text-zinc-900">➔ {log.stok_sesudah}</span>
                            {log.selisih > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                <ArrowUpRight size={13} /> +{log.selisih}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                <ArrowDownRight size={13} /> {log.selisih}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                            {log.tipe_perubahan}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E8272A]/10 text-[#E8272A] flex items-center justify-center text-xs font-bold shrink-0">
                              <User size={13} />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-900">{log.profiles?.full_name || "Sistem"}</div>
                              <div className="text-[10px] text-zinc-400 uppercase font-mono">{log.profiles?.role || "ADMIN"}</div>
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
      </div>
    </div>
  );
}
