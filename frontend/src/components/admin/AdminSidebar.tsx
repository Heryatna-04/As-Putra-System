"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Layers, LogOut, CalendarDays, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  userRole?: string;
  userName?: string;
}

export default function AdminSidebar({ userRole, userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navSections = [
    {
      title: "Monitoring",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "Bengkel & Servis",
      items: [
        { label: "Booking Servis", href: "/admin/bookings", icon: CalendarDays },
      ],
    },
    {
      title: "Inventaris AHM",
      items: [
        { label: "Katalog Spare Part", href: "/admin/spare-parts", icon: Layers },
        { label: "Riwayat Stok", href: "/admin/stock-logs", icon: History },
      ],
    },
  ];

  return (
    <aside className="w-[260px] bg-white text-zinc-700 flex flex-col shrink-0 h-screen overflow-hidden border-r border-zinc-200 font-sans shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-200/80 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-28 shrink-0">
            <Image
              src="/logo.png"
              alt="AS Putra Motor Logo"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-[#B00020] bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
          AHASS
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-6 overflow-y-auto space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              {sec.title}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#E4002B] text-white shadow-xs"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-white" : "text-zinc-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom User Bar */}
      <div className="p-4 border-t border-zinc-200/80 bg-zinc-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#E4002B] text-white font-bold text-sm flex items-center justify-center shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 truncate">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {userName || "Staf Bengkel"}
              </div>
              <div className="mt-0.5">
                {userRole === "KEPALA_BENGKEL" ? (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Kepala Bengkel
                  </span>
                ) : userRole === "CRM" ? (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    CRM Staf
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-200 text-zinc-800">
                    {userRole || "Administrator"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-2 text-zinc-400 hover:text-[#B00020] hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
