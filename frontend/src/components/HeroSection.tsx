"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CalendarDays,
  ArrowRight,
  Star,
} from "lucide-react";

interface HeroSectionProps {
  totalParts: number;
}

export default function HeroSection({ totalParts }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#E4002B] text-white border-b-4 border-[#A3001D]">
      {/* Real Dealer Background Image */}
      <Image
        src="/as-putra-dealer.png"
        alt="Gedung dealer dan bengkel resmi Honda AS Putra Motor di Kuningan"
        fill
        priority
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover object-center opacity-45 sm:opacity-65 transition-opacity duration-700"
      />

      {/* Iconic Honda Red Gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#E4002B]/95 via-[#D50027]/90 to-[#B00020]/95 sm:bg-gradient-to-r sm:from-[#E4002B] sm:via-[#E4002B]/90 sm:to-[#B00020]/95"
      />

      {/* Giant Faint Honda Wing Watermark */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute -right-16 -bottom-16 w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] opacity-[0.08] -z-10"
      >
        <Image
          src="/honda-logo.png"
          alt=""
          fill
          className="object-contain brightness-0 invert"
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-10 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
        {/* Official Honda Fascia Badge */}
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-black/25 backdrop-blur-xs border border-white/25 pl-3 pr-4 py-1.5 text-xs font-bold tracking-wide text-white mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#E4002B]">
            AHASS 10870
          </span>
          <span>Dealer &amp; Bengkel Resmi Honda Kuningan</span>
          <span className="text-white/50">•</span>
          <span className="italic font-extrabold tracking-wider">One Heart.</span>
        </div>

        <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-balance drop-shadow-xs max-w-4xl mx-auto">
          Suku Cadang Asli Honda &amp; Servis Resmi AHASS.
        </h1>

        <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/95 max-w-2xl mx-auto">
          Cek langsung{" "}
          <strong className="font-extrabold text-white underline decoration-white/50 underline-offset-4">
            {totalParts > 0
              ? `${totalParts.toLocaleString("id-ID")} SKU Honda Genuine Parts`
              : "ribuan SKU Honda Genuine Parts"}
          </strong>{" "}
          dengan harga HET resmi PT Astra Honda Motor, atau booking antrean pit servis tanpa antre.
        </p>

        {/* Pencarian utama: bergaya Katalog Elektronik Resmi AHM */}
        <form action="/katalog" method="get" role="search" className="mt-8 max-w-2xl mx-auto">
          <label htmlFor="hero-search" className="sr-only">
            Cari spare part Honda di Kuningan
          </label>
          <div className="rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 ring-1 ring-white/40 focus-within:ring-4 focus-within:ring-white/50">
            <div className="flex items-stretch">
              <div className="flex items-center pl-3.5 pr-1 text-[#E4002B]">
                <Search className="w-5 h-5 stroke-[2.5]" aria-hidden />
              </div>
              <input
                id="hero-search"
                name="search"
                type="search"
                autoComplete="off"
                placeholder="Ketik nama part atau kode AHM (contoh: Kampas Rem, 23100-KZR)..."
                className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm sm:text-base font-medium text-zinc-900 placeholder:text-zinc-400 outline-none text-left"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#E4002B] hover:bg-[#B8001F] px-6 sm:px-8 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                Cari Part
              </button>
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-white">
            <span className="font-bold uppercase tracking-wider text-[11px] text-white/85 mr-1">
              Pencarian Cepat:
            </span>
            {[
              { label: "Oli AHM MPX2", query: "Oli MPX2" },
              { label: "Kampas Rem", query: "Kampas Rem" },
              { label: "V-Belt Kit", query: "Belt" },
              { label: "Busi NGK/Denso", query: "Busi" },
              { label: "Filter Udara", query: "Filter" },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={`/katalog?search=${encodeURIComponent(chip.query)}`}
                className="inline-flex items-center rounded-md bg-black/25 hover:bg-white hover:text-[#E4002B] px-2.5 py-1 font-semibold text-white transition-all border border-white/25 active:scale-95"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </form>

        {/* Bottom Hero Action & Trust */}
        <div className="mt-10 pt-6 border-t border-white/20 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-white">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-[#E4002B] shadow-lg hover:bg-zinc-100 transition active:scale-95"
          >
            <CalendarDays className="w-4 h-4" aria-hidden />
            Booking Servis Tanpa Antre
          </Link>
          <Link
            href="/booking?tab=track"
            className="inline-flex items-center gap-1.5 font-bold text-white/95 hover:text-white underline underline-offset-4 decoration-white/60 hover:decoration-white"
          >
            Cek Status Tiket Booking
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-black/25 px-3 py-2 rounded-xl border border-white/15">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden />
            4,5 Google Review Kuningan
          </span>
        </div>
      </div>
    </section>
  );
}
