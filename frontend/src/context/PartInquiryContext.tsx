"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SparePart } from "@/types/spare-part";

export interface InquiryItem {
  part_no: string;
  part_name: string;
  nama_umum: string | null;
  het: number;
  stok: number;
  gambar_url: string | null;
  quantity: number;
}

interface PartInquiryContextType {
  items: InquiryItem[];
  addItem: (part: SparePart, quantity?: number) => void;
  removeItem: (partNo: string) => void;
  updateQuantity: (partNo: string, delta: number) => void;
  clearItems: () => void;
  isInInquiry: (partNo: string) => boolean;
  totalCount: number;
  totalEstimate: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  generateWaUrl: () => string;
}

const PartInquiryContext = createContext<PartInquiryContextType | undefined>(undefined);

const STORAGE_KEY = "as_putra_part_inquiry_v1";
const WA_PHONE = "6281111116408";

export function PartInquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore JSON error
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota
    }
  }, [items, isMounted]);

  const addItem = (part: SparePart, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.part_no === part.part_no);
      if (existing) {
        return prev.map((i) =>
          i.part_no === part.part_no
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          part_no: part.part_no,
          part_name: part.part_name,
          nama_umum: part.nama_umum,
          het: part.het ?? 0,
          stok: part.stok,
          gambar_url: part.gambar_url || (part.gambar_urls && part.gambar_urls[0]) || null,
          quantity,
        },
      ];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (partNo: string) => {
    setItems((prev) => prev.filter((i) => i.part_no !== partNo));
  };

  const updateQuantity = (partNo: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.part_no === partNo) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter((i): i is InquiryItem => i !== null)
    );
  };

  const clearItems = () => {
    setItems([]);
  };

  const isInInquiry = (partNo: string) => {
    return items.some((i) => i.part_no === partNo);
  };

  const totalCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const totalEstimate = items.reduce(
    (acc, curr) => acc + curr.het * curr.quantity,
    0
  );

  const generateWaUrl = () => {
    if (items.length === 0) {
      return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent("Halo AHASS AS Putra Rahmat, saya ingin menanyakan ketersediaan suku cadang.")}`;
    }

    const itemsText = items
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.nama_umum || item.part_name}*\n   Kode Part: \`${item.part_no}\`\n   Jumlah: ${item.quantity} pcs\n   HET: Rp ${item.het.toLocaleString("id-ID")}`
      )
      .join("\n\n");

    const text = `Halo AHASS AS Putra Rahmat, saya ingin menanyakan ketersediaan & memesan suku cadang berikut:\n\n${itemsText}\n\n*Total Estimasi: Rp ${totalEstimate.toLocaleString("id-ID")}*\n\nApakah barang-barang di atas ready stok di bengkel? Terima kasih.`;

    return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
  };

  return (
    <PartInquiryContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearItems,
        isInInquiry,
        totalCount,
        totalEstimate,
        isDrawerOpen,
        setIsDrawerOpen,
        generateWaUrl,
      }}
    >
      {children}
    </PartInquiryContext.Provider>
  );
}

export function usePartInquiry() {
  const context = useContext(PartInquiryContext);
  if (!context) {
    throw new Error("usePartInquiry must be used within a PartInquiryProvider");
  }
  return context;
}
