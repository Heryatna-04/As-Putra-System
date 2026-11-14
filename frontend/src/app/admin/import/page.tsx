"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Loader2,
  ArrowRight,
  Download,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatIDR } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface ValidImportRow {
  part_no: string;
  part_name: string;
  category_detail?: string | null;
  het?: number | null;
  stok?: number | null;
  hpp?: number | null;
  uom?: string | null;
}

interface PreviewData {
  batch_id: string;
  file_format?: "AHASS_DEALER_MONTHLY" | "STANDARD_CATALOG";
  periode?: string;
  total_rows: number;
  valid_rows: ValidImportRow[];
  error_rows: { row: number; reason: string }[];
}

interface ConfirmResult {
  batch_id?: string;
  inserted_rows?: number;
  updated_rows?: number;
  error_rows?: number;
  total_processed?: number;
}

interface ImportBatch {
  id: string;
  file_name: string;
  uploaded_at: string;
  status: string;
  total_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export default function AdminImportPage() {
  const { token, authFetch } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  const fetchHistory = useCallback(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/imports`);
      const data = (await res.json()) as ApiResponse<ImportBatch[]>;
      if (res.ok && data.success && data.data) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat import", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, fetchHistory]);

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/template_persediaan_ahass.xlsx";
    link.setAttribute("download", "template_persediaan_ahass.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsPreviewing(true);
    setErrorMsg(null);
    setPreviewData(null);
    setConfirmResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await authFetch(`${baseUrl}/admin/import/spare-parts/preview`, {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as ApiResponse<PreviewData>;
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || "Gagal memproses file Excel.");
      }

      setPreviewData(data.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah file.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    setIsConfirming(true);
    setErrorMsg(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/import/spare-parts/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch_id: previewData.batch_id }),
      });

      const data = (await res.json()) as ApiResponse<ConfirmResult>;
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengonfirmasi impor data.");
      }

      setConfirmResult(data.data ?? {});
      setPreviewData(null);
      setSelectedFile(null);
      fetchHistory();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat konfirmasi impor.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Import Excel Suku Cadang"
        subtitle="Upload & sinkronisasi katalog AHM via spreadsheet"
        breadcrumb="Import Excel"
        icon={FileSpreadsheet}
        actions={
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#E4002B]" />
            Template Excel
          </button>
        }
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* 3-Step Import Pipeline */}
          <div
            style={{ "--stagger-index": 0 } as CSSProperties}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 admin-stagger-item"
          >
            {[
              {
                step: "1",
                title: "Pilih File Excel",
                desc: "Format AHASS atau standar",
                active: !previewData && !confirmResult,
                done: Boolean(previewData || confirmResult),
              },
              {
                step: "2",
                title: "Preview & Validasi",
                desc: "Cek baris valid & error",
                active: Boolean(previewData),
                done: Boolean(confirmResult),
              },
              {
                step: "3",
                title: "Sinkronisasi Katalog",
                desc: "Simpan & catat riwayat",
                active: Boolean(confirmResult),
                done: Boolean(confirmResult),
              },
            ].map((s) => (
              <div
                key={s.step}
                className={`relative overflow-hidden rounded-2xl border p-4 bg-white dark:bg-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-3 ${
                  s.active
                    ? "border-[#E4002B] ring-2 ring-[#E4002B]/15"
                    : "border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                    s.done
                      ? "bg-emerald-500 text-white"
                      : s.active
                      ? "bg-[#E4002B] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {s.step}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {confirmResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold">Proses Import Berhasil Selesai!</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Ditambahkan: <strong>{confirmResult.inserted_rows}</strong> data baru &nbsp;•&nbsp;
                  Diperbarui: <strong>{confirmResult.updated_rows}</strong> data lama
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Upload Card */}
          {!previewData && (
            <div
              style={{ "--stagger-index": 1 } as CSSProperties}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E4002B]/10 dark:bg-red-950/50 text-[#E4002B] flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Upload File Spreadsheet (.xlsx / .xls / .csv)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Otomatis mendeteksi <strong>Template Resmi AHASS (PERSEDIAAN &lt;BULAN&gt;.xlsx)</strong> atau file katalog standar.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="self-start sm:self-auto text-xs font-bold text-[#E4002B] hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh contoh format file</span>
                </button>
              </div>

              <form onSubmit={handlePreview} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-[#E4002B] dark:hover:border-[#E4002B] transition bg-slate-50/70 dark:bg-slate-800/40">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    id="excelFile"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="excelFile" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {selectedFile ? selectedFile.name : "Klik untuk memilih file Excel"}
                    </span>
                    <span className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Maksimal ukuran file 10MB
                    </span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedFile || isPreviewing}
                    className="bg-[#E4002B] hover:bg-[#C40024] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isPreviewing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat Preview...</span>
                      </>
                    ) : (
                      <>
                        <span>Preview Data</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Preview & Confirm Table */}
          {previewData && (
            <div
              style={{ "--stagger-index": 1 } as CSSProperties}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6 admin-stagger-item"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Preview Data Excel Batch
                    </h3>
                    {previewData.file_format === "AHASS_DEALER_MONTHLY" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Laporan Resmi AHASS {previewData.periode ? `(${previewData.periode})` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Total Baris: <strong className="text-slate-900 dark:text-white">{previewData.total_rows}</strong> &nbsp;•&nbsp;
                    Baris Valid: <strong className="text-emerald-600 dark:text-emerald-400">{previewData.valid_rows.length}</strong> &nbsp;•&nbsp;
                    Baris Error: <strong className="text-red-600 dark:text-red-400">{previewData.error_rows.length}</strong>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Foto suku cadang yang sudah ada di sistem dijamin 100% aman dan tidak akan terhapus.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirming || previewData.valid_rows.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isConfirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Konfirmasi & Import ({previewData.valid_rows.length} Baris)</span>
                  </button>
                </div>
              </div>

              {/* Error Table if any */}
              {previewData.error_rows.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                    Daftar Baris Bermasalah (Dilewati):
                  </h4>
                  <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                    {previewData.error_rows.map((err, i) => (
                      <li key={i}>
                        Baris {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Data Preview Table */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-auto max-h-96">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 text-xs">
                    <tr>
                      <th className="py-3 px-4">Part No</th>
                      <th className="py-3 px-4">Nama Resmi Part</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Stok Akhir</th>
                      {previewData.file_format === "AHASS_DEALER_MONTHLY" && (
                        <th className="py-3 px-4 text-right">HPP</th>
                      )}
                      <th className="py-3 px-4 text-right">Harga HET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.valid_rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#E4002B] dark:text-red-400">
                          {row.part_no}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {row.part_name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {row.category_detail || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs tabular-nums ${
                              (row.stok ?? 0) > 0
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {row.stok ?? 0} {row.uom || "Pcs"}
                          </span>
                        </td>
                        {previewData.file_format === "AHASS_DEALER_MONTHLY" && (
                          <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                            {formatIDR(row.hpp ?? 0)}
                          </td>
                        )}
                        <td className="py-2.5 px-4 text-right text-slate-900 dark:text-white font-bold tabular-nums">
                          {formatIDR(row.het)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History Section */}
          <div
            style={{ "--stagger-index": 2 } as CSSProperties}
            className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Riwayat Import Spreadsheet
              </h3>
            </div>

            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Waktu Sync</th>
                    <th className="py-3 px-4 text-center">Data Baru</th>
                    <th className="py-3 px-4 text-center">Data Update</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        Memuat riwayat import...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        Belum ada riwayat import data.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{item.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(item.uploaded_at).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{item.inserted_rows}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {item.updated_rows}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider ${
                              item.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
