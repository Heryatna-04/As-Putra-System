"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatIDR } from "@/lib/utils";

interface ValidImportRow {
  part_no: string;
  part_name: string;
  category_detail?: string | null;
  het?: number | null;
}

interface PreviewData {
  batch_id: string;
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

export default function AdminImportPage() {
  const { token } = useAuth();
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/imports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat import", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, fetchHistory]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsPreviewing(true);
    setErrorMsg(null);
    setPreviewData(null);
    setConfirmResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${baseUrl}/admin/import/spare-parts/preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/import/spare-parts/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batch_id: previewData.batch_id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengonfirmasi impor data.");
      }

      setConfirmResult(data.data);
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
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50">
      {/* Topbar Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Import Excel Suku Cadang</h2>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>Admin</span>
            <span className="mx-2">•</span>
            <span className="text-[#E8272A] font-medium">Upload & Synchronize</span>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 max-w-6xl">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {confirmResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
            <div>
              <p className="font-bold">Proses Import Berhasil Selesai!</p>
              <p className="text-sm text-green-600 mt-0.5">
                Ditambahkan: <strong>{confirmResult.inserted_rows}</strong> data baru &nbsp;•&nbsp;
                Diperbarui: <strong>{confirmResult.updated_rows}</strong> data lama
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Upload Card */}
        {!previewData && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#E8272A]/10 text-[#E8272A] flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload File Spreadsheet (.xlsx / .xls)</h3>
                <p className="text-sm text-gray-500">
                  Pastikan header kolom menyertakan: <code>part_no</code>, <code>part_name</code>, <code>category_detail</code>, <code>het</code>.
                </p>
              </div>
            </div>

            <form onSubmit={handlePreview} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#E8272A] transition bg-gray-50/50">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  id="excelFile"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="excelFile" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-bold text-gray-700">
                    {selectedFile ? selectedFile.name : "Klik untuk memilih file Excel"}
                  </span>
                  <span className="text-sm text-gray-400 mt-1">Maksimal ukuran file 10MB</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isPreviewing}
                  className="bg-[#E8272A] hover:bg-[#C01E21] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Preview Data Excel Batch</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Total Baris: <strong>{previewData.total_rows}</strong> &nbsp;•&nbsp;
                  Baris Valid: <strong className="text-green-600">{previewData.valid_rows.length}</strong> &nbsp;•&nbsp;
                  Baris Error: <strong className="text-red-600">{previewData.error_rows.length}</strong>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming || previewData.valid_rows.length === 0}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isConfirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Konfirmasi & Import ({previewData.valid_rows.length} Baris)</span>
                </button>
              </div>
            </div>

            {/* Error Table if any */}
            {previewData.error_rows.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2">
                  Daftar Baris Bermasalah (Dilewati):
                </h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {previewData.error_rows.map((err, i) => (
                    <li key={i}>
                      Baris {err.row}: {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Valid Data Preview Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Part No</th>
                    <th className="py-3 px-4">Nama Resmi Part</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga HET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.valid_rows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#E8272A]">{row.part_no}</td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{row.part_name}</td>
                      <td className="py-2.5 px-4 text-gray-600">{row.category_detail || "—"}</td>
                      <td className="py-2.5 px-4 text-gray-900">{formatIDR(row.het)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Riwayat Import Spreadsheet</h3>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Waktu Sync</th>
                  <th className="py-3 px-4 text-center">Data Baru</th>
                  <th className="py-3 px-4 text-center">Data Update</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Memuat riwayat import...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Belum ada riwayat import data.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{item.file_name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(item.uploaded_at).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-green-600">
                        +{item.inserted_rows}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">
                        {item.updated_rows}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider ${
                            item.status === "COMPLETED"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
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
  );
}
