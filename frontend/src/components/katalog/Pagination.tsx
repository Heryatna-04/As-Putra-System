"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { totalPages } from "@/lib/utils";

interface PaginationProps {
  total: number;
  limit: number;
  currentPage: number;
}

const BUTTON_BASE =
  "flex h-10 min-w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]";

function PaginationContent({ total, limit, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maxPages = totalPages(total, limit);

  if (maxPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page < 1 || page > maxPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/katalog?${params.toString()}`);
  };

  const renderPageButtons = () => {
    const pages = [];
    const showRange = 2;

    for (let i = 1; i <= maxPages; i++) {
      if (
        i === 1 ||
        i === maxPages ||
        (i >= currentPage - showRange && i <= currentPage + showRange)
      ) {
        const isCurrent = i === currentPage;
        pages.push(
          <button
            key={i}
            type="button"
            onClick={() => goToPage(i)}
            aria-label={`Halaman ${i}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`${BUTTON_BASE} px-3 ${
              isCurrent
                ? "border-[#E4002B] bg-[#E4002B] text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {i}
          </button>
        );
      } else if (
        (i === currentPage - showRange - 1 && i > 1) ||
        (i === currentPage + showRange + 1 && i < maxPages)
      ) {
        pages.push(
          <span key={`dots-${i}`} aria-hidden className="px-1 font-semibold text-zinc-500">
            …
          </span>
        );
      }
    }

    return pages;
  };

  return (
    <nav aria-label="Navigasi halaman" className="mb-4 mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
        className={`${BUTTON_BASE} w-10 border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>

      {renderPageButtons()}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === maxPages}
        aria-label="Halaman berikutnya"
        className={`${BUTTON_BASE} w-10 border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </nav>
  );
}

export default function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationContent {...props} />
    </Suspense>
  );
}
