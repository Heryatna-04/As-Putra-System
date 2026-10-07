"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

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
    <div className="bg-[#FAFAFA] font-sans text-[#0A0A0A] h-screen flex overflow-hidden">
      <AdminSidebar userRole={user?.role} userName={user?.nama || user?.email} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAFAFA]">
        <Toaster position="bottom-right" />
        {children}
      </main>
    </div>
  );
}
