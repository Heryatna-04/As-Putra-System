"use client";

import type { ReactNode } from "react";
import { type LucideIcon, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface AdminPageHeaderProps {
  /** Page heading title. */
  title: string;
  /** Optional supporting subtitle displayed below the title. */
  subtitle?: string;
  /** Breadcrumb label for the current workspace route, e.g. "Booking Servis". */
  breadcrumb: string;
  /** Lucide icon rendered in the header badge. */
  icon: LucideIcon;
  /** Optional right-side action slot (buttons, links, filters). */
  actions?: ReactNode;
  /** Controls visibility of the built-in Light/Dark theme toggle. */
  showThemeToggle?: boolean;
}

/**
 * Shared admin workspace header bar rendered at the top of the floating sheet.
 * Provides breadcrumb context, title/subtitle, a high-contrast actions slot,
 * and a Light/Dark mode switcher backed by `useTheme`.
 */
export default function AdminPageHeader({
  title,
  subtitle,
  breadcrumb,
  icon: Icon,
  actions,
  showThemeToggle = true,
}: AdminPageHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-5 sm:px-6 py-3.5 shrink-0 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-[#E4002B] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>AHASS 10870</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                {breadcrumb}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-slate-700 dark:text-slate-200">
          {actions}

          {showThemeToggle && (
            <div
              role="group"
              aria-label="Pengaturan tema"
              className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/80 dark:border-slate-700"
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                aria-pressed={theme === "light"}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white dark:bg-slate-700 shadow-2xs text-amber-500"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Mode Terang"
                aria-label="Mode Terang"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-white dark:bg-slate-700 shadow-2xs text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Mode Gelap"
                aria-label="Mode Gelap"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
