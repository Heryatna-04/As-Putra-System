"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function KatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Katalog Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] m-6">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="font-display text-2xl font-bold text-[#0A0A0A] mb-3">
        Gagal Memuat Katalog
      </h2>
      <p className="text-sm text-[#8A8A8A] max-w-md mx-auto mb-8 leading-relaxed">
        Maaf, terjadi kesalahan saat mencoba memuat data katalog suku cadang dari server. 
        Silakan coba muat ulang halaman ini dalam beberapa saat.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 bg-[#E8272A] hover:bg-[#C01E21] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#E8272A]/20"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Coba Lagi Sekarang</span>
      </button>
    </div>
  );
}
