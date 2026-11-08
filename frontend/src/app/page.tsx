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
import HeroSection from "@/components/HeroSection";
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
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
      />

      <Navbar />

      <main className="flex-1 pt-20 md:pt-[105px]">
        {/* ── Hero: Iconic Honda Red & Wing Fascia (with High-Tech Telemetry Entrance) ── */}
        <HeroSection totalParts={totalParts} />

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
