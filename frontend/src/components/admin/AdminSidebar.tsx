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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
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
    ...(isCrmAccessible
      ? [{ label: "Portal CRM", href: "/crm", icon: Users }]
      : []),
    { label: "Booking", href: "/admin/bookings", icon: CalendarDays },
    { label: "Sparepart", href: "/admin/spare-parts", icon: Wrench },
    { label: "Riwayat Stok", href: "/admin/stock-logs", icon: History },
    { label: "Import Excel", href: "/admin/import", icon: FileSpreadsheet },
  ];

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";
  const displayRole =
    userRole === "ADMIN"
      ? "Admin"
      : userRole === "KEPALA_BENGKEL"
      ? "Kepala Bengkel"
      : userRole === "MEKANIK"
      ? "Mekanik"
      : userRole === "CRM"
      ? "CRM"
      : "Staff";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          flex flex-col h-screen shrink-0
          bg-[#111318] text-white
          border-r border-white/[0.06]
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[64px] w-[260px]" : "w-[260px]"}
        `}
      >
        {/* ── HEADER: Logo + Brand ── */}
        <div
          className={`flex items-center shrink-0 h-14 border-b border-white/[0.06] px-3 gap-3 relative`}
        >
          {/* Close button mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition md:hidden"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Logo */}
          <div className="relative w-7 h-7 shrink-0">
            <Image
              src="/honda-logo.png"
              alt="Logo Honda"
              width={28}
              height={28}
              className="object-contain brightness-0 invert opacity-90"
              priority
            />
          </div>

          {/* Brand text */}
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 leading-tight animate-in fade-in duration-150">
              <span className="text-[13px] font-bold text-white tracking-tight truncate">
                AS Putra Motor
              </span>
              <span className="text-[10px] text-white/40 font-medium tracking-wide">
                AHASS 10870 · Kuningan
              </span>
            </div>
          )}

          {/* Desktop collapse toggle — far right */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`hidden md:flex ml-auto p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition shrink-0 cursor-pointer ${
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
        </div>

        {/* ── NAV ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
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
                  group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium
                  transition-all duration-150 relative
                  ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:text-white hover:bg-white/6"
                  }
                  ${isCollapsed ? "justify-center px-2" : ""}
                `}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Active indicator dot */}
                {isActive && !isCollapsed && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                )}

                {/* Tooltip saat collapsed */}
                {isCollapsed && (
                  <span className="absolute left-full ml-2.5 px-2.5 py-1 rounded-md bg-zinc-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-white/10">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── USER FOOTER ── */}
        <div
          className={`shrink-0 border-t border-white/[0.06] p-2 ${
            isCollapsed ? "flex flex-col items-center gap-2" : ""
          }`}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-1 py-1.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userInitial}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-white/90 truncate leading-tight">
                  {userName || "Admin"}
                </div>
                <div className="text-[10.5px] text-white/40 truncate leading-tight">
                  {displayRole}
                </div>
              </div>
              {/* Logout */}
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition shrink-0 cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Avatar only */}
              <div
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white text-xs font-bold"
                title={userName || "Admin"}
              >
                {userInitial}
              </div>
              {/* Logout icon */}
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
