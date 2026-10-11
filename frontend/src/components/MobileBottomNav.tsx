"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PackageSearch, MessageSquare } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin panel routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    {
      label: "Beranda",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Booking",
      href: "/booking",
      icon: Calendar,
      isActive: pathname === "/booking",
    },
    {
      label: "Katalog",
      href: "/katalog",
      icon: PackageSearch,
      isActive: pathname.startsWith("/katalog"),
    },
    {
      label: "WhatsApp",
      href: "https://wa.me/6281111116408?text=Halo%20Admin%20AHASS%20AS%20Putra%2C%20saya%20ingin%20bertanya.",
      icon: MessageSquare,
      isActive: false,
      isExternal: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur-md md:hidden shadow-lg pb-safe">
      <div className="flex items-center justify-around py-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const activeClass = item.isActive
            ? "text-[#E4002B] font-bold"
            : "text-zinc-500 hover:text-zinc-900";

          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center w-full py-1 text-[11px] transition-all ${activeClass}`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5 text-emerald-600" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <span className="text-zinc-700 font-medium">{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-1 text-[11px] transition-all ${activeClass}`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${item.isActive ? "text-[#E4002B] scale-110" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
