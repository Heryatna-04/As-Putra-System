"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  userRole?: string;
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Crimson navigation sidebar for the AHASS Admin workspace.
 * Supports desktop collapse persistence, searchable menu filtering,
 * role-gated CRM access, database sync status, and mobile drawer mode.
 */
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
  const [menuQuery, setMenuQuery] = useState("");

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

  const normalizedQuery = menuQuery.trim().toLowerCase();
  // Only apply the text filter while expanded; collapsed rail has no visible search box.
  const visibleNavItems =
    !isCollapsed && normalizedQuery
      ? navItems.filter((item) =>
          item.label.toLowerCase().includes(normalizedQuery)
        )
      : navItems;

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";
  const displayRole =
    userRole === "ADMIN" || userRole === "KEPALA_BENGKEL"
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
          bg-gradient-to-b from-[#E4002B] via-[#C80021] to-[#A3001B]
          dark:from-[#0F172A] dark:via-[#0B111A] dark:to-[#070B10]
          text-white border-r border-white/15 dark:border-slate-800/80 md:border-none shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[72px] w-[252px]" : "w-[248px]"}
          md:py-3 md:px-2.5 p-3.5 justify-between select-none
        `}
      >
        <div className="space-y-3.5">
          {/* Brand Row */}
          <div className="flex items-center justify-between px-1 pb-2.5 border-b border-white/15 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-tight text-white uppercase truncate">
                      AS PUTRA
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 dark:bg-[#E4002B]/25 text-white dark:text-red-200">
                      10870
                    </span>
                  </div>
                  <span className="text-[10px] text-white/75 dark:text-slate-400 font-medium truncate">
                    AHASS Kuningan
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCollapsed}
              className={`hidden md:flex p-1.5 rounded-lg text-white/80 dark:text-slate-400 hover:text-white hover:bg-white/15 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer ${
                isCollapsed ? "mx-auto" : ""
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

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 dark:text-slate-400 hover:text-white hover:bg-white/15 dark:hover:bg-slate-800 transition md:hidden"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Menu Filter */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/70 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Cari menu..."
                aria-label="Cari menu admin"
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-white/15 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 text-xs font-medium text-white placeholder:text-white/70 dark:placeholder:text-slate-400 focus:outline-none focus:bg-white/20 dark:focus:bg-slate-800 focus:border-white/35 dark:focus:border-slate-600 transition"
              />
              {menuQuery && (
                <button
                  type="button"
                  onClick={() => setMenuQuery("")}
                  aria-label="Hapus pencarian menu"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 dark:text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Role Status Pill */}
          {!isCollapsed && (
            <div className="bg-black/15 dark:bg-slate-900/75 border border-white/15 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white dark:text-[#E4002B] shrink-0" />
                <span className="truncate text-[11px] font-bold text-white">
                  {displayRole}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-200 dark:text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          )}

          {/* Navigation List */}
          <nav className="space-y-1 pt-0.5">
            {visibleNavItems.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-white/70 dark:text-slate-400">
                Menu tidak ditemukan
              </div>
            ) : (
              visibleNavItems.map((item) => {
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
                      group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold
                      transition-all duration-200 relative
                      ${
                        isActive
                          ? "bg-white/22 dark:bg-[#E4002B] text-white border border-white/25 dark:border-[#E4002B] shadow-sm backdrop-blur-xs font-bold"
                          : "text-white/80 dark:text-slate-400 hover:text-white hover:bg-white/12 dark:hover:bg-slate-800/80 border border-transparent"
                      }
                      ${isCollapsed ? "justify-center px-2 py-2.5" : ""}
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? "text-white scale-105"
                          : "text-white/80 dark:text-slate-400 group-hover:text-white group-hover:scale-105"
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {isActive && !isCollapsed && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/85" />
                    )}

                    {isCollapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10 dark:border-slate-700">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Bottom Section: Cloud Sync & User Footer */}
        <div className="space-y-2.5 pt-3 border-t border-white/15 dark:border-slate-800">
          {!isCollapsed ? (
            <div className="bg-black/15 dark:bg-slate-900/75 border border-white/15 dark:border-slate-800 rounded-xl p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="flex items-center gap-1.5 text-emerald-200 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-400 animate-ping" />
                  DATABASE SYNC
                </span>
                <span className="text-white/90 text-[9px] bg-white/15 dark:bg-slate-800 px-1.5 py-0.5 rounded font-sans">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] font-bold text-white truncate">
                Supabase PostgreSQL
              </div>
              <div className="text-[10px] text-white/70 dark:text-slate-400 font-medium">
                44.000+ SKU Tersinkron
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-black/15 dark:bg-slate-900/75 border border-white/15 dark:border-slate-800 flex items-center justify-center text-emerald-200 dark:text-emerald-400"
              title="Database Sync: Active"
            >
              <Database className="w-4 h-4" />
            </div>
          )}

          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 pt-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#E4002B] text-[#E4002B] dark:text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-bold text-white truncate">
                    {userName || "Admin AHASS"}
                  </div>
                  <div className="text-[10px] text-white/70 dark:text-slate-400 truncate">
                    {displayRole}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-white/80 dark:text-slate-400 hover:text-white hover:bg-white/15 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-0.5">
              <div
                className="w-8 h-8 rounded-xl bg-white dark:bg-[#E4002B] text-[#E4002B] dark:text-white flex items-center justify-center text-xs font-black shadow-xs"
                title={userName || "Admin AHASS"}
              >
                {userInitial}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-white/80 dark:text-slate-400 hover:text-white hover:bg-white/15 dark:hover:bg-slate-800 transition cursor-pointer"
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
