import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildWaUrl } from "@/lib/utils";
import { fetchCategories } from "@/lib/api";

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Bengkel & Spare Part Honda Kuningan | AHASS AS Putra Rahmat",
  description:
    "AHASS resmi Honda di Kuningan (kode 10870). Cek stok & harga HET suku cadang asli AHM secara online. Booking servis motor tanpa antre. Mekanik bersertifikat Honda.",
  alternates: {
    canonical: "https://asputra.vercel.app",
  },
};

// ── JSON-LD Structured Data (LocalBusiness + AutoRepair) ──────────────────────
const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AutoRepair",
      "@id": "https://asputra.vercel.app/#business",
      name: "AS Putra Rahmat Motor - AHASS 10870",
      alternateName: "AHASS AS Putra Kuningan",
      url: "https://asputra.vercel.app",
      telephone: "+6281111116408",
      image: "https://asputra.vercel.app/as-putra-dealer.png",
      logo: {
        "@type": "ImageObject",
        url: "https://asputra.vercel.app/logo.png",
      },
      description:
        "Dealer dan bengkel resmi Honda (AHASS kode 10870) di Kabupaten Kuningan, Jawa Barat. Menyediakan suku cadang asli AHM, booking servis online, mekanik bersertifikat Honda.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Jl. Siliwangi 126 Kasturi, Sebelah Utara Taman Cirendang",
        addressLocality: "Kuningan",
        addressRegion: "Jawa Barat",
        postalCode: "45518",
        addressCountry: "ID",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -6.9516689,
        longitude: 108.4883253,
      },
      hasMap: "https://www.google.com/maps/place/Dealer+Honda+AS+Putra+Motor+Kuningan",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "08:00",
          closes: "16:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Sunday"],
          opens: "08:00",
          closes: "15:00",
        },
      ],
      priceRange: "IDR",
      currenciesAccepted: "IDR",
      paymentAccepted: "Cash, Transfer Bank",
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Kabupaten Kuningan, Jawa Barat",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Apakah semua spare part di sini asli Honda?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ya. Seluruh suku cadang di AHASS AS Putra Rahmat (kode AHASS 10870) adalah Honda Genuine Parts dari Astra Honda Motor, dengan garansi resmi.",
          },
        },
        {
          "@type": "Question",
          name: "Apakah harganya sesuai HET resmi AHM?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ya. Harga mengacu pada Harga Eceran Tertinggi resmi PT Astra Honda Motor, tanpa biaya tersembunyi.",
          },
        },
        {
          "@type": "Question",
          name: "Bagaimana menghindari antrean saat servis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Buat reservasi lewat menu Booking Servis di website, pilih tanggal dan jam datang, lalu tunjukkan kode tiket (format SRV-YYYYMMDD-XXXX untuk servis atau PRT-YYYYMMDD-XXXX untuk suku cadang) ke petugas pendaftaran.",
          },
        },
        {
          "@type": "Question",
          name: "Apakah ada layanan servis ke lokasi atau instansi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ada. Kami melayani Service Visit (AHASS Keliling) terjadwal ke satu titik lokasi terpusat, seperti desa yang sudah dicanvasing atau kantor instansi/perusahaan di Kabupaten Kuningan. Layanan ini bukan panggilan servis ke rumah perorangan.",
          },
        },
      ],
    },
  ],
};

// ── Data statis ───────────────────────────────────────────────────────────────
/** Fetch jumlah total part aktif */
async function getTotalParts(): Promise<number> {
  try {
    const res = await fetchCategories();
    if (res.success && res.data) {
      if (res.data.total) return res.data.total;
      return res.data.categories.reduce((acc, cat) => acc + cat.count, 0);
    }
    return 44234;
  } catch {
    return 44234;
  }
}

/** Keunggulan toko */
const STRENGTHS = [
  {
    icon: ShieldCheck,
    title: "Suku cadang 100% asli AHM",
    text: "Semua part bergaransi resmi Astra Honda Motor. Tidak ada KW atau barang tiruan.",
  },
  {
    icon: Search,
    title: "Stok dan harga HET terbaru",
    text: "Data katalog terhubung langsung ke database, jadi stok dan harga yang tampil selalu yang berlaku hari ini.",
  },
  {
    icon: Wrench,
    title: "Mekanik bersertifikat AHM",
    text: "Servis rutin sampai perbaikan khusus ditangani mekanik Honda yang sudah tersertifikasi.",
  },
  {
    icon: CalendarDays,
    title: "Booking dan konsultasi online",
    text: "Pilih tanggal dan jam servis lewat form, atau tanya soal part langsung ke tim kami via WhatsApp.",
  },
] as const;

