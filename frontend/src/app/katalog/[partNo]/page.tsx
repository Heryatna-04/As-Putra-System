import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Truck,
  CalendarDays,
  Sparkles,
  HelpCircle,
  Award,
  ChevronDown
} from "lucide-react";
import { fetchSparePartDetail, fetchCatalog } from "@/lib/api";
import { formatIDR, buildWaUrl } from "@/lib/utils";
import DetailImageGallery from "@/components/katalog/DetailImageGallery";
import ProductCard from "@/components/katalog/ProductCard";
import type { SparePart } from "@/types/spare-part";

interface DetailPageProps {
  params: Promise<{
    partNo: string;
  }>;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { partNo } = await params;
  try {
    const res = await fetchSparePartDetail(partNo);
    if (res.success && res.data) {
      const part = res.data;
      return {
        title: `${part.nama_umum || part.part_name} (${part.part_no}) | AS Putra Rahmat`,
        description: `Beli ${part.part_name} (${part.nama_umum || "Suku Cadang Resmi"}) harga HET ${formatIDR(part.het)}. 100% Original AHM di AHASS AS Putra Rahmat Kuningan.`,
      };
    }
  } catch {
    // Fallback if API fails
  }
  return {
    title: "Detail Suku Cadang | AS Putra Rahmat",
    description: "Katalog suku cadang motor Honda resmi AHM.",
  };
}

