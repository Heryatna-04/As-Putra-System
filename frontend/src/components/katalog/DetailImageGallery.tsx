"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X, Wrench } from "lucide-react";

interface DetailImageGalleryProps {
  images: string[];
  partName: string;
  partNo: string;
  isAvailable: boolean;
}

export default function DetailImageGallery({
  images,
  partName,
  partNo,
  isAvailable,
}: DetailImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const validImages = images.filter((img) => !failedUrls.has(img));
  const activeIndex = currentIndex >= validImages.length ? 0 : currentIndex;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  if (validImages.length === 0) {
    return (
      <div className="bg-gradient-to-b from-zinc-50 to-red-50/20 rounded-3xl p-8 flex flex-col items-center justify-center relative aspect-square border border-dashed border-zinc-200 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100/80 text-[#E4002B] flex items-center justify-center mb-3 shadow-xs">
          <Wrench className="w-8 h-8" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#B00020] bg-red-50 border border-red-200/80 px-3 py-1 rounded-md mb-2">
          AHM Genuine Parts 100% Original
        </span>
        <span className="text-sm font-mono font-bold text-zinc-700 mb-1">
          NO. PART: {partNo}
        </span>
        <span className="text-xs text-zinc-500 font-medium max-w-xs">
          {partName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="bg-slate-100/80 rounded-3xl p-6 flex items-center justify-center relative aspect-square overflow-hidden group border border-slate-200">
        <Image
          src={validImages[activeIndex]}
          alt={partName}
          width={450}
          height={450}
          priority
          onError={() => handleImageError(validImages[activeIndex])}
          className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${
            !isAvailable ? "grayscale opacity-60" : ""
          }`}
        />

        {/* Zoom Trigger Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          type="button"
          className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md hover:bg-[#FF1E27] hover:text-white text-slate-800 p-2.5 rounded-2xl shadow-md border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
          <span>Zoom</span>
        </button>

        {/* Slider Controls */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              type="button"
              className={`relative w-20 h-20 rounded-2xl border-2 overflow-hidden shrink-0 transition-all bg-slate-50 cursor-pointer ${
                idx === activeIndex
                  ? "border-[#FF1E27] ring-2 ring-red-500/20 scale-105"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                onError={() => handleImageError(img)}
                className="object-contain p-2 mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal Fullscreen Zoom */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 flex flex-col items-center shadow-2xl overflow-hidden border border-slate-700"
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 text-slate-800 hover:bg-[#FF1E27] hover:text-white transition-all flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-xs font-mono font-bold text-[#FF1E27]">
                {partNo}
              </span>
              <h3 className="text-xl font-black text-slate-900">{partName}</h3>
            </div>

            <div className="relative w-full aspect-square max-h-[65vh] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden p-6">
              <Image
                src={validImages[activeIndex]}
                alt={partName}
                fill
                className="object-contain p-6"
              />

              {validImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-xl hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-xl hover:bg-[#FF1E27] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {validImages.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto p-1">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                      idx === activeIndex
                        ? "border-[#FF1E27] scale-105"
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt="thumb"
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
