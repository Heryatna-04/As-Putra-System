import Image from "next/image";
import { type LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  /** Page title */
  title: string;
  /** Short subtitle / description */
  subtitle?: string;
  /** Breadcrumb label, e.g. "Booking" */
  breadcrumb: string;
  /** Lucide icon for this page */
  icon: LucideIcon;
  /** Optional right-side action slot (buttons, selects, etc.) */
  actions?: React.ReactNode;
}

/**
 * Shared admin page header with Honda branding.
 * Renders a slim topbar (breadcrumb + actions) and a Honda-branded hero banner.
 */
export default function AdminPageHeader({
  title,
  subtitle,
  breadcrumb,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <>
      {/* ── SLIM TOPBAR ── */}
      <div className="h-[52px] bg-white dark:bg-[#0E1522] border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between px-5 shrink-0 transition-colors">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
          <span>Admin</span>
          <span className="text-zinc-200 dark:text-zinc-700">/</span>
          <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{breadcrumb}</span>
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* ── HONDA BRAND BANNER ── */}
      <div className="relative overflow-hidden bg-[#E4002B] shrink-0">
        {/* Background: subtle wing pattern via logo */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Faint dealer photo overlay */}
          <Image
            src="/as-putra-dealer.png"
            alt=""
            fill
            aria-hidden
            className="object-cover object-center opacity-[0.08]"
            priority={false}
          />
          {/* Large faint Honda wing — decorative */}
          <div className="absolute -right-8 -top-6 w-48 h-48 opacity-[0.07]">
            <Image
              src="/honda-logo.png"
              alt=""
              fill
              aria-hidden
              className="object-contain brightness-0 invert"
            />
          </div>
          {/* Gradient fade left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#C8001F] via-[#E4002B]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Icon circle */}
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2} />
            </div>

            {/* Title + subtitle */}
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-white/65 font-medium mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Honda badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-lg px-2.5 py-1">
              <div className="relative w-4 h-4">
                <Image
                  src="/honda-logo.png"
                  alt="Honda"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
              <span className="text-[10px] font-black text-white tracking-widest uppercase">
                AHASS 10870
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