/** Paket servis bengkel */
const SERVICE_PACKAGES = [
  {
    title: "Ganti oli mesin",
    badge: "Fast track",
    items: ["Oli mesin AHM genuine", "Cek baut tap oli", "Reset indikator (bila ada)"],
  },
  {
    title: "Servis & bongkar CVT",
    badge: "Perawatan matic",
    items: ["Pembersihan komponen CVT", "Cek roller & v-belt", "Pelumasan greasing CVT"],
  },
  {
    title: "Ganti oli + 5 poin",
    badge: "Gratis 5 poin",
    items: [
      "Ganti oli mesin",
      "Setel & lumasi rantai roda",
      "Setel rem depan & belakang",
      "Periksa angin ban",
      "Periksa air radiator",
    ],
  },
  {
    title: "Servis ringan",
    badge: "9 poin servis",
    items: ["Pengecekan mesin", "Pengecekan rangka", "Pengecekan kelistrikan"],
  },
  {
    title: "Servis lengkap",
    badge: "15 poin servis",
    items: ["Pengecekan mesin", "Pengecekan rangka", "Pengecekan kelistrikan"],
  },
] as const;

/** FAQ */
const FAQS = [
  {
    q: "Apakah semua spare part di sini asli Honda?",
    a: "Ya. Seluruh suku cadang di AHASS AS Putra Rahmat (kode AHASS 10870) adalah Honda Genuine Parts dari Astra Honda Motor, dengan garansi resmi.",
  },
  {
    q: "Apakah harganya sesuai HET resmi AHM?",
    a: "Ya. Harga mengacu pada Harga Eceran Tertinggi resmi PT Astra Honda Motor, tanpa biaya tersembunyi.",
  },
  {
    q: "Saya bingung kode part yang cocok untuk motor saya. Bagaimana?",
    a: "Kirim nomor rangka (diawali MH1) dari STNK lewat WhatsApp. Mekanik kami akan mengecek kode part AHM yang paling tepat untuk motor Anda.",
  },
  {
    q: "Bagaimana menghindari antrean saat servis?",
    a: "Buat reservasi lewat menu Booking Servis, pilih tanggal dan jam datang, lalu tunjukkan kode tiket (format SRV-YYYYMMDD-XXXX untuk servis atau PRT-YYYYMMDD-XXXX untuk suku cadang) ke petugas pendaftaran.",
  },
  {
    q: "Part yang saya cari sedang habis. Apa yang bisa dilakukan?",
    a: "Anda bisa memesan inden resmi AHM lewat WhatsApp atau langsung ke bagian spare part. Pesanan akan kami teruskan ke jaringan distribusi AHM.",
  },
  {
    q: "Apakah ada layanan servis ke lokasi atau instansi?",
    a: "Ada. Kami melayani Service Visit (AHASS Keliling) terjadwal ke satu titik lokasi terpusat, seperti desa yang sudah dicanvasing atau instansi/perusahaan di Kabupaten Kuningan. Layanan ini bukan panggilan servis ke rumah perorangan.",
  },
] as const;

