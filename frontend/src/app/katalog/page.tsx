import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { fetchCatalog, fetchCategories } from "@/lib/api";
import { buildWaUrl } from "@/lib/utils";
import type { SparePart } from "@/types/spare-part";
import FilterSidebar from "@/components/katalog/FilterSidebar";
import HeroBanner from "@/components/katalog/HeroBanner";
import Toolbar from "@/components/katalog/Toolbar";
import ProductCard from "@/components/katalog/ProductCard";
import Pagination from "@/components/katalog/Pagination";

export const metadata: Metadata = {
  title: "Katalog Spare Part Honda Asli | Harga HET AHM",
  description:
    "Cari suku cadang asli Honda dengan harga HET resmi AHM. Lebih dari 44.000 part tersedia: oli, kampas rem, filter, busi, ban, dan lainnya. AHASS AS Putra Kuningan.",
  alternates: {
    canonical: "https://asputra.vercel.app/katalog",
  },
};


interface KatalogPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    limit?: string;
    sort?: string;
    stock_only?: string;
  }>;
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "12", 10);

  const queryParams: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };

  if (params.search) queryParams.search = params.search;
  if (params.category) queryParams.category = params.category;
  if (params.sort) queryParams.sort = params.sort;
  if (params.stock_only) queryParams.stock_only = params.stock_only;

  let catalogData: { data: SparePart[]; meta: { page: number; limit: number; total: number } } = {
    data: [],
    meta: { page: 1, limit: 12, total: 0 },
  };

  let categoryData = {
    total: 0,
    categories: [] as { name: string; count: number }[],
  };

  const [resCatalog, resCategories] = await Promise.all([
    fetchCatalog(queryParams),
    fetchCategories(),
  ]);

  if (resCatalog.success) {
    catalogData = {
      data: resCatalog.data,
      meta: resCatalog.meta,
    };
  }

  if (resCategories.success) {
    categoryData = resCategories.data;
  }

  const hasActiveFilter = Boolean(params.search || params.category || params.stock_only);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-68px)]">
      {/* Sidebar filter kategori */}
      <FilterSidebar
        categories={categoryData.categories}
        totalParts={categoryData.total}
      />

      {/* Area utama */}
      <main className="min-w-0 flex-1 bg-zinc-50 p-5 sm:p-8">
        <HeroBanner totalParts={categoryData.total || catalogData.meta.total} />

        <Toolbar totalItems={catalogData.meta.total} />

        {catalogData.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {catalogData.data.map((part) => (
              <ProductCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-14 text-center">
            <SearchX className="mx-auto h-10 w-10 text-zinc-400" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              Spare part tidak ditemukan
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base text-zinc-600">
              Coba kata kunci yang lebih pendek, periksa kode part, atau hapus filter yang aktif.
              Bisa juga tanya langsung ke tim kami.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {hasActiveFilter && (
                <Link
                  href="/katalog"
                  className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  Hapus semua filter
                </Link>
              )}
              <a
                href={buildWaUrl("BENGKEL", params.search ? `Cari part: ${params.search}` : "Cari spare part")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Tanya via WhatsApp
              </a>
            </div>
          </div>
        )}

        <Pagination
          total={catalogData.meta.total}
          limit={catalogData.meta.limit}
          currentPage={catalogData.meta.page}
        />
      </main>
    </div>
  );
}
