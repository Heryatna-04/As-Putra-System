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
      <div className="h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-3 text-zinc-500 text-sm font-medium">
        <Loader2 className="w-6 h-6 animate-spin text-[#E4002B]" />
        <span>Memverifikasi sesi petugas...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F6F8] font-sans text-[#0A0A0A] h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Topbar */}
      <header className="md:hidden h-14 bg-[#111318] border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 -ml-1 text-white/60 hover:text-white rounded-lg hover:bg-white/8 transition"
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
        <span className="text-[10px] font-bold text-white/60 bg-white/10 border border-white/10 px-2 py-0.5 rounded-md">
          AHASS
        </span>
      </header>

      <AdminSidebar
        userRole={user?.role}
        userName={user?.nama || user?.email}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6F8]">
        <Toaster position="bottom-right" />
        {children}
      </main>
    </div>
  );
}
