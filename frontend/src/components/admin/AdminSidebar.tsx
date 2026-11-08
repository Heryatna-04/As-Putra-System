"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Wrench,
  FileSpreadsheet,
  X,
  LogOut,
  Users,
  History,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Database,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface AdminSidebarProps {
  userRole?: string;
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  userRole,
  userName,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isCrmAccessible = userRole === "ADMIN" || userRole === "KEPALA_BENGKEL";

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("as_putra_admin_sidebar_collapsed");
      if (saved !== null) setIsCollapsed(saved === "true");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("as_putra_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Booking Servis", href: "/admin/bookings", icon: CalendarDays },
    { label: "Sparepart & Stok", href: "/admin/spare-parts", icon: Wrench },
    { label: "Riwayat Mutasi", href: "/admin/stock-logs", icon: History },
    { label: "Import Excel", href: "/admin/import", icon: FileSpreadsheet },
    ...(isCrmAccessible
      ? [{ label: "Portal CRM", href: "/crm", icon: Users }]
      : []),
  ];

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";
  const displayRole =
    userRole === "ADMIN"
      ? "Kepala Bengkel"
      : userRole === "KEPALA_BENGKEL"
      ? "Kepala Bengkel"
      : userRole === "CRM"
      ? "CRM Staff"
      : "Admin Bengkel";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          flex flex-col h-full shrink-0
          bg-[#0B111A] text-white
          border border-zinc-800/90 shadow-2xl md:shadow-lg
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[72px] w-[260px] md:rounded-2xl" : "w-[260px] md:rounded-3xl"}
          md:p-4 p-3.5 justify-between select-none
        `}
      >
        {/* ── TOP SECTION: Brand & Role ── */}
        <div className="space-y-4">
          {/* Logo & Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative">
            <div className="flex items-center gap-3 min-w-0">
              {/* Circular Emblem */}
              <div className="relative w-10 h-10 rounded-2xl bg-white p-1.5 shrink-0 shadow-md border border-white/20 flex items-center justify-center">
                <Image
                  src="/honda-logo.png"
                  alt="Logo Honda"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black tracking-tight text-white uppercase truncate">
                      AS PUTRA
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#E4002B] text-white">
                      KUNINGAN
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium truncate">
                    AHASS 10870 · One Heart
                  </span>
                </div>
              )}
            </div>

            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer ${
                isCollapsed ? "mx-auto mt-1" : ""
              }`}
              title={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Close button on mobile */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition md:hidden"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Pill (Executive Badge) */}
          {!isCollapsed && (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-zinc-300 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#E4002B] shrink-0" />
                <span className="truncate text-[11px] font-bold text-white">
                  {displayRole}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          )}

          {/* ── NAVIGATION LIST ── */}
          <nav className="space-y-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold
                    transition-all duration-200 relative
                    ${
                      isActive
                        ? "bg-[#E4002B] text-white shadow-lg shadow-red-950/50"
                        : "text-zinc-400 hover:text-white hover:bg-white/8"
                    }
                    ${isCollapsed ? "justify-center px-2 py-3" : ""}
                  `}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? "text-white scale-110" : "text-zinc-400 group-hover:text-white group-hover:scale-105"
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {isActive && !isCollapsed && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80" />
                  )}

                  {/* Tooltip saat collapsed */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-zinc-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── BOTTOM SECTION: Cloud Sync & User ── */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          {/* Cloud Database Status Widget (ala Scale Device di Screenshot) */}
          {!isCollapsed ? (
            <div className="bg-black/40 border border-white/8 rounded-2xl p-3 flex flex-col gap-1.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  DATABASE SYNC
                </span>
                <span className="text-zinc-500 text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-sans">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] font-bold text-zinc-300 truncate">
                Supabase PostgreSQL
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">
                44.000+ SKU Tersinkron
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-emerald-400"
              title="Database Sync: Active"
            >
              <Database className="w-4 h-4" />
            </div>
          )}

          {/* User Profile Footer */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E4002B] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs border border-red-400/30">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-bold text-white truncate">
                    {userName || "Admin AHASS"}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {displayRole}
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-1">
              <div
                className="w-8 h-8 rounded-xl bg-[#E4002B] text-white flex items-center justify-center text-xs font-black shadow-xs border border-red-400/30"
                title={userName || "Admin AHASS"}
              >
                {userInitial}
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
