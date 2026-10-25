"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { usePartInquiry } from "@/context/PartInquiryContext";
import { formatIDR } from "@/lib/utils";

export default function PartInquiryDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    removeItem,
    updateQuantity,
    clearItems,
    totalCount,
    totalEstimate,
    generateWaUrl,
  } = usePartInquiry();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E4002B]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Daftar Kebutuhan Part</span>
                  {totalCount > 0 && (
                    <span className="rounded-full bg-[#E4002B] px-2 py-0.5 text-xs font-bold text-white">
                      {totalCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-500">Tanyakan &amp; cek stok ke WA admin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 mb-1">
                  Daftar Part Masih Kosong
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mb-6">
                  Pilih suku cadang dari katalog dan klik tombol &quot;+ Catat Part&quot; untuk mengumpulkan barang yang ingin dicek sekaligus ke WA.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition"
                >
                  Jelajahi Katalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 pb-1">
                  <span>Barang yang dipilih:</span>
                  <button
                    type="button"
                    onClick={clearItems}
                    className="text-[#E4002B] hover:underline font-semibold"
                  >
                    Kosongkan Semua
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.part_no}
                    className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex gap-3 items-start"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {item.gambar_url ? (
                        <Image
                          src={item.gambar_url}
                          alt={item.part_name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-400 text-center leading-tight">
                          AHM<br />PARTS
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2">
                        {item.nama_umum || item.part_name}
                      </h4>
                      <p className="text-[11px] font-mono font-medium text-zinc-500 mt-0.5">
                        {item.part_no}
                      </p>
                      <p className="text-xs font-extrabold text-emerald-700 mt-1">
                        {formatIDR(item.het)}
                      </p>

                      {/* Stepper & Delete */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center border border-zinc-300 rounded-lg bg-zinc-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.part_no, -1)}
                            className="p-1 px-2 text-zinc-600 hover:bg-zinc-200 transition-colors"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-zinc-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.part_no, 1)}
                            className="p-1 px-2 text-zinc-600 hover:bg-zinc-200 transition-colors"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.part_no)}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Hapus dari daftar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200 bg-zinc-50/90 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 font-medium">
                  Estimasi Total ({totalCount} item):
                </span>
                <span className="font-extrabold text-base text-zinc-900">
                  {formatIDR(totalEstimate)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Harga mengacu pada HET resmi AHM (belum termasuk ongkos pasang).</span>
              </div>

              <a
                href={generateWaUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Kirim Daftar Part ke WhatsApp AHASS</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2 text-center text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                + Tambah Part Lain dari Katalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
