"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X, RotateCcw } from "lucide-react";

interface ToolbarProps {
  totalItems: number;
}

function ToolbarContent({ totalItems }: ToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "name_asc";
  const searchTerm = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const stockOnly = searchParams.get("stock_only") === "true";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.set("page", "1");
    router.push(`/katalog?${params.toString()}`);
  };

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    return `/katalog?${params.toString()}`;
  };

  const hasActiveFilters = Boolean(searchTerm || currentCategory || stockOnly);

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base text-zinc-700 mr-1">
          <strong className="font-display text-xl font-extrabold text-zinc-900">
            {totalItems.toLocaleString("id-ID")}
          </strong>{" "}
          produk ditemukan
        </p>

        {searchTerm && (
          <Link
            href={removeParam("search")}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white py-1 pl-3 pr-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
            title="Hapus pencarian kata kunci"
          >
            <span>Cari: “{searchTerm}”</span>
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </Link>
        )}

        {currentCategory && (
          <Link
            href={removeParam("category")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-1 pl-3 pr-2 text-xs font-semibold text-[#B00020] transition-colors hover:bg-red-100"
            title="Hapus filter kategori"
          >
            <span>Kategori: {currentCategory}</span>
            <X className="h-3.5 w-3.5 text-[#B00020]" />
          </Link>
        )}

        {stockOnly && (
          <Link
            href={removeParam("stock_only")}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-3 pr-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            title="Hapus filter stok"
          >
            <span>Hanya Stok Ready</span>
            <X className="h-3.5 w-3.5 text-emerald-700" />
          </Link>
        )}

        {hasActiveFilters && (
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#E4002B] hover:text-[#B00020] underline ml-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Semua</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <label htmlFor="catalog-sort" className="text-sm text-zinc-600">
          Urutkan
        </label>
        <select
          id="catalog-sort"
          value={currentSort}
          onChange={handleSortChange}
          className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition-colors hover:border-zinc-500 focus-visible:border-[#E4002B] focus-visible:ring-2 focus-visible:ring-[#E4002B]/30"
        >
          <option value="name_asc">Nama (A - Z)</option>
          <option value="name_desc">Nama (Z - A)</option>
          <option value="price_asc">Harga termurah</option>
          <option value="price_desc">Harga termahal</option>
          <option value="newest">Terbaru</option>
        </select>
      </div>
    </div>
  );
}

export default function Toolbar({ totalItems }: ToolbarProps) {
  return (
    <Suspense fallback={<div className="mb-6 h-10" />}>
      <ToolbarContent totalItems={totalItems} />
    </Suspense>
  );
}
