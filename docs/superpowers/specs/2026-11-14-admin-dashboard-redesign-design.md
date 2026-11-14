# Admin Portal Redesign Specification (AHASS AS Putra Kuningan)

**Date:** 2026-11-14  
**Scope:** `/admin`, `/admin/bookings`, `/admin/spare-parts`, `/admin/stock-logs`, `/admin/import`, plus shared shell/header/dashboard components (`AdminLayout`, `AdminSidebar`, `AdminPageHeader`, `globals.css`). Out of scope: `/admin/login`, `/crm`, and public customer pages (`/`, `/katalog`, `/booking`).

---

## 1. Visual Direction & Color Tokens

Adapts the layout composition, crisp data visualization density, and smooth motion of the reference dashboard into the **Honda / AHASS 10870 AS Putra Rahmat** brand identity.

### Brand & Surface Palette
- **Outer Shell & Sidebar (Crimson Brand Frame):**
  - Gradient: `linear-gradient(180deg, #E4002B 0%, #C80021 55%, #A3001B 100%)`
  - Sidebar active navigation pill: `bg-white/20 text-white border border-white/25 shadow-sm backdrop-blur-xs`
  - Sidebar hover item: `hover:bg-white/12 text-white/90`
  - Sidebar search input: `bg-white/15 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20`
  - Sidebar bottom widgets (Sync status / Profile): `bg-black/15 border border-white/15`
- **Floating Content Workspace Sheet:**
  - Desktop container (`md:p-2.5 md:gap-2.5` on the crimson shell) wraps `<main>` as a rounded elevated workspace:
    - Light mode: `bg-[#F8FAFC] text-slate-900 md:rounded-[26px]`
    - Dark mode (`useTheme` preserved): `dark:bg-[#0B111A] dark:text-slate-100`
- **Cards & Tables:**
  - Card surface: `bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]`
  - Interactive card hover: `hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300/90 dark:hover:border-slate-700`
- **Semantic Status Accents:**
  - Brand / Primary CTA: `#E4002B` (hover `#C40024`)
  - Success / Ready / Selesai: Emerald (`#10B981`, soft tint `bg-emerald-50 text-emerald-700 border-emerald-200`)
  - Warning / Pending / Empty Stock: Amber (`#F59E0B`, soft tint `bg-amber-50 text-amber-700 border-amber-200`)
  - In Progress / Active Pit: Blue (`#3B82F6`, soft tint `bg-blue-50 text-blue-700 border-blue-200`)
  - Discontinue / Cancelled / Neutral: Slate (`#64748B`, soft tint `bg-slate-100 text-slate-600 border-slate-200`)

---

## 2. Animation & Motion Architecture (Zero New Dependencies)

Implemented exclusively with native CSS `@keyframes` in `frontend/src/app/globals.css`, Tailwind transitions, SVG stroke transitions, and `recharts` built-in draw animations (already installed at `recharts@^3.10.1`). No external animation package is added.

### Motion Primitives
1. **Workspace Sheet Entrance (`.admin-sheet-enter`):**
   - Subtle reveal (`opacity: 0; transform: translateY(8px) scale(0.995)` → `opacity: 1; transform: translateY(0) scale(1)`), duration `320ms cubic-bezier(0.16, 1, 0.3, 1)`.
2. **Staggered Card Entrance (`.admin-stagger-item`):**
   - Fade + slide up (`translateY(14px)` → `0`), duration `420ms cubic-bezier(0.16, 1, 0.3, 1)`, `animation-delay: calc(var(--stagger-index, 0) * 55ms)`.
3. **Interactive Hover Lift (`.admin-card-interactive`):**
   - `transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, border-color 220ms ease;`
   - Lifts `-3px` on hover and settles cleanly on press (`active:translate-y-0`).
4. **Animated SVG Progress Ring (`ProgressRing.tsx`):**
   - Animates `stroke-dashoffset` from full circumference to target percentage over `700ms cubic-bezier(0.16, 1, 0.3, 1)` on mount/update.
5. **Recharts Chart Draw Animations:**
   - Sparklines, multi-series `AreaChart`, and `PieChart` donut enable `isAnimationActive={true}` (`animationDuration={750}`, `animationEasing="ease-out"`).
6. **Reduced Motion Support:**
   - `@media (prefers-reduced-motion: reduce)` disables keyframe motion and keeps transitions instantaneous.

---

## 3. Shared Shell & Component Architecture

All new components follow functional English filenames (no design-style names) and strict TypeScript typing (no `any`).

