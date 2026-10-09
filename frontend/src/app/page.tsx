import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bike,
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
        streetAddress: "Jl. Raya Kuningan",
        addressLocality: "Kuningan",
        addressRegion: "Jawa Barat",
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
          closes: "15:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Sunday"],
          opens: "08:00",
          closes: "14:00",
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
            text: "Buat reservasi lewat menu Booking Servis di website, pilih tanggal dan jam datang, lalu tunjukkan kode tiket (format ASP-YYYYMMDD-XXXX) ke petugas pendaftaran.",
          },
        },
        {
          "@type": "Question",
          name: "Apakah ada layanan servis ke lokasi atau instansi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ada. Kami melayani Service Visit (servis keliling) untuk rombongan instansi atau perusahaan di Kabupaten Kuningan dan sekitarnya.",
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
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
    const res = await fetch(`${baseUrl}/spare-parts/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.success) return 0;
    const total = (data.data.categories as { count: number }[]).reduce(
      (acc, cat) => acc + cat.count,
      0
    );
    return total;
  } catch {
    return 0;
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
    a: "Buat reservasi lewat menu Booking Servis, pilih tanggal dan jam datang, lalu tunjukkan kode tiket (format ASP-YYYYMMDD-XXXX) ke petugas pendaftaran.",
  },
  {
    q: "Part yang saya cari sedang habis. Apa yang bisa dilakukan?",
    a: "Anda bisa memesan inden resmi AHM lewat WhatsApp atau langsung ke bagian spare part. Pesanan akan kami teruskan ke jaringan distribusi AHM.",
  },
  {
    q: "Apakah ada layanan servis ke lokasi atau instansi?",
    a: "Ada. Kami melayani Service Visit (servis keliling) untuk rombongan instansi atau perusahaan di Kabupaten Kuningan dan sekitarnya.",
  },
] as const;

// ── Page Component ────────────────────────────────────────────────────────────
export default async function Home() {
  const totalParts = await getTotalParts();
  const waAskUrl = buildWaUrl("BENGKEL", "Konsultasi Spare Part");

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
      />

      <Navbar />

      <main className="flex-1 pt-[125px] sm:pt-[105px]">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden bg-[#E4002B] text-white">
          <Image
            src="/as-putra-dealer.png"
            alt="Gedung dealer dan bengkel resmi Honda AS Putra Motor di Kuningan"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-right"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-[#E4002B]/95 via-[#E4002B]/80 to-[#E4002B]/40 sm:bg-gradient-to-r sm:from-[#E4002B] sm:from-25% sm:via-[#E4002B]/70 sm:via-55% sm:to-[#E4002B]/0"
          />

          <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-16 pb-16 lg:pt-24 lg:pb-28">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <Bike className="w-4 h-4" aria-hidden />
                Dealer dan bengkel resmi Honda di Kuningan
              </p>

              <h1 className="font-display mt-4 text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-balance">
                Cari spare part Honda asli, langsung cek stok dan harganya.
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-white max-w-md">
                {totalParts > 0
                  ? `${totalParts.toLocaleString("id-ID")} suku cadang`
                  : "Ribuan suku cadang"}{" "}
                genuine AHM dengan harga HET resmi. Ketik kode part atau nama barang.
              </p>

              {/* Pencarian utama: GET ke /katalog */}
              <form action="/katalog" method="get" role="search" className="mt-8">
                <label htmlFor="hero-search" className="sr-only">
                  Cari spare part Honda di Kuningan
                </label>
                <div className="flex items-stretch rounded-lg bg-white shadow-lg shadow-black/10 focus-within:ring-4 focus-within:ring-white/40">
                  <div className="flex items-center pl-4 text-zinc-500">
                    <Search className="w-5 h-5" aria-hidden />
                  </div>
                  <input
                    id="hero-search"
                    name="search"
                    type="search"
                    autoComplete="off"
                    placeholder="Contoh: roller vario, 23100-KZR"
                    className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base text-zinc-900 placeholder:text-zinc-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="m-1.5 rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Cari part
                  </button>
                </div>
              </form>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 font-semibold underline underline-offset-4 decoration-white/60 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  <CalendarDays className="w-4 h-4" aria-hidden />
                  Booking servis
                </Link>
                <span className="inline-flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" aria-hidden />
                  Rating Google Maps 4,5
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Keunggulan ───────────────────────────────────────────── */}
        <section className="px-6 sm:px-10 py-20">
          <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance">
                Kenapa beli dan servis di AS Putra Rahmat
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                Satu tempat untuk cari part, pasang, dan servis. Semuanya resmi, semuanya
                bisa dicek dulu dari rumah.
              </p>
              <Link
                href="/katalog"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#C20026] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E4002B]"
              >
                Lihat katalog spare part
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>

            <dl className="lg:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {STRENGTHS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="border-t border-zinc-200 pt-6">
                  <dt className="flex items-center gap-3 text-lg font-semibold text-zinc-900">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-[#C20026]">
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                    {title}
                  </dt>
                  <dd className="mt-3 text-base leading-relaxed text-zinc-600">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Layanan servis ───────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-zinc-200 px-6 sm:px-10 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight">
                  Layanan servis bengkel
                </h2>
                <p className="mt-2 text-base text-zinc-600">
                  Pilih paket saat booking. Pekerjaan tambahan baru dikerjakan setelah Anda setuju.
                </p>
              </div>
            </div>

            <ul className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {SERVICE_PACKAGES.map((pkg) => (
                <li
                  key={pkg.title}
                  className="grid gap-3 px-5 py-5 md:grid-cols-[260px_1fr] md:gap-8 md:px-6"
                >
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{pkg.title}</h3>
                    <span className="mt-1.5 inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {pkg.badge}
                    </span>
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {/* CTA keluhan khusus */}
            <div className="mt-6 flex flex-col gap-4 rounded-xl bg-[#E4002B] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ada keluhan khusus?</h3>
                <p className="mt-1 text-base text-white max-w-xl">
                  Ceritakan bunyi aneh, rem kurang pakem, atau masalah lain saat booking. Mekanik
                  kami analisis sebelum servis dimulai.
                </p>
              </div>
              <Link
                href="/booking"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#C20026] transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Booking servis
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
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
