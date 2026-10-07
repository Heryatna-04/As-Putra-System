"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ChevronLeft, ChevronRight, ZoomIn, X, Wrench } from "lucide-react";
import { SparePart } from "@/types/spare-part";
import { formatIDR, buildWaUrl } from "@/lib/utils";

interface ProductCardProps {
  part: SparePart;
}

export default function ProductCard({ part }: ProductCardProps) {
  const isAvailable = part.stok > 0;
  const waUrl = buildWaUrl(part.part_no, part.part_name);

  const images = (part.gambar_urls && part.gambar_urls.length > 0)
    ? part.gambar_urls
    : part.gambar_url
    ? [part.gambar_url]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 0) setIsZoomOpen(true);
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl overflow-hidden border border-zinc-200 flex flex-col relative group transition-colors hover:border-zinc-400 ${
          !isAvailable ? "opacity-80" : ""
        }`}
      >
        {/* Card Image Area */}
        <div className="relative aspect-square bg-zinc-50 p-5 flex items-center justify-center overflow-hidden">
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/50 z-10"></div>
          )}

          {/* Status stok */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Stok {part.stok}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-300">
                Stok habis, bisa inden
              </span>
            )}
          </div>

          {/* Aksi cepat: selalu terlihat di layar sentuh, muncul saat hover/fokus di desktop */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity motion-reduce:transition-none">
            {images.length > 0 && (
              <button
                onClick={handleZoom}
                type="button"
                aria-label={`Perbesar foto ${part.part_name}`}
                title="Perbesar foto"
                className="w-10 h-10 rounded-lg bg-white border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                <ZoomIn className="w-4 h-4" aria-hidden />
              </button>
            )}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Tanya ${part.part_name} via WhatsApp`}
              title="Tanya via WhatsApp"
              className="w-10 h-10 rounded-lg bg-white border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
            >
              <MessageSquare className="w-4 h-4" aria-hidden />
            </a>
          </div>

          {/* Slider Arrow Controls (If > 1 Image) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                type="button"
                aria-label="Foto sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border border-zinc-300 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
              </button>
              <button
                onClick={handleNext}
                type="button"
                aria-label="Foto berikutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border border-zinc-300 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>

              {/* Slider Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    type="button"
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? "w-4 bg-[#FFE600]" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Image Content */}
          <Link
            href={`/katalog/${encodeURIComponent(part.part_no)}`}
            className="w-full h-full flex items-center justify-center"
          >
            {images.length > 0 ? (
              <Image
                src={images[currentIndex]}
                alt={part.part_name}
                width={200}
                height={200}
                className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-103 ${
                  !isAvailable ? "grayscale opacity-50" : ""
                }`}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${
                  !isAvailable ? "opacity-30" : "text-slate-300"
                }`}
              >
                <Wrench className="w-10 h-10" />
              </div>
            )}
          </Link>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1">
          {/* Nama umum / Indonesia */}
          <Link
            href={`/katalog/${encodeURIComponent(part.part_no)}`}
            className="text-base font-semibold text-zinc-900 leading-snug mb-1 line-clamp-2 hover:text-[#B00020] hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
          >
            {part.nama_umum || part.part_name}
          </Link>

          {/* Part No & nama resmi AHM */}
          <div className="space-y-0.5 mb-4">
            <div className="text-sm font-medium text-zinc-600 font-mono">
              {part.part_no}
            </div>
            {part.nama_umum && (
              <div className="text-sm text-zinc-600 line-clamp-1">
                {part.part_name}
              </div>
            )}
          </div>

          {/* Footer kartu */}
          <div className="mt-auto pt-4 border-t border-zinc-200 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs text-zinc-600 mb-0.5">Harga HET</div>
              <div className="text-xl font-extrabold text-zinc-900 tracking-tight">
                {formatIDR(part.het)}
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                isAvailable
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" aria-hidden />
              <span>{isAvailable ? "Tanya via WA" : "Tanya inden"}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modal Zoom Foto */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl max-w-3xl w-full p-6 flex flex-col items-center shadow-2xl overflow-hidden border border-slate-700"
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 text-slate-800 hover:bg-[#E4002B] hover:text-white transition-all flex items-center justify-center shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-xs font-mono font-bold text-[#E4002B]">
                {part.part_no}
              </span>
              <h3 className="text-lg font-black text-slate-900">{part.part_name}</h3>
            </div>

            <div className="relative w-full aspect-square max-h-[60vh] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden p-4">
              <Image
                src={images[currentIndex]}
                alt={part.part_name}
                fill
                className="object-contain p-4"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-lg hover:bg-[#E4002B] hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-lg hover:bg-[#E4002B] hover:text-white transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto p-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden transition-all ${
                      idx === currentIndex ? "border-[#FF1E27] scale-105" : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="thumb" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