### 3.1 `frontend/src/app/admin/layout.tsx`
- Renders the Crimson outer frame (`bg-[#B0001F]` / crimson gradient on desktop, mobile crimson topbar preserved).
- Wraps `<main>` in the floating rounded workspace sheet (`bg-[#F8FAFC] dark:bg-[#0B111A] md:rounded-[26px] md:shadow-2xl overflow-hidden flex-1 flex flex-col min-w-0`).
- Preserves `/admin/login` bypass, `CRM` role redirect, and auth loading state.

### 3.2 `frontend/src/components/admin/AdminSidebar.tsx`
- **Brand Header:** White circular emblem (`/honda-logo.png`), `AS PUTRA` + `AHASS 10870` badge, desktop collapse/expand button (`PanelLeftClose`/`PanelLeftOpen`), mobile close button.
- **Quick Menu Filter:** Compact search input (`Cari menu...`) visible when expanded; filters `navItems` dynamically without losing collapse behavior.
- **Navigation Items:** Preserves all existing routes (`/admin`, `/admin/bookings`, `/admin/spare-parts`, `/admin/stock-logs`, `/admin/import`, and conditional `/crm`). Active item uses translucent white pill (`bg-white/20 border-white/25`). Collapsed mode keeps tooltip on hover.
- **Bottom Footer:** Compact Database Sync card (`Supabase PostgreSQL · 44.000+ SKU`) + User avatar/name/role + Logout button.

### 3.3 `frontend/src/components/admin/AdminPageHeader.tsx`
- Replaces the redundant full-width red hero banner inside the white sheet with a clean, crisp workspace header bar (`bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-5 sm:px-6 py-3.5`) shared across **all 5 admin pages** (`/admin`, `bookings`, `spare-parts`, `stock-logs`, `import`):
  - Left: Icon badge (soft crimson tint `bg-red-50 text-[#E4002B]`), breadcrumb (`Admin / <breadcrumb>`), page title, and concise subtitle.
  - Right: `actions` slot + built-in Light/Dark theme toggle pill (`useTheme`).
- Fixes contrast on action buttons across all subpages (notably `spare-parts/page.tsx`, where white-text buttons previously sat on a white topbar).

### 3.4 Reusable Admin Data Primitives (`frontend/src/components/admin/`)
- `StatSparklineCard.tsx`: KPI card displaying title, trend/status pill, large tabular value (`tabular-nums`), subtitle, and an optional Recharts mini `AreaChart` sparkline with gradient fill. Used across `/admin` and summary strips.
- `ProgressRing.tsx`: Reusable animated circular progress SVG (`stroke-dashoffset` draw-in) used for completion/readiness gauges on `/admin/spare-parts` (Stok Ready %) and `/admin/bookings` (Tingkat Selesai %).
- `PipelineStageStrip.tsx`: Horizontal grid of 4 stage summary cards with colored top accent strips (matching the reference pipeline row), numeric counts, and click/link filters. Used on `/admin` and `/admin/bookings`.

---

## 4. Page Designs & Real Data Mapping

### 4.1 `/admin` (`frontend/src/app/admin/page.tsx` + `frontend/src/components/admin/dashboard/`)
Decomposes the 1005-line dashboard page into focused dashboard components while keeping 100% live API data from `/admin/summary` and `/admin/bookings?limit=100`:

1. **Workspace Header:** Uses shared `AdminPageHeader` with greeting (`Selamat Datang, <displayName>`), role/AHASS subtitle, built-in theme toggle, `+ Tambah Part`, and `Kelola Antrean` primary CTA (`bg-[#E4002B]`).
2. **Row 1 — 4 KPI Sparkline Cards (`StatSparklineCard`):**
   - **Total Booking:** `bookingStats.total` + 7-day daily booking count sparkline derived from `allBookings`.
   - **Tingkat Selesai:** Completion % (`done / total`) + `DONE` count + daily completion sparkline.
   - **Antrean Aktif:** `pending` (`PENDING + CONFIRMED + IN_PROGRESS`) + active queue sparkline.
   - **Suku Cadang Siap Jual:** `Math.max(0, summary.totalActive - summary.outOfStock)` from `summary.totalActive`, paired with `outOfStock` warning badge.
