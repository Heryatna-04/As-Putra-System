"use client";

import React from "react";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { usePartInquiry } from "@/context/PartInquiryContext";
import type { SparePart } from "@/types/spare-part";

interface AddToInquiryButtonProps {
  part: SparePart;
}

export default function AddToInquiryButton({ part }: AddToInquiryButtonProps) {
  const { addItem, isInInquiry, setIsDrawerOpen } = usePartInquiry();
  const inList = isInInquiry(part.part_no);

  return (
    <button
      type="button"
      onClick={() => {
        if (!inList) {
          addItem(part, 1);
        } else {
          setIsDrawerOpen(true);
        }
      }}
      className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
        inList
          ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
          : "bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400"
      }`}
    >
      {inList ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Tercatat di Daftar Part (Buka List)</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 text-[#E4002B]" />
          <span>+ Tambah ke Daftar Part WA (Multi-Item)</span>
        </>
      )}
    </button>
  );
}
