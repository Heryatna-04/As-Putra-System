"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Wrench } from "lucide-react";
import { Toaster } from "sonner";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F8F9FA] flex items-center justify-center text-zinc-500 text-sm font-medium">
        Memeriksa hak akses CRM...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-zinc-900">
      <Toaster position="bottom-right" />
      {/* Topbar CRM */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E8272A] flex items-center justify-center text-white">
              <Wrench size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-zinc-900 leading-none">AS PUTRA MOTOR</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                  PORTAL CRM
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5 block">Customer Relationship Management (Read-Only)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-zinc-900">{user?.nama || user?.email}</div>
              <div className="text-[11px] text-zinc-400 uppercase font-mono">{user?.role}</div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-[#E8272A] hover:bg-zinc-50 transition-colors"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
