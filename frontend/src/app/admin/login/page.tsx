"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login gagal. Periksa kembali email dan password Anda.");
      }

      login(data.data.access_token, data.data.user);

      if (data.data.user?.role === "CRM") {
        router.push("/crm");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B00020] bg-red-50 border border-red-200/60 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4002B]" />
          Portal Petugas AHASS
        </span>
      </header>

      {/* Main Content Card */}
      <main className="my-auto w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden my-6">
        {/* Left Info Panel */}
        <div className="md:col-span-5 bg-white p-6 sm:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200 min-h-[260px] md:min-h-full">
          <div className="relative w-full h-full min-h-[220px]">
            <Image
              src="/logo.png"
              alt="AS Putra Motor Logo"
              fill
              priority
              className="object-contain p-2"
            />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-zinc-900">Masuk Akun</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Gunakan email dan kata sandi petugas terdaftar.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-[#B00020] text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="petugas@asputra.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-800 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-20 py-2.5 bg-white border border-zinc-300 rounded-lg text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded transition-colors"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E4002B] hover:bg-[#C20026] text-white font-semibold text-base rounded-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-xs text-zinc-500">
        &copy; 2026 AS Putra Rahmat Kuningan. Honda Official Authorized System.
      </footer>
    </div>
  );
}