export default async function SparePartDetailPage({ params }: DetailPageProps) {
  const { partNo } = await params;

  let part: SparePart | null = null;
  let relatedParts: SparePart[] = [];

  try {
    const res = await fetchSparePartDetail(partNo);
    if (res.success) {
      part = res.data;
      if (part && part.category_detail) {
        const resRelated = await fetchCatalog({ category: part.category_detail, limit: "4" });
        if (resRelated.success) {
          relatedParts = resRelated.data.filter((item) => item.part_no !== part?.part_no).slice(0, 4);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      notFound();
    }
  }

  if (!part) {
    notFound();
  }

  const isAvailable = part.stok > 0;
  const waUrl = buildWaUrl(part.part_no, `${part.nama_umum || part.part_name} (${part.part_no})`);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-zinc-900 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <Link href="/katalog" className="hover:text-zinc-900 transition-colors">
          Katalog Spare Part
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-900 font-semibold truncate max-w-[240px]">
          {part.nama_umum || part.part_name}
        </span>
      </nav>

      {/* Back Link */}
      <Link
        href="/katalog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Kembali ke Katalog
      </Link>

      {/* Main Detail Grid Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 shadow-xs mb-14">
        {/* Left Col: Product Image Gallery */}
        <div className="lg:col-span-6">
          <DetailImageGallery
            images={part.gambar_urls && part.gambar_urls.length > 0 ? part.gambar_urls : (part.gambar_url ? [part.gambar_url] : [])}
            partName={part.part_name}
            partNo={part.part_no}
            isAvailable={isAvailable}
          />
        </div>

        {/* Right Col: Product Information & Action CTAs */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            {/* Title & Part Code */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-red-50 text-[#B00020] border border-red-200/60 text-xs font-bold uppercase tracking-wider">
                {part.category_detail || "AHM Genuine Parts"}
              </span>
              <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md">
                NO. PART: {part.part_no}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">
              {part.nama_umum || part.part_name}
            </h1>

            {part.nama_umum && (
              <p className="text-sm font-semibold text-zinc-600 italic mb-4">
                Nama Resmi Pabrik: {part.part_name}
              </p>
            )}

            {/* Stock Availability Pill */}
            <div className="mb-6">
              {isAvailable ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Stok Siap di AHASS AS Putra ({part.stok} unit tersedia)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-lg">
                  <XCircle className="w-4 h-4 text-zinc-500" />
                  Stok Habis (Bisa Pesan Inden Resmi AHM)
                </span>
              )}
            </div>

            <hr className="my-6 border-zinc-200" />

            {/* Price Box */}
            <div className="mb-6 p-5 sm:p-6 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center justify-between">
                <span>Harga Resmi HET AHM</span>
                <span className="text-[11px] font-normal text-zinc-600">Garansi 100% Original</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                {formatIDR(part.het)}
              </div>
            </div>

            {/* Benefit Badges */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                <ShieldCheck className="w-5 h-5 mx-auto text-[#E4002B] mb-1" />
                <div className="text-xs font-bold text-zinc-900">100% Original</div>
                <div className="text-[10px] text-zinc-600">Jaminan AHM</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                <Wrench className="w-5 h-5 mx-auto text-[#E4002B] mb-1" />
                <div className="text-xs font-bold text-zinc-900">Bisa Pasang</div>
                <div className="text-[10px] text-zinc-600">Mekanik AHASS</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-center">
                <Truck className="w-5 h-5 mx-auto text-[#E4002B] mb-1" />
                <div className="text-xs font-bold text-zinc-900">Ambil di Toko</div>
                <div className="text-[10px] text-zinc-600">Kuningan Jabar</div>
              </div>
            </div>
          </div>

          {/* Action CTAs: WA & Booking */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Tanya & Pesan via WhatsApp</span>
            </a>
            <Link
              href={`/booking?partNo=${encodeURIComponent(part.part_no)}`}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <CalendarDays className="w-4 h-4 text-[#E4002B]" />
              <span>Booking Servis Pasang</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Section: Technical Specifications & FAQ */}
      <div className="mb-14">
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#E4002B]" />
            Spesifikasi & Informasi Produk
          </h2>

          <div className="space-y-3">
            {/* Item 1: Specification Table */}
            <details className="group border border-zinc-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex items-center justify-between p-4 bg-zinc-50/70 hover:bg-zinc-100/80 cursor-pointer transition-colors font-bold text-sm text-zinc-900 select-none">
                <span>Spesifikasi & Identitas Suku Cadang</span>
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="p-4 bg-white border-t border-zinc-200 text-xs text-zinc-700 space-y-2.5">
                <div className="grid grid-cols-2 py-1.5 border-b border-zinc-100">
                  <span className="font-semibold text-zinc-500">Nomor Part Resmi:</span>
                  <span className="font-mono font-bold text-zinc-900">{part.part_no}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-zinc-100">
                  <span className="font-semibold text-zinc-500">Nama Katalog AHM:</span>
                  <span className="font-medium text-zinc-900">{part.part_name}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-zinc-100">
                  <span className="font-semibold text-zinc-500">Kategori Spare Part:</span>
                  <span className="font-medium text-zinc-900">{part.category_detail || "AHM Genuine Parts"}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-zinc-100">
                  <span className="font-semibold text-zinc-500">Standar Harga (HET):</span>
                  <span className="font-bold text-emerald-700">{formatIDR(part.het)}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5">
                  <span className="font-semibold text-zinc-500">Produsen Resmi:</span>
                  <span className="font-medium text-zinc-900">PT Astra Honda Motor (AHM)</span>
                </div>
              </div>
            </details>

            {/* Item 2: Originality Guarantee */}
            <details className="group border border-zinc-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 bg-zinc-50/70 hover:bg-zinc-100/80 cursor-pointer transition-colors font-bold text-sm text-zinc-900 select-none">
                <span>Jaminan Keaslian AHM Genuine Parts 100%</span>
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="p-4 bg-white border-t border-zinc-200 text-xs text-zinc-600 leading-relaxed space-y-2">
                <p>
                  Setiap suku cadang yang dijual di AHASS AS Putra Rahmat dijamin <strong>100% Original AHM</strong> langsung dari distributor resmi PT Astra Honda Motor.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-700">
                  <li>Kemasan bersegel hologram asli AHM.</li>
                  <li>Presisi sesuai standar pabrikan sepeda motor Honda.</li>
                  <li>Daya tahan maksimal untuk keamanan berkendara Anda.</li>
                </ul>
              </div>
            </details>

            {/* Item 3: Installation & Pickup Procedure */}
            <details className="group border border-zinc-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 bg-zinc-50/70 hover:bg-zinc-100/80 cursor-pointer transition-colors font-bold text-sm text-zinc-900 select-none">
                <span>Prosedur Pemasangan & Ambil di Toko</span>
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="p-4 bg-white border-t border-zinc-200 text-xs text-zinc-600 leading-relaxed space-y-2">
                <p>
                  Anda dapat memesan suku cadang ini secara online dan memilih untuk dipasang langsung di bengkel kami atau diambil secara langsung.
                </p>
                <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl text-zinc-800 space-y-1">
                  <p className="font-bold text-[#B00020] text-xs">Fasilitas Pit Express AHASS:</p>
                  <p className="text-[11px]">Penggantian suku cadang cepat seperti oli, kanvas rem, busi, dan v-belt tanpa antre panjang di pit servis umum.</p>
                </div>
              </div>
            </details>

            {/* Item 4: FAQ */}
            <details className="group border border-zinc-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 bg-zinc-50/70 hover:bg-zinc-100/80 cursor-pointer transition-colors font-bold text-sm text-zinc-900 select-none">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#E4002B]" />
                  Pertanyaan Sering Diajukan (FAQ)
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="p-4 bg-white border-t border-zinc-200 text-xs text-zinc-700 space-y-3">
                <div>
                  <p className="font-bold text-zinc-900 mb-0.5">Q: Apakah part ini cocok untuk motor Honda saya?</p>
                  <p className="text-zinc-600">A: Setiap part AHM dibuat spesifik berdasarkan kode spare part ({part.part_no}). Jika ragu, tim mekanik kami siap membantu mencocokkan via WhatsApp.</p>
                </div>
                <hr className="border-zinc-100" />
                <div>
                  <p className="font-bold text-zinc-900 mb-0.5">Q: Bagaimana jika stok barang habis?</p>
                  <p className="text-zinc-600">A: Kami dapat membantu pemesanan Inden Resmi ke AHM dengan waktu tunggu estimasi 3-7 hari kerja.</p>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Related Spare Parts Section */}
      {relatedParts.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E4002B]" />
              <h2 className="text-xl font-bold text-zinc-900">
                Suku Cadang Terkait ({part.category_detail})
              </h2>
            </div>
            <Link
              href={`/katalog?category=${encodeURIComponent(part.category_detail || "")}`}
              className="text-sm font-semibold text-[#B00020] hover:underline flex items-center gap-1"
            >
              Lihat Kategori Ini &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedParts.map((item) => (
              <ProductCard key={item.id} part={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
