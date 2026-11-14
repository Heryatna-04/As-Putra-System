"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Wrench,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SparePart } from "@/types/spare-part";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProgressRing from "@/components/admin/ProgressRing";
import {
  computeStockHealth,
  type SparePartSummary,
} from "@/lib/admin-metrics";

type StaggerStyle = CSSProperties & {
  "--stagger-index": number;
};

const staggerStyle = (index: number): StaggerStyle => ({
  "--stagger-index": index,
});

export default function AdminSparePartsPage() {
  const { token, authFetch } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [summary, setSummary] = useState<SparePartSummary>({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "ready" | "empty" | "critical">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sort, setSort] = useState<string>("name_asc");
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ name: string; count?: number }[]>([]);
  const [page, setPage] = useState<number>(1);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside() {
      setOpenFilterCol(null);
    }
    if (openFilterCol) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [openFilterCol]);

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

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
        const res = await fetch(`${baseUrl}/spare-parts/categories`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

  const fetchParts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (stockStatusFilter !== "all") params.set("stock_status", stockStatusFilter);
      if (sort) params.set("sort", sort);

      const res = await authFetch(`${baseUrl}/admin/spare-parts?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setParts(data.data || []);
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
  }, [token, page, debouncedSearch, statusFilter, categoryFilter, stockStatusFilter, sort, authFetch]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/summary`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setSummary(data.data);
      }
    } catch {
      // ignore non-blocking summary failure
    }
  }, [token, authFetch]);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenCreateModal = useCallback(() => {
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
  }, []);

  // Auto-open create modal if navigated from Dashboard with ?action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreateModal();
    }
  }, [searchParams, handleOpenCreateModal]);

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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
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

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
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

        await authFetch(`${baseUrl}/admin/spare-parts/${partId}/image`, {
          method: "POST",
          body: formDataImage,
        });
      }

      toast.success(editingPart ? "Suku cadang berhasil diperbarui" : "Suku cadang berhasil ditambahkan");
      setIsModalOpen(false);
      fetchParts();
      fetchSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id: string, newStok: number) => {
    if (newStok < 0) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/spare-parts/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stok: newStok }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stok: newStok } : p))
        );
        toast.success("Stok berhasil diperbarui");
        fetchSummary();
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/spare-parts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Suku cadang berhasil dinonaktifkan");
        fetchParts();
        fetchSummary();
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/spare-parts/export`);
      
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

  const stockHealth = computeStockHealth(summary);
  const isActiveSkuCard = statusFilter === "ACTIVE" && stockStatusFilter === "all";
  const isReadyStockCard = stockStatusFilter === "ready";
  const isEmptyStockCard = stockStatusFilter === "empty";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Manajemen Suku Cadang"
        subtitle={`${total > 0 ? total.toLocaleString("id-ID") + "+" : "44.000+"} SKU · harga HET AHM & stok gudang`}
        breadcrumb="Suku Cadang"
        icon={Wrench}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Tambah Part
            </button>
            <button
              type="button"
              onClick={() => {
                fetchParts();
                fetchSummary();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Stock Summary & Readiness Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              aria-pressed={isActiveSkuCard}
              onClick={() => {
                setStatusFilter("ACTIVE");
                setStockStatusFilter("all");
                setPage(1);
              }}
              style={staggerStyle(0)}
              className={`relative overflow-hidden text-left bg-white dark:bg-[#111827] border rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer ${
                isActiveSkuCard
                  ? "border-[#E4002B] ring-2 ring-[#E4002B]/15"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#E4002B]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total SKU Aktif
              </span>
              <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {summary.totalActive.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {summary.totalDiscontinue.toLocaleString("id-ID")} discontinue
              </span>
            </button>

            <button
              type="button"
              aria-pressed={isReadyStockCard}
              onClick={() => {
                setStockStatusFilter("ready");
                setStatusFilter("");
                setPage(1);
              }}
              style={staggerStyle(1)}
              className={`relative overflow-hidden text-left bg-white dark:bg-[#111827] border rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer ${
                isReadyStockCard
                  ? "border-emerald-500 ring-2 ring-emerald-500/15"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Siap Jual (&gt; 0)
              </span>
              <div className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stockHealth.readyCount.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Klik untuk filter Ready Stock
              </span>
            </button>

            <button
              type="button"
              aria-pressed={isEmptyStockCard}
              onClick={() => {
                setStockStatusFilter("empty");
                setStatusFilter("");
                setPage(1);
              }}
              style={staggerStyle(2)}
              className={`relative overflow-hidden text-left bg-white dark:bg-[#111827] border rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer ${
                isEmptyStockCard
                  ? "border-amber-500 ring-2 ring-amber-500/15"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Stok Kosong (0)
              </span>
              <div className="mt-1.5 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {stockHealth.emptyCount.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Klik untuk filter Stok Kosong
              </span>
            </button>

            <div
              style={staggerStyle(3)}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 admin-stagger-item"
            >
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Kesiapan Stok
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {stockHealth.readyPct}% Tersedia
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Dari total SKU aktif
                </p>
              </div>
              <ProgressRing
                percentage={stockHealth.readyPct}
                size={58}
                strokeWidth={6}
                color="#10B981"
                label="Kesiapan Stok"
              />
            </div>
          </div>

          <div
            style={staggerStyle(4)}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#111827]">
              {/* Left Section: Title & Controls */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">Suku Cadang</h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full tabular-nums">
                    {total.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 w-full sm:w-[220px] md:w-[260px] shrink-0">
                  <Search size={15} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kode part / nama..."
                    className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setDebouncedSearch("");
                        setPage(1);
                      }}
                      title="Hapus pencarian"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 shrink-0 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Select Dropdown */}
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kategori:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer w-[130px] sm:w-[150px] truncate [&>option]:bg-white dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} {c.count ? `(${c.count})` : ""}
                      </option>
                    ))}
                  </select>
                  {categoryFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter("");
                        setPage(1);
                      }}
                      title="Reset kategori"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Tabs / Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("");
                      setStockStatusFilter("all");
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      statusFilter === "" && stockStatusFilter === "all"
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-bold"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockStatusFilter(stockStatusFilter === "ready" ? "all" : "ready");
                      setStatusFilter("");
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      stockStatusFilter === "ready"
                        ? "bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800"
                    }`}
                  >
                    Ready Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockStatusFilter(stockStatusFilter === "empty" ? "all" : "empty");
                      setStatusFilter("");
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      stockStatusFilter === "empty"
                        ? "bg-red-600 border-red-600 text-white font-bold shadow-sm"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
                    }`}
                  >
                    Stok Kosong (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockStatusFilter(stockStatusFilter === "critical" ? "all" : "critical");
                      setStatusFilter("");
                      setPage(1);
                    }}
                    title="Sparepart dengan stok habis atau menipis (≤ 3)"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      stockStatusFilter === "critical"
                        ? "bg-amber-500 border-amber-500 text-white font-bold shadow-sm"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Perlu Restock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(statusFilter === "DISCONTINUE" ? "" : "DISCONTINUE");
                      setStockStatusFilter("all");
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                      statusFilter === "DISCONTINUE"
                        ? "bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-white dark:text-slate-900 font-bold shadow-sm"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Discontinue
                  </button>

                  {/* Reset All Filters button if any active */}
                  {(search || categoryFilter || statusFilter || stockStatusFilter !== "all" || sort !== "name_asc") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setDebouncedSearch("");
                        setCategoryFilter("");
                        setStatusFilter("");
                        setStockStatusFilter("all");
                        setSort("name_asc");
                        setPage(1);
                      }}
                      title="Reset semua filter dan pencarian"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Section: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                <button
                  type="button"
                  onClick={() => {
                    fetchParts();
                    fetchSummary();
                  }}
                  disabled={isLoading}
                  title="Segarkan data tabel"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin text-[#E4002B]" : ""} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-emerald-600/30 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <Download size={15} /> Export Excel
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Plus size={15} /> Tambah Manual
                </button>
                <Link
                  href="/admin/import"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
                >
                  <Upload size={15} /> Import Excel
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[500px] bg-white dark:bg-[#111827] pb-20">
              <table className="w-full border-collapse text-left table-fixed min-w-[980px]">
                <colgroup>
                  <col className="w-[50px]" />
                  <col className="w-[160px]" />
                  <col className="w-[280px]" />
                  <col className="w-[140px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[100px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold divide-x divide-slate-200/80 dark:divide-slate-800 select-none">
                    {/* No */}
                    <th className="py-2.5 px-2.5 text-center relative">
                      <div className="flex items-center justify-center gap-1">
                        <span>No</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "no" ? null : "no");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            sort === "newest"
                              ? "bg-[#E4002B] text-white border-[#E4002B]"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter Urutan No"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "no" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urutan Data</div>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("name_asc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "name_asc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span>Standar (A-Z)</span>
                            {sort === "name_asc" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("newest");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "newest" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span>Terbaru Dibuat</span>
                            {sort === "newest" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Kode Item */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Kode Item</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "part_no" ? null : "part_no");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            sort === "part_no_asc" || sort === "part_no_desc"
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter / Sort Kode Item"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "part_no" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urutkan Kode</div>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("part_no_asc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "part_no_asc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowUp size={12} /> Sort A → Z</span>
                            {sort === "part_no_asc" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("part_no_desc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "part_no_desc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowDown size={12} /> Sort Z → A</span>
                            {sort === "part_no_desc" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Nama Produk */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Nama Produk</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "name" ? null : "name");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            sort === "name_asc" || sort === "name_desc"
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter / Sort Nama Produk"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "name" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urutkan Nama</div>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("name_asc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "name_asc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowUp size={12} /> Sort A → Z</span>
                            {sort === "name_asc" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("name_desc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "name_desc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowDown size={12} /> Sort Z → A</span>
                            {sort === "name_desc" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Kategori */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Kategori</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "category" ? null : "category");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            categoryFilter
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter Kategori"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "category" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pilih Kategori</div>
                          <div className="max-h-56 overflow-y-auto space-y-0.5 mt-1 pr-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter("");
                                setOpenFilterCol(null);
                                setPage(1);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                categoryFilter === "" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                              }`}
                            >
                              <span>Semua Kategori</span>
                              {categoryFilter === "" && <Check size={13} />}
                            </button>
                            {categories.map((cat) => (
                              <button
                                key={cat.name}
                                type="button"
                                onClick={() => {
                                  setCategoryFilter(cat.name);
                                  setOpenFilterCol(null);
                                  setPage(1);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                  categoryFilter === cat.name ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                                }`}
                              >
                                <span className="truncate pr-2">{cat.name}</span>
                                {categoryFilter === cat.name && <Check size={13} className="shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>

                    {/* Stok */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Stok</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "stock" ? null : "stock");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            stockStatusFilter !== "all" || sort === "stock_desc" || sort === "stock_asc"
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter / Sort Stok"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "stock" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urutkan Stok</div>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("stock_desc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "stock_desc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowDown size={12} /> Terbanyak → Terkecil</span>
                            {sort === "stock_desc" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("stock_asc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "stock_asc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowUp size={12} /> Terkecil → Terbanyak</span>
                            {sort === "stock_asc" && <Check size={13} />}
                          </button>

                          <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kondisi Stok</div>

                          <button
                            type="button"
                            onClick={() => {
                              setStockStatusFilter("all");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              stockStatusFilter === "all" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span>Semua Stok</span>
                            {stockStatusFilter === "all" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStockStatusFilter("ready");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              stockStatusFilter === "ready" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold" : ""
                            }`}
                          >
                            <span>Ready Stock (&gt; 0)</span>
                            {stockStatusFilter === "ready" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStockStatusFilter("empty");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              stockStatusFilter === "empty" ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span>Stok Kosong (= 0)</span>
                            {stockStatusFilter === "empty" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStockStatusFilter("critical");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              stockStatusFilter === "critical" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold" : ""
                            }`}
                          >
                            <span>Perlu Restock (≤ 3)</span>
                            {stockStatusFilter === "critical" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Harga HET */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Harga HET</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "het" ? null : "het");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            sort === "price_asc" || sort === "price_desc"
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter / Sort Harga HET"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "het" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urutkan Harga</div>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("price_asc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "price_asc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowUp size={12} /> Termurah → Termahal</span>
                            {sort === "price_asc" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSort("price_desc");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              sort === "price_desc" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5"><ArrowDown size={12} /> Termahal → Termurah</span>
                            {sort === "price_desc" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Status */}
                    <th className="py-2.5 px-3 relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">Status</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === "status" ? null : "status");
                          }}
                          className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                            statusFilter
                              ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                          title="Filter Status Produk"
                        >
                          <ChevronDown size={11} className="stroke-[2.5]" />
                        </button>
                      </div>
                      {openFilterCol === "status" && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-left font-normal text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Produk</div>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter("");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              statusFilter === "" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold" : ""
                            }`}
                          >
                            <span>Semua Status</span>
                            {statusFilter === "" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter("ACTIVE");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              statusFilter === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold" : ""
                            }`}
                          >
                            <span>Active</span>
                            {statusFilter === "ACTIVE" && <Check size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter("DISCONTINUE");
                              setOpenFilterCol(null);
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              statusFilter === "DISCONTINUE" ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold" : ""
                            }`}
                          >
                            <span>Discontinue</span>
                            {statusFilter === "DISCONTINUE" && <Check size={13} />}
                          </button>
                        </div>
                      )}
                    </th>

                    {/* Aksi */}
                    <th className="py-2.5 px-3 text-right">
                      <span>Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E4002B]" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Memuat data suku cadang...</span>
                        </div>
                      </td>
                    </tr>
                  ) : parts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-sm text-slate-400 dark:text-slate-500">
                        Tidak ada data suku cadang yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    parts.map((part, idx) => (
                      <tr key={part.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors divide-x divide-slate-200/60 dark:divide-slate-800/70 h-[64px]">
                        {/* No */}
                        <td className="py-2 px-2.5 text-center font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-900/30">
                          {(page - 1) * 15 + idx + 1}
                        </td>

                        {/* Kode Item */}
                        <td className="py-2.5 px-3 font-mono">
                          <span className="text-[11px] font-bold text-[#E4002B] dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 px-2 py-0.5 rounded inline-block">
                            {part.part_no}
                          </span>
                        </td>

                        {/* Nama Produk */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                              {part.gambar_url ? (
                                <Image src={part.gambar_url} alt={part.part_name} width={36} height={36} unoptimized className="w-full h-full object-contain" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">{part.part_name}</span>
                              {part.nama_umum && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">{part.nama_umum}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-2.5 px-3 align-middle">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 truncate max-w-full">
                            {part.category_detail || "UMUM"}
                          </span>
                        </td>

                        {/* Stok */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(part.id, part.stok - 1)}
                                disabled={part.stok <= 0}
                                className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded disabled:opacity-30 transition-colors text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span
                                className={`w-8 text-center text-xs font-bold font-mono tabular-nums ${
                                  part.stok === 0
                                    ? "text-red-600 dark:text-red-400"
                                    : part.stok <= 3
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-700 dark:text-emerald-400"
                                }`}
                              >
                                {part.stok}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(part.id, part.stok + 1)}
                                className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-colors text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* Badge */}
                            {part.stok === 0 ? (
                              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 px-1.5 py-0.5 rounded">
                                Habis
                              </span>
                            ) : part.stok <= 3 ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 px-1.5 py-0.5 rounded">
                                Menipis
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 px-1.5 py-0.5 rounded">
                                Aman
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Harga HET */}
                        <td className="py-2.5 px-3 align-middle">
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">{formatIDR(part.het)}</span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 align-middle">
                          {part.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Disc.
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(part)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            {part.status === "ACTIVE" && (
                              <button
                                type="button"
                                onClick={() => handleDeletePart(part.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Discontinue"
                              >
                                <Trash2 size={14} />
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
            <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Menampilkan halaman <strong className="text-slate-900 dark:text-white font-semibold">{page}</strong> dari total {total.toLocaleString("id-ID")} item
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={parts.length < 15}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-lg w-full p-5 shadow-xl relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                {editingPart ? "Edit Suku Cadang" : "Tambah Suku Cadang"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Part Number (Kode Part) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPart}
                  value={formData.part_no}
                  onChange={(e) => setFormData({ ...formData, part_no: e.target.value })}
                  placeholder="Contoh: 06455-K56-N01"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Nama Resmi Part *
                </label>
                <input
                  type="text"
                  required
                  value={formData.part_name}
                  onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                  placeholder="Contoh: PAD SET, FR BRAKE"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Nama Umum / Alias
                </label>
                <input
                  type="text"
                  value={formData.nama_umum}
                  onChange={(e) => setFormData({ ...formData, nama_umum: e.target.value })}
                  placeholder="Contoh: Kampas Rem Depan"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.category_detail}
                    onChange={(e) => setFormData({ ...formData, category_detail: e.target.value })}
                    placeholder="MAINTENANCE"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Harga HET (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.het}
                    onChange={(e) => setFormData({ ...formData, het: e.target.value })}
                    placeholder="56500"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[13px] focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISCONTINUE">DISCONTINUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1.5">
                  Upload Gambar
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-[#E4002B] hover:bg-[#C40024] rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