// ── Page Component ────────────────────────────────────────────────────────────
export default async function Home() {
  const totalParts = await getTotalParts();
  const waAskUrl = buildWaUrl("BENGKEL", "Konsultasi Spare Part");

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900">
      {/* ── Fermion-Inspired Cinematic Opening Curtain ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#A3001D] animate-fermion-curtain select-none"
      >
        <div className="flex flex-col items-center gap-3 animate-fermion-curtain-content">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            <Image
              src="/honda-logo.png"
              alt="Logo Honda"
              fill
              className="object-contain brightness-0 invert drop-shadow-md"
              priority
            />
          </div>
          <div className="font-mono text-[11px] sm:text-xs font-black tracking-[0.25em] text-white/95 uppercase">
            AHASS 10870 • AS PUTRA MOTOR
          </div>
          <div className="h-0.5 w-12 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
      />

      <Navbar />

      <main className="flex-1 pt-20 md:pt-[105px]">
        {/* ── Hero: Iconic Honda Red & Wing Fascia ───────────────────── */}
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
            className="-z-20 object-cover object-right opacity-45 sm:opacity-65"
          />

          {/* Iconic Honda Red Gradient & Diagonal Speed Slash */}
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
            className="pointer-events-none select-none absolute -right-16 -bottom-16 w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] opacity-[0.08] -z-10 animate-fermion-wing"
          >
            <Image
              src="/honda-logo.png"
              alt=""
              fill
              className="object-contain brightness-0 invert"
            />
          </div>

          <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-12 pb-14 lg:pt-20 lg:pb-24">
            <div className="w-full lg:max-w-[580px] xl:max-w-[620px]">
              {/* Left Column: Headline & Search */}
              <div>
                {/* Official Honda Fascia Badge */}
                <div className="animate-fermion-badge inline-flex flex-wrap items-center gap-2 rounded-full bg-black/25 backdrop-blur-xs border border-white/25 pl-2.5 pr-3.5 py-1 text-xs font-bold tracking-wide text-white">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#E4002B]">
                    AHASS 10870
                  </span>
                  <span>Dealer &amp; Bengkel Resmi Honda Kuningan</span>
                  <span className="text-white/50">•</span>
                  <span className="italic font-extrabold tracking-wider">One Heart.</span>
                </div>

                <h1 className="animate-fermion-title font-display mt-5 text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.06] tracking-tight text-balance drop-shadow-xs">
                  Suku Cadang Asli Honda &amp; Servis Resmi AHASS.
                </h1>

                <p className="animate-fermion-desc mt-4 text-base sm:text-lg leading-relaxed text-white/95 max-w-xl">
                  Cek langsung{" "}
                  <strong className="font-extrabold text-white underline decoration-white/50 underline-offset-4">
                    {totalParts > 0
                      ? `${totalParts.toLocaleString("id-ID")} SKU Honda Genuine Parts`
                      : "ribuan SKU Honda Genuine Parts"}
                  </strong>{" "}
                  dengan harga HET resmi PT Astra Honda Motor, atau booking antrean pit servis tanpa antre.
                </p>

                {/* Pencarian utama: bergaya Katalog Elektronik Resmi AHM */}
                <form action="/katalog" method="get" role="search" className="animate-fermion-search mt-7">
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
                  <div className="animate-fermion-chips mt-3.5 flex flex-wrap items-center gap-1.5 text-xs text-white">
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
                <div className="animate-fermion-actions mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white">
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
            </div>
          </div>
        </section>

        {/* ── Official Honda Fascia Stats Strip ────────────────────── */}
        <section className="bg-zinc-900 text-white border-b border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 sm:px-10 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
            <div className="pt-3 sm:pt-0 sm:px-4 first:pl-0 first:pt-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#E4002B]">
                KODE BENGKEL RESMI
              </div>
              <div className="font-display text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                AHASS 10870
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Terdaftar Resmi PT AHM
              </div>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#E4002B]">
                DATABASE SUKU CADANG
              </div>
              <div className="font-display text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {totalParts > 0 ? `${totalParts.toLocaleString("id-ID")}+` : "44.000+"} SKU
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Honda Genuine Parts &amp; Oil
              </div>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#E4002B]">
                TRANSPARANSI HARGA
              </div>
              <div className="font-display text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                100% HET AHM
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Harga Eceran Tertinggi Resmi
              </div>
            </div>
            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#E4002B]">
                STANDAR TEKNISI
              </div>
              <div className="font-display text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Tersertifikasi
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Peralatan Standar Pit Honda
              </div>
            </div>
          </div>
        </section>

        {/* ── Keunggulan Standar Honda ─────────────────────────────── */}
        <section className="px-6 sm:px-10 py-20 bg-white">
          <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#E4002B] mb-2">
                <span className="h-2 w-2 rounded-full bg-[#E4002B]" />
                Standar Resmi AHASS
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance text-zinc-900">
                Kenapa beli part &amp; servis di AS Putra Rahmat
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                Satu tempat resmi Honda untuk cari suku cadang asli, pasang di pit standar AHASS,
                dan servis berkala. Semua stok dan harga bisa Anda cek dulu dari rumah.
              </p>
              <Link
                href="/katalog"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E4002B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B8001F] transition shadow-xs"
              >
                Buka Katalog Honda Genuine Parts
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>

            <dl className="lg:col-span-8 grid gap-6 sm:grid-cols-2">
              {STRENGTHS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-6 border-t-4 border-t-[#E4002B] hover:bg-white hover:shadow-md transition"
                >
                  <dt className="flex items-center gap-3 text-lg font-bold text-zinc-900">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E4002B] text-white shadow-xs">
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                    {title}
                  </dt>
                  <dd className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-600">
                    {text}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Layanan Servis PIT AHASS ─────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-zinc-200 px-6 sm:px-10 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#E4002B] mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#E4002B]" />
                  Layanan Bengkel Resmi AHASS 10870
                </div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-zinc-900">
                  Paket Servis &amp; Perawatan Berkala Honda
                </h2>
                <p className="mt-2 text-base text-zinc-600">
                  Pilih paket saat booking. Pekerjaan atau pergantian part tambahan hanya dilakukan setelah Anda setuju.
                </p>
              </div>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E4002B] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#E4002B] hover:bg-[#E4002B] hover:text-white transition"
              >
                <CalendarDays className="w-4 h-4" />
                Reservasi Jadwal Pit
              </Link>
            </div>

            <ul className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
              {SERVICE_PACKAGES.map((pkg, idx) => (
                <li
                  key={pkg.title}
                  className="grid gap-3 px-5 py-5 md:grid-cols-[280px_1fr] md:gap-8 md:px-6 hover:bg-red-50/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#E4002B] font-mono text-xs font-black text-white">
                      0{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{pkg.title}</h3>
                      <span className="mt-1 inline-block rounded bg-red-50 border border-red-200/70 px-2 py-0.5 text-[11px] font-bold text-[#C20026]">
                        {pkg.badge}
                      </span>
                    </div>
                  </div>
                  <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                        <CheckCircle className="w-4 h-4 shrink-0 text-[#E4002B]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {/* CTA keluhan khusus */}
            <div className="mt-6 relative overflow-hidden flex flex-col gap-4 rounded-xl bg-gradient-to-r from-[#E4002B] to-[#B8001F] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between shadow-md">
              <div className="relative z-10">
                <div className="text-[11px] font-black uppercase tracking-widest text-white/80">
                  KONSULTASI MEKANIK TERSERTIFIKASI HONDA
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold mt-0.5">
                  Motor terasa kurang bertenaga, bunyi pada CVT, atau indikator menyala?
                </h3>
                <p className="mt-1 text-sm sm:text-base text-white/95 max-w-xl">
                  Tulis keluhan Anda saat booking. Mekanik AHASS kami akan memeriksa dan mengonfirmasi estimasi biaya sebelum pengerjaan dimulai.
                </p>
              </div>
              <Link
                href="/booking"
                className="relative z-10 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-[#E4002B] transition-colors hover:bg-zinc-100 shadow-sm"
              >
                Booking Servis Sekarang
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>

            {/* Info AHASS Keliling / Service Visit */}
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-600 sm:text-sm">
              <span className="font-bold text-zinc-900 shrink-0">Info Service Visit:</span>
              <span>
                Layanan AHASS Keliling diadakan terjadwal khusus untuk satu titik lokasi kumpul desa yang telah dicanvasing atau instansi mitra di Kabupaten Kuningan (bukan panggilan servis ke rumah perorangan).
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="px-6 sm:px-10 py-20">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance">
                  Pertanyaan yang sering diajukan
                </h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Belum ketemu jawabannya? Tanya langsung ke tim kami.
                </p>
                <a
                  href={waAskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden />
                  Tanya via WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:col-span-8 divide-y divide-zinc-200 border-y border-zinc-200">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-base font-semibold text-zinc-900 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B] [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronRight
                      className="w-5 h-5 shrink-0 text-zinc-500 transition-transform motion-reduce:transition-none group-open:rotate-90"
                      aria-hidden
                    />
                  </summary>
                  <p className="pb-5 pr-9 text-base leading-relaxed text-zinc-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
