"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";
import { Menu, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Client-side role guard: jika user adalah CRM, alihkan dari /admin/* ke /crm
  useEffect(() => {
    if (!isLoading && user && user.role === "CRM" && !isLoginPage) {
      router.replace("/crm");
    }
  }, [isLoading, user, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <>
        <Toaster position="bottom-right" />
        {children}
      </>
    );
  }

  // Loader halus saat memeriksa atau me-refresh sesi di client
  if (isLoading) {
    return (
      <div className="h-screen bg-[#F8FAFC] dark:bg-[#0B111A] flex flex-col items-center justify-center gap-3 text-slate-500 text-sm font-medium">
        <Loader2 className="w-6 h-6 animate-spin text-[#E4002B]" />
        <span>Memverifikasi sesi petugas...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#E4002B] via-[#C80021] to-[#A3001B] dark:from-[#0F172A] dark:via-[#0B111A] dark:to-[#070B10] font-sans text-slate-900 dark:text-slate-100 h-screen flex flex-col md:flex-row overflow-hidden md:p-2.5 md:gap-2 transition-colors">
      {/* Mobile Topbar */}
      <header className="md:hidden h-14 bg-[#E4002B] dark:bg-[#0F172A] border-b border-white/15 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 -ml-1 text-white/85 hover:text-white rounded-lg hover:bg-white/15 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative h-6 w-24">
            <Image
              src="/logo.png"
              alt="AS Putra Motor"
              fill
              className="object-contain object-left brightness-0 invert"
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-white bg-white/15 border border-white/20 px-2 py-0.5 rounded-md tracking-wider">
          AHASS 10870
        </span>
      </header>

      <AdminSidebar
        userRole={user?.role}
        userName={user?.nama || user?.email}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] dark:bg-[#0B111A] md:rounded-[26px] md:shadow-2xl border border-black/5 dark:border-slate-800/80 transition-colors admin-sheet-enter">
        <Toaster position="bottom-right" />
        {children}
      </main>
    </div>
  );
}
