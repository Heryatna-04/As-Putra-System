"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

interface ToolbarProps {
  totalItems: number;
}

function ToolbarContent({ totalItems }: ToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "relevance";
  const searchTerm = searchParams.get("search") || "";

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.set("page", "1");
    router.push(`/katalog?${params.toString()}`);
  };

  /** URL katalog tanpa kata kunci pencarian, filter lain dipertahankan */
  const clearSearchHref = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    return `/katalog?${params.toString()}`;
  })();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-base text-zinc-700">
          <strong className="font-display text-xl font-extrabold text-zinc-900">
            {totalItems.toLocaleString("id-ID")}
          </strong>{" "}
          produk ditemukan
        </p>
        {searchTerm && (
          <Link
            href={clearSearchHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white py-1 pl-3 pr-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            aria-label={`Hapus pencarian ${searchTerm}`}
          >
            “{searchTerm}”
            <X className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="catalog-sort" className="text-sm text-zinc-600">
          Urutkan
        </label>
        <select
          id="catalog-sort"
          value={currentSort}
          onChange={handleSortChange}
          className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition-colors hover:border-zinc-500 focus-visible:border-[#E4002B] focus-visible:ring-2 focus-visible:ring-[#E4002B]/30"
        >
          <option value="relevance">Paling relevan</option>
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
