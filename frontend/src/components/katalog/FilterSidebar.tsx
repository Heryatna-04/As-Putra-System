"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Layers, SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterSidebarProps {
  categories?: { name: string; count: number }[];
  totalParts?: number;
}

/** Satu baris kategori. Aktif: latar merah muda + teks merah tua (bukan blok merah solid). */
function CategoryButton({
  label,
  count,
  active,
  icon: Icon,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  icon: typeof Package;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#E4002B] ${
        active
          ? "bg-red-50 font-semibold text-[#B00020]"
          : "font-medium text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#B00020]" : "text-zinc-500"}`} aria-hidden />
      <span className="flex-1 truncate" title={label}>
        {label}
      </span>
      {count > 0 && (
        <span className={`text-xs tabular-nums ${active ? "text-[#B00020]" : "text-zinc-500"}`}>
          {count.toLocaleString("id-ID")}
        </span>
      )}
    </button>
  );
}

function FilterSidebarContent({ categories = [], totalParts = 0 }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const stockOnly = searchParams.get("stock_only") === "true";

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/katalog?${params.toString()}`);
    setIsMobileOpen(false);
  };

  return (
    <aside
      aria-label="Filter katalog"
      className="w-full shrink-0 border-b border-zinc-200 bg-white p-4 sm:p-5 lg:sticky lg:top-[115px] lg:h-[calc(100vh-115px)] lg:w-[272px] lg:overflow-y-auto lg:border-b-0 lg:border-r"
    >
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-800 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#E4002B]" />
          <span>Filter & Kategori</span>
          {currentCategory && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-[#B00020]">
              {currentCategory}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isMobileOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Content Container (Collapsible on mobile, always visible on desktop) */}
      <div className={`mt-4 lg:mt-0 ${isMobileOpen ? "block" : "hidden lg:block"}`}>
        {/* Kategori */}
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Kategori</h2>
        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1 lg:max-h-[480px]">
          <CategoryButton
            label="Semua spare part"
            count={totalParts}
            active={currentCategory === ""}
            icon={Package}
            onSelect={() => updateParam("category", null)}
          />
          {categories.map((cat) => (
            <CategoryButton
              key={cat.name}
              label={cat.name}
              count={cat.count}
              active={currentCategory.toLowerCase() === cat.name.toLowerCase()}
              icon={Layers}
              onSelect={() => updateParam("category", cat.name)}
            />
          ))}
        </div>

        <hr className="my-6 border-zinc-200" />

        {/* Ketersediaan */}
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Ketersediaan</h2>
        <button
          type="button"
          role="switch"
          aria-checked={stockOnly}
          onClick={() => updateParam("stock_only", stockOnly ? null : "true")}
          className="flex w-full items-center justify-between gap-4 rounded-md border border-zinc-200 px-3 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#E4002B]"
        >
          <span>
            <span className="block text-sm font-semibold text-zinc-900">Hanya yang ready</span>
            <span className="mt-0.5 block text-sm text-zinc-600">Sembunyikan part yang stoknya habis</span>
          </span>
          <span
            aria-hidden
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${
              stockOnly ? "bg-[#E4002B]" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${
                stockOnly ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <Suspense fallback={<aside className="w-full p-5 lg:w-[272px]" />}>
      <FilterSidebarContent {...props} />
    </Suspense>
  );
}
