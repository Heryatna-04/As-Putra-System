"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Wrench,
  FileSpreadsheet,
  X,
  LogOut,
  Users
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  userRole?: string;
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ userRole, userName, isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isCrmAccessible = userRole === "ADMIN" || userRole === "KEPALA_BENGKEL";

  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        ...(isCrmAccessible ? [{ label: "Portal CRM", href: "/crm", icon: Users }] : []),
      ],
    },
    {
      title: "LAYANAN & BOOKING",
      items: [
        { label: "Booking", href: "/admin/bookings", icon: CalendarDays },
      ],
    },
    {
      title: "INVENTARIS",
      items: [
        { label: "Sparepart", href: "/admin/spare-parts", icon: Wrench },
        { label: "Import excel", href: "/admin/import", icon: FileSpreadsheet },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-[#E4002B] text-white flex flex-col shrink-0 h-screen overflow-hidden font-sans shadow-2xl md:shadow-none transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header: Logo Wing Honda + AS PUTRA MOTOR */}
        <div className="pt-8 pb-6 px-6 flex flex-col items-center text-center relative border-b border-white/10">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-white/80 hover:text-white md:hidden rounded-lg hover:bg-white/10 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Clean White Honda Wing SVG */}
          <div className="mb-3 flex items-center justify-center">
            <svg
              className="w-16 h-12 text-white"
              viewBox="0 0 100 65"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 48 C 30 45, 60 38, 92 10 C 72 26, 44 38, 20 42 Z" />
              <path d="M16 52 C 34 49, 62 43, 94 20 C 74 34, 46 44, 24 47 Z" />
              <path d="M22 56 C 40 53, 65 47, 95 30 C 75 42, 49 50, 28 52 Z" />
              <path d="M28 60 C 44 57, 68 52, 96 40 C 77 49, 52 55, 34 57 Z" />
            </svg>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white uppercase leading-tight font-display">
            AS PUTRA MOTOR
          </h2>
          <span className="text-[11px] font-semibold text-white/80 tracking-wider uppercase mt-1">
            AHASS 10870 KUNINGAN
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-3 text-[11px] font-bold tracking-wider text-white/60 uppercase mb-2">
                {sec.title}
              </div>
              <div className="space-y-1.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-white text-[#E4002B] shadow-lg shadow-black/10 scale-[1.02]"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#E4002B]" : "text-white"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar: User / Admin Workspace */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {userName || "Admin Bengkel"}
              </div>
              <div className="text-[10px] text-white/70 font-medium truncate">
                Admin Workspace
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
              title="Keluar"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
