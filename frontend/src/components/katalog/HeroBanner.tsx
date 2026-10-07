import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { buildWaUrl } from "@/lib/utils";

interface HeroBannerProps {
  totalParts: number;
}

/**
 * Banner katalog.
 * Merah solid di sisi teks, memudar ke transparan sehingga foto papan nama
 * terlihat jelas di sisi kanan. Atur ketebalan merah lewat stop gradient
 * (`from-*`, `via-*`, `to-*`) pada elemen overlay di bawah.
 */
export default function HeroBanner({ totalParts }: HeroBannerProps) {
  const partCount = totalParts > 0 ? totalParts.toLocaleString("id-ID") : "40.000+";

  return (
    <section className="relative isolate mb-8 overflow-hidden rounded-xl bg-[#E4002B] text-white">
      <Image
        src="/honda-wing-sign.png"
        alt="Papan nama Honda AS Putra Motor"
        fill
        priority
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="-z-20 object-cover object-right"
      />
      {/* Overlay merah: mobile vertikal, desktop horizontal */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#E4002B]/95 via-[#E4002B]/85 to-[#E4002B]/50 sm:bg-gradient-to-r sm:from-[#E4002B] sm:from-20% sm:via-[#E4002B]/60 sm:via-55% sm:to-[#E4002B]/0"
      />

      <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-[1.1] tracking-tight text-balance">
            Katalog suku cadang asli Honda
          </h1>
          <p className="mt-3 text-base text-white">
            {partCount} part resmi AHM. Stok dan harga HET diperbarui langsung dari database.
          </p>
        </div>

        <a
          href={buildWaUrl("BENGKEL", "Konsultasi Spare Part")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#C20026] transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:self-auto"
        >
          <MessageSquare className="w-4 h-4" aria-hidden />
          Cek part via WhatsApp
        </a>
      </div>
    </section>
  );
}