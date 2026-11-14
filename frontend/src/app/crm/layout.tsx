"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { LogOut, Wrench, LayoutDashboard, Loader2, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-[#070B10] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
        <Loader2 className="w-6 h-6 animate-spin text-[#E8272A]" />
        <span>Memverifikasi hak akses CRM...</span>
      </div>
    );
  }

  const canAccessAdmin = user?.role === "ADMIN" || user?.role === "KEPALA_BENGKEL";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B10] flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Toaster position="bottom-right" />
      {/* Topbar CRM */}
      <header className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#E8272A] flex items-center justify-center text-white shrink-0">
              <Wrench size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none truncate">AS PUTRA MOTOR</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                  PORTAL CRM
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">Portal Follow-Up Servis &amp; Layanan Pelanggan</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-amber-400 transition cursor-pointer"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {canAccessAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Beralih ke Dashboard Admin"
              >
                <LayoutDashboard size={14} className="text-[#E8272A]" />
                <span className="hidden sm:inline">Dashboard Admin</span>
              </Link>
            )}

            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">{user?.nama || user?.email}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-mono">{user?.role}</div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#E8272A] dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
