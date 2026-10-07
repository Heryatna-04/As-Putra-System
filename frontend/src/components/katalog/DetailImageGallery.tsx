"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="bg-slate-100/80 rounded-3xl p-8 flex items-center justify-center relative aspect-square border border-slate-200">
        <div className="text-6xl text-slate-300 font-bold">⚙️</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="bg-slate-100/80 rounded-3xl p-6 flex items-center justify-center relative aspect-square overflow-hidden group border border-slate-200">
        <Image
          src={images[currentIndex]}
          alt={partName}
          width={450}
          height={450}
          priority
          className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${
            !isAvailable ? "grayscale opacity-60" : ""
          }`}
        />

        {/* Zoom Trigger Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          type="button"
          className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md hover:bg-[#FF1E27] hover:text-white text-slate-800 p-2.5 rounded-2xl shadow-md border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ZoomIn className="w-4 h-4" />
          <span>Zoom</span>
        </button>

        {/* Slider Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg hover:bg-[#FF1E27] hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg hover:bg-[#FF1E27] hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              type="button"
              className={`relative w-20 h-20 rounded-2xl border-2 overflow-hidden shrink-0 transition-all bg-slate-50 ${
                idx === currentIndex
                  ? "border-[#FF1E27] ring-2 ring-red-500/20 scale-105"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt="thumbnail"
                fill
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
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 text-slate-800 hover:bg-[#FF1E27] hover:text-white transition-all flex items-center justify-center shadow-sm"
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
                src={images[currentIndex]}
                alt={partName}
                fill
                className="object-contain p-6"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-xl hover:bg-[#FF1E27] hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-900 flex items-center justify-center shadow-xl hover:bg-[#FF1E27] hover:text-white transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto p-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      idx === currentIndex
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
