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
  Users,
  ShieldCheck,
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

  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        ...(isCrmAccessible
          ? [{ label: "Portal CRM", href: "/crm", icon: Users }]
          : []),
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[270px] bg-gradient-to-b from-[#E4002B] via-[#D00026] to-[#A3001D] text-white flex flex-col shrink-0 h-screen overflow-hidden font-sans shadow-2xl md:shadow-xl border-r border-red-700/30 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header: Logo Wing Honda + AS PUTRA MOTOR */}
        <div className="pt-8 pb-6 px-6 flex flex-col items-center text-center relative border-b border-white/15">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white md:hidden rounded-xl hover:bg-white/10 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Clean White Honda Wing SVG with subtle glow */}

          <div className="relative mb-3.5 flex h-25 w-25 items-center justify-center overflow-hidden ">
            <Image
              src="/honda-logo.png"
              alt="Logo Honda AS Putra"
              width={64}
              height={64}
              className="h-full w-full object-contain opacity-90"
              priority
            />
          </div>

          <h2 className="text-xl font-black tracking-tight text-white uppercase leading-tight font-display drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            AS PUTRA MOTOR
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E4002B] bg-white px-2 py-0.5 rounded-full shadow-xs">
              AHASS 10870
            </span>
            <span className="text-[11px] font-semibold text-white/90 tracking-wide">
              KUNINGAN
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-3 text-[11px] font-extrabold tracking-wider text-white/50 uppercase mb-2.5">
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
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-white text-[#E4002B] shadow-[0_4px_20px_rgba(0,0,0,0.15)] scale-[1.02]"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? "text-[#E4002B] scale-110" : "text-white/80"}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Modern Frosted User Bar */}
        <div className="p-4 border-t border-white/15 bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white text-[#E4002B] font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {userName || "Admin Bengkel"}
                </div>
                <div className="text-[10px] text-white/70 font-medium truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-white/90" />
                  <span>{userRole || "Administrator"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all shrink-0"
              title="Keluar Akun"
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
