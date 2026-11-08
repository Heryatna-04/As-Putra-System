"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CalendarDays,
  ArrowRight,
  Star,
  CheckCircle,
  ShieldCheck,
  Clock,
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
        className="-z-20 object-cover object-right opacity-45 sm:opacity-65 transition-opacity duration-700"
      />

      {/* Iconic Honda Red Gradient & Subtle Diagonal Slash */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#E4002B]/95 via-[#D50027]/90 to-[#B00020]/95 sm:bg-gradient-to-r sm:from-[#E4002B] sm:from-35% sm:via-[#E4002B]/88 sm:via-65% sm:to-black/45"
      />
      <div
        aria-hidden
        className="hidden lg:block absolute -right-24 top-0 bottom-0 w-[420px] -skew-x-12 bg-gradient-to-b from-white/10 via-white/5 to-transparent border-l border-white/15 -z-10 pointer-events-none"
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

      <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline & Search */}
          <div className="lg:col-span-7">
            {/* Official Honda Fascia Badge */}
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-black/25 backdrop-blur-xs border border-white/25 pl-2.5 pr-3.5 py-1 text-xs font-bold tracking-wide text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#E4002B]">
                AHASS 10870
              </span>
              <span>Dealer &amp; Bengkel Resmi Honda Kuningan</span>
              <span className="text-white/50">•</span>
              <span className="italic font-extrabold tracking-wider">One Heart.</span>
            </div>

            <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.06] tracking-tight text-balance drop-shadow-xs">
              Suku Cadang Asli Honda &amp; Servis Resmi AHASS.
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/95 max-w-xl">
              Cek langsung{" "}
              <strong className="font-extrabold text-white underline decoration-white/50 underline-offset-4">
                {totalParts > 0
                  ? `${totalParts.toLocaleString("id-ID")} SKU Honda Genuine Parts`
                  : "ribuan SKU Honda Genuine Parts"}
              </strong>{" "}
              dengan harga HET resmi PT Astra Honda Motor, atau booking antrean pit servis tanpa antre.
            </p>

            {/* Pencarian utama: bergaya Katalog Elektronik Resmi AHM */}
            <form action="/katalog" method="get" role="search" className="mt-7">
              <label htmlFor="hero-search" className="sr-only">
                Cari spare part Honda di Kuningan
              </label>
              <div className="rounded-xl bg-white p-1.5 shadow-2xl shadow-black/25 ring-1 ring-white/40 focus-within:ring-4 focus-within:ring-white/50">
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
                    className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm sm:text-base font-medium text-zinc-900 placeholder:text-zinc-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#E4002B] hover:bg-[#B8001F] px-5 sm:px-6 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    Cari Part
                  </button>
                </div>
              </div>

              {/* Quick Search Chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs text-white">
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
            <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-[#E4002B] shadow-md hover:bg-zinc-100 transition"
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
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-black/25 px-3 py-1.5 rounded-lg border border-white/15">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden />
                4,5 Google Review Kuningan
              </span>
            </div>
          </div>

          {/* Right Column: Iconic Honda Genuine Parts Card (Cleaned without card-in-card clutter) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white text-zinc-900 shadow-2xl border-2 border-white/80 overflow-hidden">
              {/* Top Red Honda Genuine Parts Fascia Header */}
              <div className="bg-[#E4002B] px-5 py-4 text-white flex items-center justify-between border-b-2 border-[#B00020]">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 bg-white rounded-lg p-1.5 shrink-0 shadow-xs">
                    <Image
                      src="/honda-logo.png"
                      alt="Logo Sayap Honda"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/85">
                      HONDA GENUINE PARTS
                    </div>
                    <div className="text-base font-black tracking-tight leading-tight">
                      AS PUTRA MOTOR
                    </div>
                  </div>
                </div>
                <span className="rounded bg-white/15 border border-white/30 px-2 py-1 font-mono text-[11px] font-black tracking-wider">
                  AHASS 10870
                </span>
              </div>

              {/* Body: Clean Authentic Guarantees */}
              <div className="p-5 sm:p-6 space-y-4 bg-gradient-to-b from-white to-zinc-50">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Jaminan Keaslian Suku Cadang
                    </div>
                    <div className="text-sm font-extrabold text-zinc-900 mt-0.5">
                      PT Astra Honda Motor (AHM)
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" /> 100% Original
                  </span>
                </div>

                {/* 3 Keunggulan Resmi (Clean list instead of fake barcode sticker) */}
                <div className="space-y-3 py-1">
                  <div className="flex items-center gap-3 text-xs text-zinc-700">
                    <ShieldCheck className="w-4 h-4 text-[#E4002B] shrink-0" />
                    <span>Harga transparan mengacu ke <strong>HET Resmi AHM</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-700">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Layanan <strong>Pit Express</strong> ganti oli &amp; servis cepat</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Mekanik bersertifikasi dan peralatan <strong>Honda HIDS</strong></span>
                  </div>
                </div>

                {/* Quick Links Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100">
                  <Link
                    href="/katalog"
                    className="group rounded-xl border border-zinc-200 bg-white hover:border-[#E4002B] p-3 transition flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold text-zinc-400 uppercase">
                      Katalog Online
                    </span>
                    <span className="mt-1 text-xs font-extrabold text-zinc-900 group-hover:text-[#E4002B] flex items-center justify-between">
                      Cek Stok &amp; HET
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/booking"
                    className="group rounded-xl border border-zinc-200 bg-white hover:border-[#E4002B] p-3 transition flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold text-zinc-400 uppercase">
                      Pit Express
                    </span>
                    <span className="mt-1 text-xs font-extrabold text-zinc-900 group-hover:text-[#E4002B] flex items-center justify-between">
                      Booking Servis
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Bottom One Heart Strip */}
              <div className="bg-zinc-900 px-5 py-2.5 text-white flex items-center justify-between text-[11px]">
                <span className="font-semibold text-zinc-300">
                  Jl. Siliwangi 126 Kasturi, Kuningan
                </span>
                <span className="font-black tracking-widest uppercase text-[#E4002B]">
                  ONE HEART.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