3. **Row 2 — Analytics Grid (12 Columns):**
   - **Left 8 Cols (`BookingTrendChart.tsx`):** Recharts multi-series `AreaChart` showing daily **Servis Motor (`SERVIS`)** vs **Suku Cadang (`SPAREPART`)** booking counts built from `allBookings`. Includes timeframe switcher (`7H`, `14H`, `30H`) and custom styled tooltip.
   - **Right 4 Cols (`BookingStatusChart.tsx`):** Recharts `PieChart` donut displaying booking status distribution (`Selesai`, `Dikerjakan`, `Terjadwal`, `Menunggu`, `Dibatalkan`) with large center percentage and interactive legend list.
4. **Row 3 — Pipeline Status (`PipelineStageStrip.tsx`):**
   - 4 stage cards (`Menunggu Konfirmasi`, `Terkonfirmasi`, `Sedang Dikerjakan`, `Selesai`) with colored top accent strip, live counts from `allBookings`, and click-through links to `/admin/bookings?status=...`.
5. **Row 4 — Workshop Operations & Schedule (12 Columns):**
   - **Left 6 Cols (`PitOperationsCard.tsx`):** 4 Pit AHASS (`P1`–`P4`) mapped from `selectedDayBookings` / fallback pool, status pills, and `Atur Pit` link.
   - **Right 6 Cols (`BookingCalendarCard.tsx`):** Interactive monthly mini calendar (booking indicator dots + selected date highlight in `#E4002B`) paired alongside selected-day service schedule list.
6. **Row 5 — Recent Queue & Transactions (`RecentBookingsCard.tsx`):**
   - Latest bookings list preserving ticket type badge (`PART` / `PIT SERVIS`), plate number, WhatsApp quick-chat button, one-click `Konfirmasi` (`handleQuickConfirm`), and status badge.

### 4.2 `/admin/bookings` (`frontend/src/app/admin/bookings/page.tsx`)
- Uses updated `AdminPageHeader` inside the `#F8FAFC` sheet (`bg-transparent`).
- Adds a compact 4-card `PipelineStageStrip` summary bar (Total Halaman / Pending / Dikerjakan / Selesai derived from loaded booking stats) clickable to switch status filter.
- Refines filter bar, type tabs (`Semua Reservasi`, `Servis Motor`, `Suku Cadang`), table container (`rounded-2xl border-slate-200/80`), row hover states, and detail modal styling.
- Preserves all existing features: search debounce, date range, status update, WhatsApp notification link, Excel export, pagination, and deep-link `?status=` / `?highlight=`.

### 4.3 `/admin/spare-parts` (`frontend/src/app/admin/spare-parts/page.tsx`)
- Uses updated `AdminPageHeader` with high-contrast action buttons (`+ Tambah Part` in `#E4002B`, `Refresh` in white/slate border).
- Adds a compact 3-card stock summary strip using `/admin/summary` (`Total SKU Aktif`, `Siap Jual`, `Stok Kosong`) where cards act as quick stock-status filters.
- Upgrades toolbar, Excel-style column filter dropdowns, table surface (`rounded-2xl`), and CRUD/image modals to the unified slate/crimson token system while keeping all sorting, column filtering, stock update, image upload/delete, and soft-delete behaviors intact.

### 4.4 `/admin/stock-logs` (`frontend/src/app/admin/stock-logs/page.tsx`)
- Uses updated `AdminPageHeader`.
- Adds a compact 3-stat strip summarizing current log page metrics (Total Catatan, Mutasi Masuk `+`, Mutasi Keluar `-`).
- Upgrades table surface (`rounded-2xl`), staggered row entrance, user badge styling, and pagination controls.

### 4.5 `/admin/import` (`frontend/src/app/admin/import/page.tsx`)
- Uses updated `AdminPageHeader` inside the `#F8FAFC` sheet (`bg-transparent`).
- Adds a clean 3-step visual progress indicator (`1. Upload File` → `2. Preview Validasi` → `3. Selesai & Riwayat`) reflecting `previewData` / `confirmResult` state.
- Refines drag-and-drop upload zone, AHASS format badge, preview table, and import history cards to match V28 surface tokens while preserving template download, preview validation, and batch confirmation logic.

---

## 5. Quality, Performance & Safety Constraints

- **TypeScript Strictness:** Zero `any` in newly created or modified frontend components (`BookingItem`, `ImportBatch`, etc. stay strongly typed).
- **Bundle & Performance:** No new npm packages; Recharts components remain client-side inside `"use client"` dashboard widgets with responsive containers (`minWidth={0}`).
- **Verification Gate:** After implementation, run `npx tsc --noEmit`, `npm run lint`, and `npm run build` in `frontend/`, then verify visually across desktop and mobile viewports on all 5 admin routes.
