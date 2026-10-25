"use client";

import React from "react";
import { ShoppingBag, MessageSquare } from "lucide-react";
import { usePartInquiry } from "@/context/PartInquiryContext";
import { formatIDR } from "@/lib/utils";

export default function FloatingInquiryBar() {
  const { totalCount, totalEstimate, setIsDrawerOpen, isDrawerOpen } = usePartInquiry();

  if (totalCount === 0 || isDrawerOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white pl-4 pr-5 py-3 rounded-2xl shadow-xl shadow-black/20 border border-zinc-700 transition-all active:scale-95 group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-[#E4002B] flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-zinc-900">
            {totalCount}
          </span>
        </div>

        <div className="text-left">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Daftar Kebutuhan Part</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
              <MessageSquare className="w-2.5 h-2.5" /> WA
            </span>
          </div>
          <div className="text-[11px] text-zinc-300 font-medium">
            Estimasi: <strong className="text-white">{formatIDR(totalEstimate)}</strong>
          </div>
        </div>
      </button>
    </div>
  );
}
