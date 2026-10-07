"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <>
        <Toaster position="bottom-right" />
        {children}
      </>
    );
  }

  // With middleware.ts handling the redirect, we just show a loader 
  // if the client context is still resolving the user data
  if (isLoading) {
    return (
      <div className="h-screen bg-[#FAFAFA] flex items-center justify-center text-zinc-500 text-sm font-medium">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] font-sans text-[#0A0A0A] h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Topbar with Hamburger Toggle */}
      <header className="md:hidden h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 -ml-1 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative h-6 w-24">
            <Image
              src="/logo.png"
              alt="AS Putra Motor"
              fill
              className="object-contain object-left"
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#B00020] bg-red-50 border border-red-200/60 px-2 py-0.5 rounded">
          AHASS
        </span>
      </header>

      <AdminSidebar
        userRole={user?.role}
        userName={user?.nama || user?.email}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAFAFA]">
        <Toaster position="bottom-right" />
        {children}
      </main>
    </div>
  );
}
