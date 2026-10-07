"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Upload,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SparePart } from "@/types/spare-part";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminSparePartsPage() {
  const { token } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState({
    part_no: "",
    part_name: "",
    nama_umum: "",
    category_detail: "",
    het: "",
    stok: 0,
    status: "ACTIVE",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchParts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (stockFilter) params.set("stock_only", "true");

      const res = await fetch(`${baseUrl}/admin/spare-parts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setParts(data.data);
        setTotal(data.meta.total);
      } else {
        toast.error(data.message || "Gagal memuat data suku cadang");
      }
    } catch (err) {
      console.error("Failed to fetch admin spare parts", err);
      toast.error("Gagal terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, debouncedSearch, statusFilter, stockFilter]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleOpenCreateModal = () => {
    setEditingPart(null);
    setFormData({
      part_no: "",
      part_name: "",
      nama_umum: "",
      category_detail: "",
      het: "",
      stok: 0,
      status: "ACTIVE",
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      part_no: part.part_no,
      part_name: part.part_name,
      nama_umum: part.nama_umum || "",
      category_detail: part.category_detail || "",
      het: part.het ? part.het.toString() : "",
      stok: part.stok,
      status: part.status,
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const payload = {
        part_no: formData.part_no,
        part_name: formData.part_name,
        nama_umum: formData.nama_umum || null,
        category_detail: formData.category_detail || null,
        het: formData.het ? parseFloat(formData.het) : null,
        stok: Number(formData.stok),
        status: formData.status,
      };

      let partId = editingPart?.id;
      let url = `${baseUrl}/admin/spare-parts`;
      let method = "POST";

      if (editingPart) {
        url = `${baseUrl}/admin/spare-parts/${editingPart.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan data suku cadang.");
      }

      if (!editingPart && data.data?.id) {
        partId = data.data.id;
      }

      if (selectedFile && partId) {
        const formDataImage = new FormData();
        formDataImage.append("image", selectedFile);

        await fetch(`${baseUrl}/admin/spare-parts/${partId}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataImage,
        });
      }

      toast.success(editingPart ? "Suku cadang berhasil diperbarui" : "Suku cadang berhasil ditambahkan");
      setIsModalOpen(false);
      fetchParts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id: string, newStok: number) => {
    if (newStok < 0) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/spare-parts/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stok: newStok }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stok: newStok } : p))
        );
        toast.success("Stok berhasil diperbarui");
      } else {
        toast.error(data.message || "Gagal mengupdate stok");
      }
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Terjadi kesalahan saat menghubungi server.");
    }
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan suku cadang ini (Status: DISCONTINUE)?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/spare-parts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Suku cadang berhasil dinonaktifkan");
        fetchParts();
      } else {
        toast.error("Gagal menonaktifkan suku cadang");
      }
    } catch (err) {
      console.error("Gagal menghapus part", err);
      toast.error("Terjadi kesalahan saat menghubungi server");
    }
  };

  const handleExport = async () => {
    const exportToast = toast.loading("Mempersiapkan data export...");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/admin/spare-parts/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Gagal mengunduh file export");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Katalog_AS_Putra.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data berhasil diexport!", { id: exportToast });
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat export data.", { id: exportToast });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="h-[52px] bg-white border-b border-zinc-200 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>Admin</span>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-900">Suku Cadang</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Table Container */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-zinc-200 flex flex-wrap items-center gap-4">
              <h3 className="text-base font-semibold text-zinc-900 mr-2">Suku Cadang</h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {total} total
              </span>

              {/* Search */}
              <div className="flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-500 bg-white min-w-[240px]">
                <Search size={16} className="shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari part number atau nama..."
                  className="w-full text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => { setStatusFilter(""); setStockFilter(false); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                    statusFilter === "" && !stockFilter
                      ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => { setStockFilter(!stockFilter); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                    stockFilter 
                      ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  Ready Stock
                </button>
                <button
                  onClick={() => { setStatusFilter(statusFilter === "DISCONTINUE" ? "" : "DISCONTINUE"); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                    statusFilter === "DISCONTINUE"
                      ? "bg-red-50 border-red-200 text-red-600 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  Discontinue
                </button>
              </div>

              {/* Actions */}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-white border border-green-600/30 text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Download size={16} /> Export Excel
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Plus size={16} /> Tambah Manual
                </button>
                <Link
                  href="/admin/import"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                >
                  <Upload size={16} /> Import Excel
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#FAFAFA] border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Produk</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Harga HET</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kategori</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-center">Stok</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                        Memuat data suku cadang...
                      </td>
                    </tr>
                  ) : parts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                        Tidak ada data suku cadang yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    parts.map((part) => (
                      <tr key={part.id} className="group hover:bg-[#FAFAFA] transition-colors border-b border-zinc-100 last:border-b-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-white border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                              {part.gambar_url ? (
                                <Image src={part.gambar_url} alt={part.part_name} width={40} height={40} unoptimized className="w-full h-full object-contain" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-zinc-300" />
                              )}
                            </div>
                            <div>
                              <span className="text-[11px] font-mono font-bold text-[#E4002B] bg-red-50 border border-red-200/60 px-2 py-0.5 rounded inline-block mb-1">
                                {part.part_no}
                              </span>
                              <span className="text-sm font-bold text-zinc-900 block leading-tight">{part.part_name}</span>
                              {part.nama_umum && (
                                <span className="text-xs text-zinc-500 font-medium block mt-0.5">{part.nama_umum}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="text-base font-bold text-zinc-900">{formatIDR(part.het)}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/50">
                            {part.category_detail || "UMUM"}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleUpdateStock(part.id, part.stok - 1)}
                              disabled={part.stok <= 0}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded disabled:opacity-40 transition-colors"
                            >
                              -
                            </button>
                            <span
                              className={`w-8 text-sm font-bold ${
                                part.stok > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {part.stok}
                            </span>
                            <button
                              onClick={() => handleUpdateStock(part.id, part.stok + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {part.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Disc.
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(part)}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            {part.status === "ACTIVE" && (
                              <button
                                onClick={() => handleDeletePart(part.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Discontinue"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-5 py-4 border-t border-zinc-200 bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-base text-zinc-500">
                Menampilkan halaman <strong className="text-zinc-900 font-semibold">{page}</strong> dari total {total} item
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-zinc-200 rounded-md text-base font-medium text-zinc-600 bg-white hover:bg-zinc-50 transition-colors disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={parts.length < 15}
                  className="px-4 py-2 border border-zinc-200 rounded-md text-base font-medium text-zinc-600 bg-white hover:bg-zinc-50 transition-colors disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl relative border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h3 className="text-[15px] font-bold text-zinc-900 tracking-tight">
                {editingPart ? "Edit Suku Cadang" : "Tambah Suku Cadang"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                  Part Number (Kode Part) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPart}
                  value={formData.part_no}
                  onChange={(e) => setFormData({ ...formData, part_no: e.target.value })}
                  placeholder="Contoh: 06455-K56-N01"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                  Nama Resmi Part *
                </label>
                <input
                  type="text"
                  required
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  placeholder="Contoh: PAD SET, FR BRAKE"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                  Nama Umum / Alias
                </label>
                <input
                  type="text"
                  value={formData.nama_umum}
                  onChange={(e) => setFormData({ ...formData, nama_umum: e.target.value })}
                  placeholder="Contoh: Kampas Rem Depan"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.category_detail}
                    onChange={(e) => setFormData({ ...formData, category_detail: e.target.value })}
                    placeholder="MAINTENANCE"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                    Harga HET (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.het}
                    onChange={(e) => setFormData({ ...formData, het: e.target.value })}
                    placeholder="56500"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISCONTINUE">DISCONTINUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 mb-1.5">
                  Upload Gambar
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
