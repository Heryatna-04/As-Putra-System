"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, MessageSquare, User, CalendarDays } from "lucide-react";
import { buildWaUrl } from "@/lib/utils";

import { fetchCatalog } from "@/lib/api";
import { formatIDR } from "@/lib/utils";
import { SparePart } from "@/types/spare-part";

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [searchResults, setSearchResults] = useState<SparePart[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced live search effect
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetchCatalog({ search: searchTerm.trim(), limit: "5" });
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/katalog?${params.toString()}`);
  };

  const handleSelectResult = (partNo: string) => {
    setShowDropdown(false);
    setSearchTerm("");
    router.push(`/katalog/${encodeURIComponent(partNo)}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs font-sans">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logos */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-32 shrink-0">
              <Image
                src="/logo.png"
                alt="AS Putra Motor Logo"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>
          <div className="hidden md:block h-4 w-px bg-zinc-200" />
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-[#B00020] bg-red-50 border border-red-200/60 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E4002B]" />
            Dealer & Bengkel Resmi Honda
          </span>
        </div>

        {/* Center: Search Bar with Live Dropdown */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-white focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/20 transition-all overflow-hidden">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim().length >= 2 && setShowDropdown(true)}
              placeholder="Cari suku cadang, kode part..."
              className="w-full py-2 px-3.5 text-sm bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-zinc-400 hover:text-[#E4002B] transition-colors"
              title="Cari"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Live Search Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-xs text-zinc-400 text-center">Mencari...</div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {searchResults.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => handleSelectResult(part.part_no)}
                      className="w-full p-3 text-left hover:bg-zinc-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-zinc-900 truncate">
                          {part.nama_umum || part.part_name}
                        </div>
                        <div className="text-xs font-mono font-medium text-[#B00020]">
                          {part.part_no}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-zinc-900">
                          {formatIDR(part.het)}
                        </div>
                        <span className={`text-xs font-medium ${part.stok > 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                          {part.stok > 0 ? `Stok: ${part.stok}` : 'Indent'}
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="w-full p-3 text-center text-xs font-semibold text-[#B00020] hover:bg-red-50/50 block border-t border-zinc-100"
                  >
                    Lihat semua hasil pencarian &rarr;
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500">
                  Tidak ditemukan suku cadang &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          )}
        </form>

        {/* Right: Location, Login, WA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/login"
            className="hidden sm:flex items-center gap-1.5 border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span>Staff Login</span>
          </Link>

          <a
            href={buildWaUrl("BENGKEL", "Informasi Spare Part & Servis")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Bottom Navigation Menu Bar */}
      <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 sm:gap-8 text-sm font-semibold">
          <Link
            href="/"
            className={`py-2.5 transition-colors border-b-2 ${
              pathname === "/"
                ? "text-[#E4002B] border-[#E4002B]"
                : "text-zinc-600 border-transparent hover:text-zinc-900"
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            className={`py-2.5 transition-colors border-b-2 ${
              pathname.startsWith("/katalog")
                ? "text-[#E4002B] border-[#E4002B]"
                : "text-zinc-600 border-transparent hover:text-zinc-900"
            }`}
          >
            Katalog Spare Part
          </Link>
          <Link
            href="/booking"
            className={`py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              pathname.startsWith("/booking")
                ? "text-[#E4002B] border-[#E4002B]"
                : "text-zinc-600 border-transparent hover:text-zinc-900"
            }`}
          >
            <CalendarDays className="w-4 h-4 text-[#E4002B]" />
            <span>Booking Servis</span>
          </Link>
          <a
            href={buildWaUrl("BENGKEL", "Konsultasi Spare Part")}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 text-zinc-600 hover:text-zinc-900 transition-colors hidden md:inline border-b-2 border-transparent"
          >
            Konsultasi Mekanik
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-[68px] bg-white border-b border-slate-200"></div>}>
      <NavbarContent />
    </Suspense>
  );
}

