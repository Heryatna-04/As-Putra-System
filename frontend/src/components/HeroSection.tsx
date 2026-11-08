"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface HeroSectionProps {
  totalParts: number;
}

export default function HeroSection({ totalParts }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0A0E17] text-white">
      {/* Subtle Honda Red Ambient Lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#E4002B]/30 via-[#E4002B]/10 to-transparent blur-3xl -z-10"
      />

      {/* Real Dealer Photo Overlay with Cinematic Dimming */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <Image
          src="/as-putra-dealer.png"
          alt="AHASS AS Putra Motor Kuningan"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-20 filter saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E17]/60 via-[#0A0E17]/90 to-[#0A0E17]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24 lg:py-28 animate-hero-fade">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6">
            {/* Elegant Monogram Tag */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-zinc-300">
              <span className="flex items-center gap-1.5 font-bold text-[#E4002B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E4002B] animate-pulse" />
                AHASS 10870
              </span>
              <span className="text-zinc-600">/</span>
              <span>Bengkel Resmi Honda Kuningan</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
              Suku Cadang Asli. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Servis Resmi Honda.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed font-normal">
              Cek ketersediaan{" "}
              <span className="text-white font-semibold">
                {totalParts > 0 ? `${totalParts.toLocaleString("id-ID")} SKU` : "44.000+ SKU"}
              </span>{" "}
              Honda Genuine Parts sesuai HET resmi Astra Honda Motor, atau reservasi jadwal pit tanpa antre.
            </p>

            {/* Minimalist Search Bar */}
            <form action="/katalog" method="get" className="pt-2">
              <div className="relative flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-[#E4002B] rounded-2xl border border-white/15 backdrop-blur-xl p-1.5 transition-all shadow-2xl">
                <Search className="w-5 h-5 text-zinc-400 ml-3.5 shrink-0" />
                <input
                  name="search"
                  type="search"
                  placeholder="Cari suku cadang (contoh: Kampas Rem, V-Belt, Oli MPX)..."
                  className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E4002B] hover:bg-[#CC0025] text-white text-xs sm:text-sm font-bold transition active:scale-95 shrink-0 cursor-pointer"
                >
                  Cari
                </button>
              </div>

              {/* Quick Tags */}
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                <span className="text-zinc-500 font-medium">Populer:</span>
                {["Oli MPX2", "Kampas Rem", "V-Belt", "Busi", "Filter Udara"].map((item) => (
                  <Link
                    key={item}
                    href={`/katalog?search=${encodeURIComponent(item)}`}
                    className="hover:text-white transition text-zinc-400 hover:underline underline-offset-4"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </form>

            {/* Quick CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold transition shadow-lg active:scale-95"
              >
                <CalendarDays className="w-4 h-4 text-[#E4002B]" />
                <span>Booking Servis Online</span>
              </Link>
              <Link
                href="/booking?tab=track"
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium transition"
              >
                <span>Lacak Status Tiket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Clean, Elegant Floating Showcase Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-7 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
              {/* Subtle top red glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E4002B] to-transparent" />

              {/* Honda Emblem & AHASS Badge */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 p-2 flex items-center justify-center shrink-0">
                    <Image
                      src="/honda-logo.png"
                      alt="Honda Logo"
                      width={32}
                      height={32}
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#E4002B] tracking-wider uppercase">
                      AHASS 10870
                    </div>
                    <div className="text-base font-bold text-white tracking-tight">
                      PT AS Putra Rahmat
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  Kuningan
                </span>
              </div>

              {/* 3 Key Official Pillars */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">100% Honda Genuine Parts</h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Jaminan suku cadang original PT Astra Honda Motor dengan HET resmi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E4002B]/10 border border-[#E4002B]/20 text-[#E4002B] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Teknisi Bersertifikat AHM</h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Peralatan diagnosis Honda HIDS standar dealer resmi pabrikan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Pit Express &amp; Jadwal Teratur</h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Ganti oli dan servis berkala tanpa waktu tunggu antrean konvensional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom One Heart Strip */}
              <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
                <span>Bengkel Resmi Honda</span>
                <span className="font-black italic tracking-widest text-zinc-400">ONE HEART.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
