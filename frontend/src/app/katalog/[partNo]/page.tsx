import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageSquare, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { fetchSparePartDetail } from "@/lib/api";
import { formatIDR, buildWaUrl } from "@/lib/utils";
import DetailImageGallery from "@/components/katalog/DetailImageGallery";

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
        title: `${part.part_name} (${part.part_no}) | AS Putra Rahmat`,
        description: `Beli ${part.part_name} (${part.nama_umum || 'Suku Cadang Resmi'}) dengan harga HET ${formatIDR(part.het)}. 100% Original AHM di AS Putra Rahmat.`,
      };
    }
  } catch {
    // Fallback to default if API fails
  }
  return {
    title: 'Detail Suku Cadang | AS Putra Rahmat',
    description: 'Katalog suku cadang motor Honda resmi AHM.',
  };
}

export default async function SparePartDetailPage({ params }: DetailPageProps) {
  const { partNo } = await params;

  let part = null;

  try {
    const res = await fetchSparePartDetail(partNo);
    if (res.success) {
      part = res.data;
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
  const waUrl = buildWaUrl(part.part_no, part.part_name);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-medium text-[#8A8A8A] mb-6">
        <Link href="/" className="hover:text-[#0A0A0A] transition-colors">
          Beranda
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/katalog" className="hover:text-[#0A0A0A] transition-colors">
          Katalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#0A0A0A] font-semibold truncate max-w-[200px]">
          {part.part_name}
        </span>
      </nav>

      {/* Back Link */}
      <Link
        href="/katalog"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8A8A8A] hover:text-[#0A0A0A] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      {/* Main Detail Content Grid */}
      <div className="bg-white rounded-3xl border border-[rgba(0,0,0,0.08)] p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Interactive Product Image Gallery with Slider & Zoom */}
        <DetailImageGallery
          images={part.gambar_urls && part.gambar_urls.length > 0 ? part.gambar_urls : (part.gambar_url ? [part.gambar_url] : [])}
          partName={part.part_name}
          partNo={part.part_no}
          isAvailable={isAvailable}
        />

        {/* Right: Info & CTA */}
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight mb-2">
            {part.nama_umum || part.part_name}
          </h1>

          <div className="space-y-1 mb-4">
            <div className="text-xs font-bold font-mono text-[#E4002B]">
              Part No: {part.part_no}
            </div>
            {part.nama_umum && (
              <div className="text-sm font-semibold text-zinc-500 italic">
                Nama Resmi AHM: {part.part_name}
              </div>
            )}
          </div>

          {/* Stock Status Pill */}
          <div className="mb-6">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A7A34] bg-[#34C759]/10 border border-[#34C759]/25 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Stok Tersedia ({part.stok} unit)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8A8A8A] bg-black/5 border border-black/10 px-3 py-1.5 rounded-lg">
                <XCircle className="w-4 h-4" />
                Stok Habis (Dapat dipesan Indent)
              </span>
            )}
          </div>

          <div className="h-px bg-[rgba(0,0,0,0.08)] mb-6"></div>

          {/* Price */}
          <div className="mb-8 p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#8A8A8A] mb-2">
              Harga HET (Harga Eceran Tertinggi)
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
              {formatIDR(part.het)}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#F2F2F0] p-4 rounded-xl mb-8">
            <div>
              <div className="text-sm text-[#8A8A8A] font-semibold">Kategori</div>
              <div className="text-sm font-bold text-[#0A0A0A] capitalize">
                {part.category_detail || "Suku Cadang Motor"}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#8A8A8A] font-semibold">Jaminan</div>
              <div className="text-sm font-bold text-[#0A0A0A]">100% Original AHM</div>
            </div>
          </div>

          {/* WhatsApp Action Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto w-full bg-[#25D366] hover:bg-[#1dbe5a] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>Tanya & Pesan via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
