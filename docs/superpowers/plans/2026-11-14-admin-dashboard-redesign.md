# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire AHASS AS Putra Admin Portal (`/admin`, `/admin/bookings`, `/admin/spare-parts`, `/admin/stock-logs`, `/admin/import`) to match the reference V28 dashboard layout and animations using a Honda Crimson (`#E4002B`) shell, floating rounded workspace sheet, Recharts visualizations, and zero new npm dependencies.

**Architecture:** Extract pure analytics/metric derivation helpers into `frontend/src/lib/admin-metrics.ts` (covered by Node native tests), add lightweight CSS keyframe/stagger motion primitives in `globals.css`, upgrade the shared admin shell (`AdminLayout`, `AdminSidebar`, `AdminPageHeader`), create reusable KPI/chart/pipeline components under `frontend/src/components/admin/`, decompose `/admin/page.tsx`, and unify all 4 admin sub-pages to the same surface, badge, and animation system.

**Tech Stack:** Next.js 16.3.6 (App Router), React 19, TypeScript 5 (strict, zero `any`), Tailwind CSS v4, Recharts 3.10.1, Lucide React, Node 24 `node:test`.

---

## File Structure

- **Create:** `frontend/src/lib/admin-metrics.ts` — pure booking/inventory/pit metric helpers & shared admin types
- **Create:** `frontend/src/lib/admin-metrics.test.mjs` — Node native test suite for pure helpers
- **Modify:** `frontend/src/app/globals.css` — add `.admin-sheet-enter`, `.admin-stagger-item`, `.admin-card-interactive`, `.admin-ring-animate`, and reduced-motion rules
- **Modify:** `frontend/src/components/admin/AdminSidebar.tsx` — Crimson gradient sidebar with quick menu search filter, active white translucent pill, DB sync badge, profile & logout
- **Modify:** `frontend/src/app/admin/layout.tsx` — Crimson outer shell framing a floating rounded light/dark workspace sheet
- **Modify:** `frontend/src/components/admin/AdminPageHeader.tsx` — clean workspace top header bar with built-in theme toggle and high-contrast actions slot
- **Create:** `frontend/src/components/admin/StatSparklineCard.tsx` — KPI card with Recharts mini sparkline
- **Create:** `frontend/src/components/admin/ProgressRing.tsx` — animated SVG circular progress ring
- **Create:** `frontend/src/components/admin/PipelineStageStrip.tsx` — 4-card stage summary row with colored top accent strips
- **Create:** `frontend/src/components/admin/dashboard/BookingTrendChart.tsx` — Recharts multi-series `AreaChart` (`SERVIS` vs `SPAREPART`) with `7H` / `14H` / `30H` switcher
- **Create:** `frontend/src/components/admin/dashboard/BookingStatusChart.tsx` — Recharts `PieChart` donut with completion % center metric and legend
- **Create:** `frontend/src/components/admin/dashboard/PitOperationsCard.tsx` — 4 Pit operational status card (`P1`–`P4`)
- **Create:** `frontend/src/components/admin/dashboard/BookingCalendarCard.tsx` — interactive mini calendar + selected-day schedule list
- **Create:** `frontend/src/components/admin/dashboard/RecentBookingsCard.tsx` — recent queue tickets with WhatsApp & one-click confirm
- **Modify:** `frontend/src/app/admin/page.tsx` — composed modular Executive Dashboard
- **Modify:** `frontend/src/app/admin/bookings/page.tsx` — unified sheet styling, `PipelineStageStrip` + `ProgressRing`, zero `any`
- **Modify:** `frontend/src/app/admin/spare-parts/page.tsx` — fixed header button contrast, 3-card stock readiness strip (`ProgressRing`), unified toolbar/table styling
- **Modify:** `frontend/src/app/admin/stock-logs/page.tsx` — 3-stat mutation summary strip, unified table surface & staggered rows
- **Modify:** `frontend/src/app/admin/import/page.tsx` — 3-step visual progress bar, unified sheet surface & staggered history rows

---

### Task 1: Pure Admin Analytics & Pit Helpers (`admin-metrics.ts`) with TDD

**Files:**
- Create: `frontend/src/lib/admin-metrics.ts`
- Create: `frontend/src/lib/admin-metrics.test.mjs`

- [ ] **Step 1: Write the failing test file**

Create `frontend/src/lib/admin-metrics.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyBookingSeries,
  buildBookingStatusDistribution,
  buildWeeklyVolume,
  mapBookingsToPits,
  computeStockHealth,
} from "./admin-metrics.ts";

const sampleBookings = [
  {
    id: "1",
    ticket_no: "SRV-001",
    nama_customer: "Budi",
    plat_kendaraan: "E 1234 XY",
    tanggal_booking: "2026-11-14",
    jam_booking: "09:00",
    jenis_servis: "Servis Berkala",
    tipe_booking: "SERVIS",
    status: "DONE",
  },
  {
    id: "2",
    ticket_no: "PRT-002",
    nama_customer: "Sari",
    plat_kendaraan: "-",
    tanggal_booking: "2026-11-14",
    jam_booking: "10:00",
    jenis_servis: "Ganti Oli MPX2",
    tipe_booking: "SPAREPART",
    status: "PENDING",
  },
  {
    id: "3",
    ticket_no: "SRV-003",
    nama_customer: "Andi",
    plat_kendaraan: "E 9999 AA",
    tanggal_booking: "2026-11-13",
    jam_booking: "11:00",
    jenis_servis: "Bongkar CVT",
    tipe_booking: "SERVIS",
    status: "IN_PROGRESS",
  },
  {
    id: "4",
    ticket_no: "SRV-004",
    nama_customer: "Dina",
    plat_kendaraan: "E 4567 BB",
    tanggal_booking: "2026-11-12",
    jam_booking: "13:00",
    jenis_servis: "Tune-Up Injeksi",
    tipe_booking: "SERVIS",
    status: "CONFIRMED",
  },
];

test("buildDailyBookingSeries aggregates SERVIS vs SPAREPART across N days", () => {
  const ref = new Date(2026, 10, 14);
  const series = buildDailyBookingSeries(sampleBookings, 3, ref);

  assert.equal(series.length, 3);
  assert.deepEqual(series[0].dateKey, "2026-11-12");
  assert.equal(series[0].servis, 1);
  assert.equal(series[0].sparepart, 0);

  assert.deepEqual(series[2].dateKey, "2026-11-14");
  assert.equal(series[2].total, 2);
  assert.equal(series[2].servis, 1);
  assert.equal(series[2].sparepart, 1);
  assert.equal(series[2].done, 1);
  assert.equal(series[2].active, 1);
});

test("buildBookingStatusDistribution computes counts and completionRate safely", () => {
  const empty = buildBookingStatusDistribution([]);
  assert.equal(empty.completionRate, 0);
  assert.equal(empty.total, 0);

  const dist = buildBookingStatusDistribution(sampleBookings);
  assert.equal(dist.total, 4);
  assert.equal(dist.counts.DONE, 1);
  assert.equal(dist.counts.PENDING, 1);
  assert.equal(dist.counts.CONFIRMED, 1);
  assert.equal(dist.counts.IN_PROGRESS, 1);
  assert.equal(dist.counts.CANCELLED, 0);
  assert.equal(dist.completionRate, 25);
  assert.equal(dist.slices.length, 5);
});

test("buildWeeklyVolume maps Monday-Sunday and marks selectedDate", () => {
  const ref = new Date(2026, 10, 14); // Saturday 2026-11-14
  const week = buildWeeklyVolume(sampleBookings, ref, "2026-11-14", ref);

  assert.equal(week.days.length, 7);
  assert.equal(week.days[0].label, "Sen");
  assert.equal(week.days[5].dateStr, "2026-11-14");
  assert.equal(week.days[5].isSelected, true);
  assert.equal(week.days[5].count, 2);
  assert.equal(week.total, 4);
  assert.equal(week.maxCount, 2);
});

test("mapBookingsToPits assigns distinct bookings to P1-P4", () => {
  const pits = mapBookingsToPits(sampleBookings);

  assert.equal(pits.length, 4);
  assert.equal(pits[0].code, "P1");
  assert.equal(pits[0].booking?.id, "2");
  assert.equal(pits[1].code, "P2");
  assert.equal(pits[1].booking?.id, "4");
  assert.equal(pits[2].code, "P3");
  assert.equal(pits[2].booking?.id, "3");
  assert.equal(pits[3].code, "P4");
  assert.equal(pits[3].booking?.id, "1");
});

test("computeStockHealth avoids negative values and division by zero", () => {
  assert.deepEqual(
    computeStockHealth({ totalActive: 0, outOfStock: 0, totalDiscontinue: 5 }),
    { readyCount: 0, readyPct: 0, emptyCount: 0, discontinueCount: 5 }
  );

  assert.deepEqual(
    computeStockHealth({ totalActive: 100, outOfStock: 25, totalDiscontinue: 10 }),
    { readyCount: 75, readyPct: 75, emptyCount: 25, discontinueCount: 10 }
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend/src/lib/admin-metrics.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `./admin-metrics.ts`.

- [ ] **Step 3: Implement `frontend/src/lib/admin-metrics.ts`**

Create `frontend/src/lib/admin-metrics.ts` using strictly erasable TypeScript syntax (compatible with Node 24 native type-stripping and Next.js strict TypeScript):

```typescript
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type BookingType = "SERVIS" | "SPAREPART";

export interface BookingSummary {
  id: string;
  ticket_no: string;
  nama_customer: string;
  no_hp?: string;
  no_telepon?: string;
  plat_kendaraan: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  tipe_motor?: string;
  tipe_booking?: BookingType;
  status: BookingStatus;
}

export interface SparePartSummary {
  totalActive: number;
  outOfStock: number;
  totalDiscontinue: number;
}

export interface DailyBookingPoint {
  dateKey: string;
  label: string;
  total: number;
  servis: number;
  sparepart: number;
  done: number;
  active: number;
}

export interface StatusSlice {
  key: BookingStatus;
  label: string;
  value: number;
  color: string;
}

export interface StatusDistribution {
  total: number;
  completionRate: number;
  counts: Record<BookingStatus, number>;
  slices: StatusSlice[];
}

export interface WeeklyDayPoint {
  label: string;
  dateNum: number;
  fullDate: Date;
  dateStr: string;
  count: number;
  isSelected: boolean;
  isToday: boolean;
}

export interface WeeklyVolume {
  days: WeeklyDayPoint[];
  total: number;
  maxCount: number;
}

export interface PitStatusBadge {
  label: string;
  tone: "emerald" | "blue" | "amber";
}

export interface PitSlot {
  code: "P1" | "P2" | "P3" | "P4";
  name: string;
  desc: string;
  booking: BookingSummary | undefined;
  status: PitStatusBadge;
}

export interface StockHealth {
  readyCount: number;
  readyPct: number;
  emptyCount: number;
  discontinueCount: number;
}

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSparePartBooking(booking: BookingSummary): boolean {
  return (
    booking.tipe_booking === "SPAREPART" ||
    Boolean(booking.ticket_no?.startsWith("PRT"))
  );
}

export function buildDailyBookingSeries(
  bookings: BookingSummary[],
  days: number,
  referenceDate: Date = new Date()
): DailyBookingPoint[] {
  const safeDays = Math.max(1, days);
  const byDate = new Map<string, BookingSummary[]>();

  for (const b of bookings) {
    if (!b.tanggal_booking) continue;
    const key = b.tanggal_booking.slice(0, 10);
    const list = byDate.get(key) ?? [];
    list.push(b);
    byDate.set(key, list);
  }

  const points: DailyBookingPoint[] = [];
  for (let offset = safeDays - 1; offset >= 0; offset--) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - offset
    );
    const dateKey = formatLocalDateKey(d);
    const label = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const list = byDate.get(dateKey) ?? [];

    let servis = 0;
    let sparepart = 0;
    let done = 0;
    let active = 0;

    for (const item of list) {
      if (isSparePartBooking(item)) {
        sparepart += 1;
      } else {
        servis += 1;
      }
      if (item.status === "DONE") {
        done += 1;
      } else if (
        item.status === "PENDING" ||
        item.status === "CONFIRMED" ||
        item.status === "IN_PROGRESS"
      ) {
        active += 1;
      }
    }

    points.push({
      dateKey,
      label,
      total: list.length,
      servis,
      sparepart,
      done,
      active,
    });
  }

  return points;
}

export function buildBookingStatusDistribution(
  bookings: BookingSummary[]
): StatusDistribution {
  const counts: Record<BookingStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELLED: 0,
  };

  for (const b of bookings) {
    if (b.status in counts) {
      counts[b.status] += 1;
    }
  }

  const total = bookings.length;
  const completionRate = total > 0 ? Math.round((counts.DONE / total) * 100) : 0;

  const slices: StatusSlice[] = [
    { key: "DONE", label: "Selesai", value: counts.DONE, color: "#10B981" },
    {
      key: "IN_PROGRESS",
      label: "Dikerjakan",
      value: counts.IN_PROGRESS,
      color: "#3B82F6",
    },
    {
      key: "CONFIRMED",
      label: "Terjadwal",
      value: counts.CONFIRMED,
      color: "#8B5CF6",
    },
    {
      key: "PENDING",
      label: "Menunggu",
      value: counts.PENDING,
      color: "#F59E0B",
    },
    {
      key: "CANCELLED",
      label: "Dibatalkan",
      value: counts.CANCELLED,
      color: "#94A3B8",
    },
  ];

  return { total, completionRate, counts, slices };
}

export function buildWeeklyVolume(
  bookings: BookingSummary[],
  referenceDate: Date,
  selectedDateStr: string,
  today: Date = new Date()
): WeeklyVolume {
  const dayOfWeek = (referenceDate.getDay() + 6) % 7;
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - dayOfWeek
  );

  const weekLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const countMap = new Map<string, number>();

  for (const b of bookings) {
    if (!b.tanggal_booking) continue;
    const k = b.tanggal_booking.slice(0, 10);
    countMap.set(k, (countMap.get(k) ?? 0) + 1);
  }

  const days: WeeklyDayPoint[] = weekLabels.map((label, idx) => {
    const fullDate = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + idx
    );
    const dateStr = formatLocalDateKey(fullDate);
    const count = countMap.get(dateStr) ?? 0;
    const isToday =
      fullDate.getDate() === today.getDate() &&
      fullDate.getMonth() === today.getMonth() &&
      fullDate.getFullYear() === today.getFullYear();

    return {
      label,
      dateNum: fullDate.getDate(),
      fullDate,
      dateStr,
      count,
      isSelected: dateStr === selectedDateStr,
      isToday,
    };
  });

  const total = days.reduce((acc, d) => acc + d.count, 0);
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return { days, total, maxCount };
}

function resolvePitBadge(booking?: BookingSummary): PitStatusBadge {
  if (!booking) return { label: "Tersedia", tone: "emerald" };
  if (booking.status === "DONE") return { label: "Selesai", tone: "emerald" };
  if (booking.status === "IN_PROGRESS")
    return { label: "Sedang Servis", tone: "blue" };
  return { label: "Terjadwal", tone: "amber" };
}

export function mapBookingsToPits(activePool: BookingSummary[]): PitSlot[] {
  const pit1 = activePool.find((b) => {
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      isSparePartBooking(b) || svc.includes("oli") || svc.includes("ringan")
    );
  });

  const pit2 = activePool.find((b) => {
    if (b.id === pit1?.id) return false;
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      svc.includes("berkala") ||
      svc.includes("tune-up") ||
      svc.includes("paket") ||
      b.tipe_booking === "SERVIS"
    );
  });

  const pit3 = activePool.find((b) => {
    if (b.id === pit1?.id || b.id === pit2?.id) return false;
    const svc = b.jenis_servis?.toLowerCase() ?? "";
    return (
      svc.includes("cvt") ||
      svc.includes("mesin") ||
      svc.includes("bongkar") ||
      svc.includes("berat")
    );
  });

  const pit4 = activePool.find(
    (b) =>
      b.id !== pit1?.id &&
      b.id !== pit2?.id &&
      b.id !== pit3?.id &&
      b.status === "DONE"
  );

  const formatDesc = (b: BookingSummary | undefined, fallback: string) =>
    b
      ? `${b.nama_customer} · ${b.plat_kendaraan || b.tipe_motor || "Motor"} (${b.jam_booking} WIB)`
      : fallback;

  return [
    {
      code: "P1",
      name: "Pit 1 - Fast Pit Express",
      desc: formatDesc(pit1, "Ganti Oli, Busi & Part Ringan (Tanpa Antre)"),
      booking: pit1,
      status: resolvePitBadge(pit1),
    },
    {
      code: "P2",
      name: "Pit 2 - Servis Berkala & Tune-Up",
      desc: formatDesc(pit2, "Kalibrasi Injeksi Honda HIDS & Pembersihan"),
      booking: pit2,
      status: resolvePitBadge(pit2),
    },
    {
      code: "P3",
      name: "Pit 3 - Heavy Repair & Keluhan",
      desc: formatDesc(pit3, "Penanganan Suara CVT, Mesin & Kelistrikan"),
      booking: pit3,
      status: resolvePitBadge(pit3),
    },
    {
      code: "P4",
      name: "Pit 4 - Final Inspection & Cuci",
      desc: pit4
        ? `${pit4.nama_customer} · ${pit4.plat_kendaraan || pit4.tipe_motor || "Motor"} (Siap Serah Terima)`
        : "Uji Jalan & Pemeriksaan Standar Keselamatan",
      booking: pit4,
      status: pit4
        ? { label: "Siap Ambil", tone: "emerald" }
        : { label: "Tersedia", tone: "emerald" },
    },
  ];
}

export function computeStockHealth(summary: SparePartSummary): StockHealth {
  const totalActive = Math.max(0, summary.totalActive);
  const emptyCount = Math.max(0, summary.outOfStock);
  const readyCount = Math.max(0, totalActive - emptyCount);
  const readyPct = totalActive > 0 ? Math.round((readyCount / totalActive) * 100) : 0;

  return {
    readyCount,
    readyPct,
    emptyCount,
    discontinueCount: Math.max(0, summary.totalDiscontinue),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend/src/lib/admin-metrics.test.mjs`
Expected: PASS — 5 tests passing, 0 failed.

- [ ] **Step 5: Verify strict TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 6: Commit**

```bash
rtk git add frontend/src/lib/admin-metrics.ts frontend/src/lib/admin-metrics.test.mjs
rtk git commit -m "feat(admin): add pure booking and stock metrics helpers with unit tests"
```

---

### Task 2: Motion CSS Keyframes & Reduced Motion (`globals.css`)

**Files:**
- Modify: `frontend/src/app/globals.css:110-135`

- [ ] **Step 1: Add admin motion animations to `frontend/src/app/globals.css`**

Append the following animation keyframes and utility classes at the end of `frontend/src/app/globals.css` (after line 135, preserving all existing `fermion-*` rules):

```css
/* ── ADMIN WORKSPACE MOTION PRIMITIVES ── */
@keyframes adminSheetEnter {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.994);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes adminFadeUp {
  0% {
    opacity: 0;
    transform: translateY(14px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-sheet-enter {
  animation: adminSheetEnter 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.admin-stagger-item {
  animation: adminFadeUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--stagger-index, 0) * 55ms);
}

.admin-card-interactive {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.admin-card-interactive:hover {
  transform: translateY(-3px);
}

.admin-card-interactive:active {
  transform: translateY(0);
}

.admin-ring-animate {
  transition: stroke-dashoffset 750ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .admin-sheet-enter,
  .admin-stagger-item {
    animation: none !important;
  }
  .admin-card-interactive,
  .admin-ring-animate {
    transition: none !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Run lint & tsc check**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 3: Commit**

```bash
rtk git add frontend/src/app/globals.css
rtk git commit -m "style(admin): add workspace sheet, stagger, and card motion utilities"
```

---

### Task 3: Crimson Workspace Shell & Searchable Sidebar

**Files:**
- Modify: `frontend/src/components/admin/AdminSidebar.tsx:1-316`
- Modify: `frontend/src/app/admin/layout.tsx:1-83`

- [ ] **Step 1: Update `frontend/src/components/admin/AdminSidebar.tsx`**

Replace `frontend/src/components/admin/AdminSidebar.tsx` with the Honda Crimson V28 sidebar (preserving all props, `localStorage` collapse state, RBAC Portal CRM item, and logout):

```tsx
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
  const visibleNavItems = normalizedQuery
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
          bg-gradient-to-b from-[#E4002B] via-[#C80021] to-[#A3001B] text-white
          border-r border-white/15 md:border-none shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[72px] w-[252px]" : "w-[248px]"}
          md:py-3 md:px-2.5 p-3.5 justify-between select-none
        `}
      >
        <div className="space-y-3.5">
          {/* Brand Row */}
          <div className="flex items-center justify-between px-1 pb-2.5 border-b border-white/15">
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
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white">
                      10870
                    </span>
                  </div>
                  <span className="text-[10px] text-white/75 font-medium truncate">
                    AHASS Kuningan
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCollapsed}
              className={`hidden md:flex p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition shrink-0 cursor-pointer ${
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
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition md:hidden"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Menu Filter */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Cari menu..."
                aria-label="Cari menu admin"
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-white/15 border border-white/20 text-xs font-medium text-white placeholder:text-white/70 focus:outline-none focus:bg-white/20 focus:border-white/35 transition"
              />
              {menuQuery && (
                <button
                  type="button"
                  onClick={() => setMenuQuery("")}
                  aria-label="Hapus pencarian menu"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Role Status Pill */}
          {!isCollapsed && (
            <div className="bg-black/15 border border-white/15 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="truncate text-[11px] font-bold text-white">
                  {displayRole}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Online
              </span>
            </div>
          )}

          {/* Navigation List */}
          <nav className="space-y-1 pt-0.5">
            {visibleNavItems.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-white/70">
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
                          ? "bg-white/22 text-white border border-white/25 shadow-sm backdrop-blur-xs font-bold"
                          : "text-white/80 hover:text-white hover:bg-white/12 border border-transparent"
                      }
                      ${isCollapsed ? "justify-center px-2 py-2.5" : ""}
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? "text-white scale-105"
                          : "text-white/80 group-hover:text-white group-hover:scale-105"
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {isActive && !isCollapsed && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/85" />
                    )}

                    {isCollapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-2.5 pt-3 border-t border-white/15">
          {!isCollapsed ? (
            <div className="bg-black/15 border border-white/15 rounded-xl p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="flex items-center gap-1.5 text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  DATABASE SYNC
                </span>
                <span className="text-white/90 text-[9px] bg-white/15 px-1.5 py-0.5 rounded font-sans">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] font-bold text-white truncate">
                Supabase PostgreSQL
              </div>
              <div className="text-[10px] text-white/70 font-medium">
                44.000+ SKU Tersinkron
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-black/15 border border-white/15 flex items-center justify-center text-emerald-200"
              title="Database Sync: Active"
            >
              <Database className="w-4 h-4" />
            </div>
          )}

          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 pt-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white text-[#E4002B] flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-bold text-white truncate">
                    {userName || "Admin AHASS"}
                  </div>
                  <div className="text-[10px] text-white/70 truncate">
                    {displayRole}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition shrink-0 cursor-pointer"
                title="Keluar Akun"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-0.5">
              <div
                className="w-8 h-8 rounded-xl bg-white text-[#E4002B] flex items-center justify-center text-xs font-black shadow-xs"
                title={userName || "Admin AHASS"}
              >
                {userInitial}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
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
```

- [ ] **Step 2: Update `frontend/src/app/admin/layout.tsx`**

Wrap `<main>` in the floating rounded workspace sheet inside the Crimson outer shell:

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "sonner";
import { Menu, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Client-side role guard: redirect CRM users to /crm
  useEffect(() => {
    if (!isLoading && user && user.role === "CRM" && !isLoginPage) {
      router.replace("/crm");
    }
  }, [isLoading, user, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <>
        <Toaster position="bottom-right" />
        {children}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-[#F8FAFC] dark:bg-[#0B111A] flex flex-col items-center justify-center gap-3 text-slate-500 text-sm font-medium">
        <Loader2 className="w-6 h-6 animate-spin text-[#E4002B]" />
        <span>Memverifikasi sesi petugas...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#E4002B] via-[#C80021] to-[#A3001B] font-sans text-slate-900 dark:text-slate-100 h-screen flex flex-col md:flex-row overflow-hidden md:p-2.5 md:gap-2">
      {/* Mobile Topbar */}
      <header className="md:hidden h-14 bg-[#E4002B] border-b border-white/15 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 -ml-1 text-white/85 hover:text-white rounded-lg hover:bg-white/15 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative h-6 w-24">
            <Image
              src="/logo.png"
              alt="AS Putra Motor"
              fill
              className="object-contain object-left brightness-0 invert"
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-white bg-white/15 border border-white/20 px-2 py-0.5 rounded-md tracking-wider">
          AHASS 10870
        </span>
      </header>

      <AdminSidebar
        userRole={user?.role}
        userName={user?.nama || user?.email}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] dark:bg-[#0B111A] md:rounded-[26px] md:shadow-2xl border border-black/5 dark:border-slate-800/80 transition-colors admin-sheet-enter">
        <Toaster position="bottom-right" />
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/components/admin/AdminSidebar.tsx frontend/src/app/admin/layout.tsx
rtk git commit -m "feat(admin): implement crimson sidebar shell with floating workspace sheet"
```

---

### Task 4: Clean Workspace Header & Reusable Data Primitives

**Files:**
- Modify: `frontend/src/components/admin/AdminPageHeader.tsx:1-113`
- Create: `frontend/src/components/admin/StatSparklineCard.tsx`
- Create: `frontend/src/components/admin/ProgressRing.tsx`
- Create: `frontend/src/components/admin/PipelineStageStrip.tsx`

- [ ] **Step 1: Update `frontend/src/components/admin/AdminPageHeader.tsx`**

Replace with the clean workspace header (including built-in Light/Dark toggle and crisp typography):

```tsx
"use client";

import { type LucideIcon, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  showThemeToggle?: boolean;
}

/**
 * Shared admin workspace header bar rendered at the top of the floating sheet.
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

        <div className="flex items-center gap-2.5 flex-wrap">
          {actions}

          {showThemeToggle && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white dark:bg-slate-700 shadow-2xs text-amber-500"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                title="Mode Terang"
                aria-label="Mode Terang"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  theme === "dark"
                    ? "bg-white dark:bg-slate-700 shadow-2xs text-indigo-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
```

- [ ] **Step 2: Create `frontend/src/components/admin/StatSparklineCard.tsx`**

```tsx
"use client";

import { useId, type CSSProperties } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export interface SparklinePoint {
  label: string;
  value: number;
}

interface StatSparklineCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeText: string;
  badgeTone?: "crimson" | "emerald" | "amber" | "blue" | "slate";
  accentColor?: string;
  icon: LucideIcon;
  sparklineData: SparklinePoint[];
  href?: string;
  onClick?: () => void;
  staggerIndex?: number;
}

const BADGE_CLASSES: Record<
  NonNullable<StatSparklineCardProps["badgeTone"]>,
  string
> = {
  crimson:
    "bg-red-50 text-[#E4002B] border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
  slate:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export default function StatSparklineCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeTone = "crimson",
  accentColor = "#E4002B",
  icon: Icon,
  sparklineData,
  href,
  onClick,
  staggerIndex = 0,
}: StatSparklineCardProps) {
  const gradientId = useId().replace(/:/g, "");
  const styleVars = {
    "--stagger-index": staggerIndex,
  } as CSSProperties;

  const content = (
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
            {title}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
              {value}
            </span>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="h-11 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={sparklineData}
            margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={750}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${BADGE_CLASSES[badgeTone]}`}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );

  const cardClass =
    "block w-full text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300/90 dark:hover:border-slate-700 admin-stagger-item admin-card-interactive";

  if (href) {
    return (
      <Link href={href} className={cardClass} style={styleVars}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClass} cursor-pointer`}
        style={styleVars}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cardClass} style={styleVars}>
      {content}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/admin/ProgressRing.tsx`**

```tsx
"use client";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export default function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  color = "#E4002B",
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="admin-ring-animate"
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-900 dark:text-white tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/admin/PipelineStageStrip.tsx`**

```tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";

export interface PipelineStageItem {
  key: string;
  label: string;
  count: number;
  subtitle: string;
  accentHex: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface PipelineStageStripProps {
  items: PipelineStageItem[];
  startStaggerIndex?: number;
}

export default function PipelineStageStrip({
  items,
  startStaggerIndex = 0,
}: PipelineStageStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, idx) => {
        const styleVars = {
          "--stagger-index": startStaggerIndex + idx,
        } as CSSProperties;

        const inner = (
          <>
            <span
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: item.accentHex }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.accentHex }}
              />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {item.count.toLocaleString("id-ID")}
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {item.subtitle}
            </div>
          </>
        );

        const baseClass = `relative overflow-hidden text-left bg-white dark:bg-[#111827] border rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive ${
          item.isActive
            ? "border-[#E4002B] ring-2 ring-[#E4002B]/15"
            : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        }`;

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`block ${baseClass}`}
              style={styleVars}
            >
              {inner}
            </Link>
          );
        }

        if (item.onClick) {
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`w-full cursor-pointer ${baseClass}`}
              style={styleVars}
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={item.key} className={baseClass} style={styleVars}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 6: Commit**

```bash
rtk git add frontend/src/components/admin/AdminPageHeader.tsx frontend/src/components/admin/StatSparklineCard.tsx frontend/src/components/admin/ProgressRing.tsx frontend/src/components/admin/PipelineStageStrip.tsx
rtk git commit -m "feat(admin): add workspace header and reusable sparkline, ring, pipeline primitives"
```

---

### Task 5: Dashboard Analytics & Operations Components

**Files:**
- Create: `frontend/src/components/admin/dashboard/BookingTrendChart.tsx`
- Create: `frontend/src/components/admin/dashboard/BookingStatusChart.tsx`
- Create: `frontend/src/components/admin/dashboard/PitOperationsCard.tsx`
- Create: `frontend/src/components/admin/dashboard/BookingCalendarCard.tsx`
- Create: `frontend/src/components/admin/dashboard/RecentBookingsCard.tsx`

- [ ] **Step 1: Create `BookingTrendChart.tsx`**

```tsx
"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  buildDailyBookingSeries,
  type BookingSummary,
} from "@/lib/admin-metrics";

interface BookingTrendChartProps {
  bookings: BookingSummary[];
  staggerIndex?: number;
}

type RangeDays = 7 | 14 | 30;

export default function BookingTrendChart({
  bookings,
  staggerIndex = 4,
}: BookingTrendChartProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);

  const chartData = useMemo(
    () => buildDailyBookingSeries(bookings, rangeDays),
    [bookings, rangeDays]
  );

  const totalRange = useMemo(
    () => chartData.reduce((acc, p) => acc + p.total, 0),
    [chartData]
  );

  const styleVars = { "--stagger-index": staggerIndex } as CSSProperties;

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Tren Reservasi Harian
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E4002B] border border-red-200/70 dark:border-red-900/50 tabular-nums">
              {totalRange} Tiket
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan booking servis motor vs pengambilan suku cadang
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                rangeDays === days
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {days}H
            </button>
          ))}
        </div>
      </div>

      <div className="h-[235px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="servisGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E4002B" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#E4002B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="partGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(15,23,42,0.1)",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="servis"
              name="Servis Motor"
              stroke="#E4002B"
              strokeWidth={2.2}
              fill="url(#servisGradient)"
              isAnimationActive={true}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="sparepart"
              name="Suku Cadang"
              stroke="#10B981"
              strokeWidth={2.2}
              fill="url(#partGradient)"
              isAnimationActive={true}
              animationDuration={850}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E4002B]" />
          Servis Motor (SRV)
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Suku Cadang (PRT)
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `BookingStatusChart.tsx`**

```tsx
"use client";

import type { CSSProperties } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusDistribution } from "@/lib/admin-metrics";

interface BookingStatusChartProps {
  distribution: StatusDistribution;
  staggerIndex?: number;
}

export default function BookingStatusChart({
  distribution,
  staggerIndex = 5,
}: BookingStatusChartProps) {
  const styleVars = { "--stagger-index": staggerIndex } as CSSProperties;
  const nonZeroSlices = distribution.slices.filter((s) => s.value > 0);
  const displaySlices =
    nonZeroSlices.length > 0
      ? nonZeroSlices
      : [{ key: "EMPTY", label: "Belum ada data", value: 1, color: "#E2E8F0" }];

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribusi Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rasio penyelesaian dari {distribution.total} tiket
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50">
          Live
        </span>
      </div>

      <div className="relative h-[165px] w-full min-w-0 my-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={displaySlices}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={nonZeroSlices.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive={true}
              animationDuration={800}
            >
              {displaySlices.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            {nonZeroSlices.length > 0 && (
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {distribution.completionRate}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Selesai
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {distribution.slices.map((slice) => (
          <div
            key={slice.key}
            className="flex items-center justify-between text-xs"
          >
            <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              {slice.label}
            </span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {slice.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `PitOperationsCard.tsx`**

```tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import type { PitSlot, PitStatusBadge } from "@/lib/admin-metrics";

interface PitOperationsCardProps {
  pits: PitSlot[];
  occupiedCount: number;
  subtitle: string;
  staggerIndex?: number;
}

const BADGE_CLASS: Record<PitStatusBadge["tone"], string> = {
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
};

export default function PitOperationsCard({
  pits,
  occupiedCount,
  subtitle,
  staggerIndex = 8,
}: PitOperationsCardProps) {
  const styleVars = { "--stagger-index": staggerIndex } as CSSProperties;

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Operasional 4 Pit Servis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
              occupiedCount > 0 ? BADGE_CLASS.blue : BADGE_CLASS.emerald
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                occupiedCount > 0
                  ? "bg-blue-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            {occupiedCount > 0 ? `${occupiedCount} Pit Terisi` : "Semua Siap"}
          </span>
        </div>

        <div className="space-y-2.5">
          {pits.map((pit) => (
            <Link
              key={pit.code}
              href="/admin/bookings"
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono flex items-center justify-center text-[#E4002B] shrink-0">
                  {pit.code}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {pit.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {pit.desc}
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${BADGE_CLASS[pit.status.tone]}`}
              >
                {pit.status.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          4 Teknisi Tersertifikasi AHM
        </span>
        <Link
          href="/admin/bookings"
          className="font-bold text-[#E4002B] hover:underline"
        >
          Atur Pit &rarr;
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `BookingCalendarCard.tsx`**

```tsx
"use client";

import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Wrench } from "lucide-react";
import type { BookingSummary } from "@/lib/admin-metrics";

interface BookingCalendarCardProps {
  calendarDate: Date;
  selectedDay: number;
  today: Date;
  daysWithBookings: Set<number>;
  selectedDayBookings: BookingSummary[];
  onChangeMonth: (nextDate: Date) => void;
  onSelectDay: (day: number) => void;
  staggerIndex?: number;
}

export default function BookingCalendarCard({
  calendarDate,
  selectedDay,
  today,
  daysWithBookings,
  selectedDayBookings,
  onChangeMonth,
  onSelectDay,
  staggerIndex = 9,
}: BookingCalendarCardProps) {
  const yearNum = calendarDate.getFullYear();
  const monthNum = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
  const firstDayIndex = new Date(yearNum, monthNum, 1).getDay();
  const styleVars = { "--stagger-index": staggerIndex } as CSSProperties;

  const isSelectedToday =
    selectedDay === today.getDate() &&
    monthNum === today.getMonth() &&
    yearNum === today.getFullYear();

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      {/* Mini Calendar */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => onChangeMonth(new Date(yearNum, monthNum - 1, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              {monthName}
            </span>
            <button
              type="button"
              onClick={() => onChangeMonth(new Date(yearNum, monthNum + 1, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-slate-400 mb-1.5">
            <span>M</span>
            <span>S</span>
            <span>S</span>
            <span>R</span>
            <span>K</span>
            <span>J</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const isToday =
                day === today.getDate() &&
                monthNum === today.getMonth() &&
                yearNum === today.getFullYear();
              const hasBooking = daysWithBookings.has(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`relative h-7 w-7 rounded-full text-xs font-semibold mx-auto flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E4002B] text-white font-black shadow-sm"
                      : isToday
                      ? "border border-[#E4002B] text-[#E4002B] font-bold hover:bg-red-50 dark:hover:bg-red-950/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{day}</span>
                  {hasBooking && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#E4002B] absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tanggal dipilih:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {selectedDay} {monthName}
          </span>
        </div>
      </div>

      {/* Selected Day Schedule */}
      <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 sm:pl-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Jadwal Servis
          </h3>
          <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {isSelectedToday
              ? "Hari Ini"
              : `${selectedDay} ${calendarDate.toLocaleDateString("id-ID", { month: "short" })}`}
          </span>
        </div>

        {selectedDayBookings.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
            {selectedDayBookings.map((b) => (
              <div
                key={b.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#E4002B] border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {b.nama_customer}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {b.tipe_motor || "Honda"} · {b.plat_kendaraan}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                  {b.jam_booking}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
            <CalendarDays className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
            <div>Tidak ada jadwal servis</div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {selectedDay} {monthName}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `RecentBookingsCard.tsx`**

```tsx
"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Clock,
  MessageSquare,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { BookingSummary } from "@/lib/admin-metrics";

interface RecentBookingsCardProps {
  bookings: BookingSummary[];
  totalCount: number;
  updatingId: string | null;
  onQuickConfirm: (id: string) => void;
  getWhatsAppLink: (item: BookingSummary) => string;
  staggerIndex?: number;
}

export default function RecentBookingsCard({
  bookings,
  totalCount,
  updatingId,
  onQuickConfirm,
  getWhatsAppLink,
  staggerIndex = 10,
}: RecentBookingsCardProps) {
  const styleVars = { "--stagger-index": staggerIndex } as CSSProperties;

  return (
    <section
      style={styleVars}
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            Antrean &amp; Transaksi Servis Terbaru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tiket reservasi pit servis dan pengambilan suku cadang masuk
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
        >
          <span>Buka Semua ({totalCount})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {bookings.length > 0 ? (
          bookings.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {b.nama_customer}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${
                      b.ticket_no?.startsWith("PRT")
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                        : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50"
                    }`}
                  >
                    {b.ticket_no?.startsWith("PRT") ? "PART" : "PIT SERVIS"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {b.plat_kendaraan}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {b.jam_booking || "--:--"} WIB
                  </span>
                  <span>•</span>
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {b.jenis_servis}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {(b.no_hp || b.no_telepon) && (
                  <a
                    href={getWhatsAppLink(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat WhatsApp Pelanggan"
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                )}

                {b.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={updatingId === b.id}
                    onClick={() => onQuickConfirm(b.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#B8001F] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    {updatingId === b.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>Konfirmasi</span>
                  </button>
                )}

                {b.status === "DONE" ? (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                    Selesai
                  </span>
                ) : b.status === "IN_PROGRESS" ? (
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
                    Dikerjakan
                  </span>
                ) : b.status === "CONFIRMED" ? (
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-900/50">
                    Terjadwal
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada antrean masuk hari ini
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 7: Commit**

```bash
rtk git add frontend/src/components/admin/dashboard/
rtk git commit -m "feat(admin): add modular dashboard analytics, pit, calendar, and queue cards"
```

---

### Task 6: Executive Dashboard Page Refactor (`/admin`)

**Files:**
- Modify: `frontend/src/app/admin/page.tsx:1-1005`

- [ ] **Step 1: Replace `frontend/src/app/admin/page.tsx` with clean composed dashboard**

```tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  PackageCheck,
  Clock,
  Plus,
  RefreshCw,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatSparklineCard from "@/components/admin/StatSparklineCard";
import PipelineStageStrip, {
  type PipelineStageItem,
} from "@/components/admin/PipelineStageStrip";
import BookingTrendChart from "@/components/admin/dashboard/BookingTrendChart";
import BookingStatusChart from "@/components/admin/dashboard/BookingStatusChart";
import PitOperationsCard from "@/components/admin/dashboard/PitOperationsCard";
import BookingCalendarCard from "@/components/admin/dashboard/BookingCalendarCard";
import RecentBookingsCard from "@/components/admin/dashboard/RecentBookingsCard";
import {
  buildDailyBookingSeries,
  buildBookingStatusDistribution,
  mapBookingsToPits,
  computeStockHealth,
  type BookingSummary,
  type SparePartSummary,
} from "@/lib/admin-metrics";

export default function AdminDashboardPage() {
  const { token, user, authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<SparePartSummary>({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });
  const [bookingTotal, setBookingTotal] = useState<number>(0);
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null
  );

  const today = useMemo(() => new Date(), []);
  const [calendarDate, setCalendarDate] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const getWhatsAppLink = (item: BookingSummary) => {
    let cleanPhone = (item.no_hp || item.no_telepon || "").replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    const isPart = item.ticket_no?.startsWith("PRT");
    const label = isPart ? "Suku Cadang" : "Servis Motor";
    const message = `Halo Kak *${item.nama_customer}*,\n\nReservasi *${label}* Anda di *AHASS AS Putra Rahmat Kuningan*:\n• *Kode Booking:* ${item.ticket_no}\n• *Jadwal:* ${item.tanggal_booking} (Jam ${item.jam_booking} WIB)\n• *Plat:* ${item.plat_kendaraan || "-"}\n• *Layanan:* ${item.jenis_servis}\n• *Status:* *DIKONFIRMASI*\n\nSilakan datang tepat waktu ke bengkel kami ya Kak. Terima kasih! 🙏`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleQuickConfirm = async (id: string) => {
    if (!token) return;
    setUpdatingBookingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Booking berhasil dikonfirmasi!");
        setAllBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CONFIRMED" } : b))
        );
      } else {
        toast.error(data.message || "Gagal mengonfirmasi booking");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resSummary, resBookings] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/summary`, { cache: "no-store" }),
        authFetch(`${API_BASE_URL}/admin/bookings?limit=100`, {
          cache: "no-store",
        }),
      ]);

      const dataSummary = await resSummary.json();
      if (resSummary.ok && dataSummary.success) {
        setSummary(dataSummary.data);
      }

      const dataBookings = await resBookings.json();
      if (resBookings.ok && dataBookings.success) {
        const list: BookingSummary[] = dataBookings.data.bookings || [];
        setAllBookings(list);
        setBookingTotal(dataBookings.data.total || list.length);
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching data:", err);
      toast.error("Gagal memuat ringkasan dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const daily7 = useMemo(
    () => buildDailyBookingSeries(allBookings, 7, today),
    [allBookings, today]
  );

  const statusDist = useMemo(
    () => buildBookingStatusDistribution(allBookings),
    [allBookings]
  );

  const stockHealth = useMemo(() => computeStockHealth(summary), [summary]);

  const yearNum = calendarDate.getFullYear();
  const monthNum = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const monthPrefix = `${yearNum}-${String(monthNum + 1).padStart(2, "0")}`;
  const selectedDateStr = `${monthPrefix}-${String(selectedDay).padStart(2, "0")}`;

  const daysWithBookings = useMemo(() => {
    const monthBookings = allBookings.filter((b) =>
      b.tanggal_booking?.startsWith(monthPrefix)
    );
    return new Set(
      monthBookings
        .map((b) => parseInt(b.tanggal_booking.split("-")[2], 10))
        .filter((n) => !Number.isNaN(n))
    );
  }, [allBookings, monthPrefix]);

  const selectedDayBookings = useMemo(
    () => allBookings.filter((b) => b.tanggal_booking === selectedDateStr),
    [allBookings, selectedDateStr]
  );

  const activePool =
    selectedDayBookings.length > 0
      ? selectedDayBookings
      : allBookings.slice(0, 4);
  const pitList = useMemo(() => mapBookingsToPits(activePool), [activePool]);
  const occupiedPits = pitList.filter((p) => p.booking).length;

  const activeQueueCount =
    statusDist.counts.PENDING +
    statusDist.counts.CONFIRMED +
    statusDist.counts.IN_PROGRESS;

  const pipelineItems: PipelineStageItem[] = [
    {
      key: "PENDING",
      label: "Menunggu Konfirmasi",
      count: statusDist.counts.PENDING,
      subtitle: "Butuh verifikasi admin",
      accentHex: "#F59E0B",
      href: "/admin/bookings?status=PENDING",
    },
    {
      key: "CONFIRMED",
      label: "Terkonfirmasi",
      count: statusDist.counts.CONFIRMED,
      subtitle: "Jadwal pit terkunci",
      accentHex: "#8B5CF6",
      href: "/admin/bookings?status=CONFIRMED",
    },
    {
      key: "IN_PROGRESS",
      label: "Sedang Dikerjakan",
      count: statusDist.counts.IN_PROGRESS,
      subtitle: "Dalam penanganan pit",
      accentHex: "#3B82F6",
      href: "/admin/bookings?status=IN_PROGRESS",
    },
    {
      key: "DONE",
      label: "Servis Selesai",
      count: statusDist.counts.DONE,
      subtitle: "Siap serah terima",
      accentHex: "#10B981",
      href: "/admin/bookings?status=DONE",
    },
  ];

  const displayName = user?.nama || "Admin Operasional";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-[#E4002B]" />
          <span className="text-xs font-semibold text-slate-500">
            Memuat Ringkasan Operasional...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title={`Halo, ${displayName}`}
        subtitle="Ringkasan reservasi pit AHASS 10870 & ketersediaan suku cadang AHM"
        breadcrumb="Dashboard"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/spare-parts?action=create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#E4002B]" />
              <span className="hidden sm:inline">Tambah Part</span>
            </Link>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white text-xs font-bold shadow-xs transition"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Antrean Pit</span>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Row 1: 4 KPI Sparkline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatSparklineCard
              title="Total Booking"
              value={bookingTotal.toLocaleString("id-ID")}
              subtitle={`${allBookings.length} tiket termuat`}
              badgeText="7 Hari"
              badgeTone="crimson"
              accentColor="#E4002B"
              icon={CalendarCheck}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.total,
              }))}
              href="/admin/bookings"
              staggerIndex={0}
            />
            <StatSparklineCard
              title="Tingkat Penyelesaian"
              value={`${statusDist.completionRate}%`}
              subtitle={`${statusDist.counts.DONE} servis selesai`}
              badgeText="Selesai"
              badgeTone="emerald"
              accentColor="#10B981"
              icon={CheckCircle2}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.done,
              }))}
              href="/admin/bookings?status=DONE"
              staggerIndex={1}
            />
            <StatSparklineCard
              title="Antrean Aktif"
              value={activeQueueCount.toLocaleString("id-ID")}
              subtitle={`${statusDist.counts.PENDING} menunggu verifikasi`}
              badgeText="Berjalan"
              badgeTone="amber"
              accentColor="#F59E0B"
              icon={Clock}
              sparklineData={daily7.map((d) => ({
                label: d.label,
                value: d.active,
              }))}
              href="/admin/bookings?status=PENDING"
              staggerIndex={2}
            />
            <StatSparklineCard
              title="Suku Cadang Siap Jual"
              value={stockHealth.readyCount.toLocaleString("id-ID")}
              subtitle={`${stockHealth.emptyCount.toLocaleString("id-ID")} stok kosong`}
              badgeText={`${stockHealth.readyPct}% Ready`}
              badgeTone={stockHealth.emptyCount > 0 ? "blue" : "emerald"}
              accentColor="#3B82F6"
              icon={PackageCheck}
              sparklineData={[
                { label: "Total", value: summary.totalActive },
                { label: "Ready", value: stockHealth.readyCount },
                { label: "Empty", value: stockHealth.emptyCount },
                { label: "Disc", value: stockHealth.discontinueCount },
              ]}
              href="/admin/spare-parts?stock_only=true"
              staggerIndex={3}
            />
          </div>

          {/* Row 2: Analytics Grid (Trend Area + Status Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <BookingTrendChart bookings={allBookings} staggerIndex={4} />
            </div>
            <div className="lg:col-span-4">
              <BookingStatusChart distribution={statusDist} staggerIndex={5} />
            </div>
          </div>

          {/* Row 3: Pipeline Stage Strip */}
          <PipelineStageStrip items={pipelineItems} startStaggerIndex={6} />

          {/* Row 4: Pit Operations + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <PitOperationsCard
                pits={pitList}
                occupiedCount={occupiedPits}
                subtitle={
                  selectedDayBookings.length > 0
                    ? `Tanggal ${selectedDay} ${monthName}`
                    : "Kesiapan operasional pit"
                }
                staggerIndex={10}
              />
            </div>
            <div className="lg:col-span-7">
              <BookingCalendarCard
                calendarDate={calendarDate}
                selectedDay={selectedDay}
                today={today}
                daysWithBookings={daysWithBookings}
                selectedDayBookings={selectedDayBookings}
                onChangeMonth={(nextDate) => {
                  setCalendarDate(nextDate);
                  setSelectedDay(1);
                }}
                onSelectDay={setSelectedDay}
                staggerIndex={11}
              />
            </div>
          </div>

          {/* Row 5: Recent Bookings */}
          <RecentBookingsCard
            bookings={allBookings.slice(0, 8)}
            totalCount={bookingTotal}
            updatingId={updatingBookingId}
            onQuickConfirm={handleQuickConfirm}
            getWhatsAppLink={getWhatsAppLink}
            staggerIndex={12}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 3: Commit**

```bash
rtk git add frontend/src/app/admin/page.tsx
rtk git commit -m "feat(admin): redesign executive dashboard with Recharts sparklines, trend chart, and pipeline strip"
```

---

### Task 7: `/admin/bookings` Redesign

**Files:**
- Modify: `frontend/src/app/admin/bookings/page.tsx:1-60,260-445,865-890`

- [ ] **Step 1: Add imports (`PipelineStageStrip`, `ProgressRing`) and fix `as any` typing in `bookings/page.tsx`**

At lines 3-5 and 24-27 of `frontend/src/app/admin/bookings/page.tsx`, import `type { CSSProperties } from "react"`, `PipelineStageStrip`, and `ProgressRing`:

```tsx
import { useEffect, useState, useCallback, Suspense, type CSSProperties } from "react";
```

```tsx
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PipelineStageStrip, {
  type PipelineStageItem,
} from "@/components/admin/PipelineStageStrip";
import ProgressRing from "@/components/admin/ProgressRing";
```

At line 874 of `frontend/src/app/admin/bookings/page.tsx`, replace `e.target.value as any` with strict union typing:

```tsx
                  onChange={(e) => {
                    const nextStatus = e.target.value as Booking["status"];
                    handleUpdateStatus(selectedBooking.id, nextStatus);
                    setSelectedBooking((prev) =>
                      prev ? { ...prev, status: nextStatus } : null
                    );
                  }}
```

- [ ] **Step 2: Upgrade container, summary strip, and table styling in `bookings/page.tsx`**

Replace lines 259-360 and 434-441 of `frontend/src/app/admin/bookings/page.tsx`:

1. Right before `return (`, compute status breakdown for the loaded view:

```tsx
  const doneInView = bookings.filter((b) => b.status === "DONE").length;
  const inProgressInView = bookings.filter((b) => b.status === "IN_PROGRESS").length;
  const confirmedInView = bookings.filter((b) => b.status === "CONFIRMED").length;
  const viewCompletionPct =
    bookings.length > 0 ? Math.round((doneInView / bookings.length) * 100) : 0;

  const bookingStages: PipelineStageItem[] = [
    {
      key: "ALL",
      label: "Semua Reservasi",
      count: total,
      subtitle: "Total seluruh antrean",
      accentHex: "#E4002B",
      isActive: statusFilter === "ALL",
      onClick: () => {
        setStatusFilter("ALL");
        setPage(1);
      },
    },
    {
      key: "PENDING",
      label: "Pending",
      count: pendingCount,
      subtitle: "Di halaman ini",
      accentHex: "#F59E0B",
      isActive: statusFilter === "PENDING",
      onClick: () => {
        setStatusFilter("PENDING");
        setPage(1);
      },
    },
    {
      key: "IN_PROGRESS",
      label: "Dikerjakan / Siap",
      count: confirmedInView + inProgressInView,
      subtitle: `${confirmedInView} terjadwal · ${inProgressInView} proses`,
      accentHex: "#3B82F6",
      isActive: statusFilter === "IN_PROGRESS",
      onClick: () => {
        setStatusFilter("IN_PROGRESS");
        setPage(1);
      },
    },
    {
      key: "DONE",
      label: "Selesai",
      count: doneInView,
      subtitle: "Di halaman ini",
      accentHex: "#10B981",
      isActive: statusFilter === "DONE",
      onClick: () => {
        setStatusFilter("DONE");
        setPage(1);
      },
    },
  ];
```

2. Update root wrapper & `AdminPageHeader` + summary row in `frontend/src/app/admin/bookings/page.tsx`:

```tsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Manajemen Booking & Reservasi"
        subtitle={`${total} total reservasi · antrean servis & suku cadang Honda`}
        breadcrumb="Booking Servis"
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet size={13} className={isExporting ? "animate-spin" : ""} />
              {isExporting ? "Mengunduh..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={() => fetchBookings()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-9">
              <PipelineStageStrip items={bookingStages} startStaggerIndex={0} />
            </div>
            <div
              className="xl:col-span-3 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 admin-stagger-item"
              style={{ "--stagger-index": 4 } as CSSProperties}
            >
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Penyelesaian View
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                  {doneInView} / {bookings.length} Tiket
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Rasio selesai halaman aktif
                </p>
              </div>
              <ProgressRing
                percentage={viewCompletionPct}
                size={60}
                strokeWidth={6}
                color="#10B981"
                label="Tingkat Selesai"
              />
            </div>
          </div>
```

3. Update Table container wrapper at lines 435-439 of `frontend/src/app/admin/bookings/page.tsx`:

```tsx
          {/* Table Container */}
          <div
            style={{ "--stagger-index": 5 } as CSSProperties}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wide">
```

- [ ] **Step 3: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/app/admin/bookings/page.tsx
rtk git commit -m "feat(admin): align bookings page with pipeline stage strip and unified surface tokens"
```

---

### Task 8: `/admin/spare-parts` Redesign & Header Button Fix

**Files:**
- Modify: `frontend/src/app/admin/spare-parts/page.tsx:28-40,130-145,310-345,535-555`

- [ ] **Step 1: Add `/admin/summary` state & imports in `spare-parts/page.tsx`**

Update React import line 3 and import `ProgressRing` and `SparePartSummary` type:

```tsx
import { useState, useEffect, useCallback, type CSSProperties } from "react";
```

```tsx
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProgressRing from "@/components/admin/ProgressRing";
import {
  computeStockHealth,
  type SparePartSummary,
} from "@/lib/admin-metrics";
```

Add `summary` state and fetch alongside `fetchParts`:

```tsx
  const [summary, setSummary] = useState<SparePartSummary>({
    totalActive: 0,
    outOfStock: 0,
    totalDiscontinue: 0,
  });

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await authFetch(`${baseUrl}/admin/summary`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSummary(data.data);
      }
    } catch {
      // ignore non-blocking summary failure
    }
  }, [token, authFetch]);
```

Call `fetchSummary()` inside the `useEffect` that calls `fetchParts()`, and inside `handleSavePart`, `handleUpdateStock`, `handleDeletePart` after success.

- [ ] **Step 2: Fix invisible white-on-white header actions and add stock readiness strip**

Replace lines 311-342 of `frontend/src/app/admin/spare-parts/page.tsx`:

```tsx
  const stockHealth = computeStockHealth(summary);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Manajemen Suku Cadang"
        subtitle={`${total > 0 ? total.toLocaleString("id-ID") + "+" : "44.000+"} SKU · harga HET AHM & stok gudang`}
        breadcrumb="Suku Cadang"
        icon={Wrench}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E4002B] hover:bg-[#C40024] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Tambah Part
            </button>
            <button
              type="button"
              onClick={() => {
                fetchParts();
                fetchSummary();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Stock Summary & Readiness Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ACTIVE");
                setStockStatusFilter("all");
                setPage(1);
              }}
              style={{ "--stagger-index": 0 } as CSSProperties}
              className="relative overflow-hidden text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#E4002B]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total SKU Aktif
              </span>
              <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {summary.totalActive.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {summary.totalDiscontinue.toLocaleString("id-ID")} discontinue
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStockStatusFilter("ready");
                setStatusFilter("");
                setPage(1);
              }}
              style={{ "--stagger-index": 1 } as CSSProperties}
              className="relative overflow-hidden text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Siap Jual (&gt; 0)
              </span>
              <div className="mt-1.5 text-2xl font-black text-emerald-600 tabular-nums">
                {stockHealth.readyCount.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Klik untuk filter Ready Stock
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStockStatusFilter("empty");
                setStatusFilter("");
                setPage(1);
              }}
              style={{ "--stagger-index": 2 } as CSSProperties}
              className="relative overflow-hidden text-left bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item admin-card-interactive cursor-pointer"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stok Kosong (0)
              </span>
              <div className="mt-1.5 text-2xl font-black text-amber-600 tabular-nums">
                {stockHealth.emptyCount.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Klik untuk filter Perlu Restock
              </span>
            </button>

            <div
              style={{ "--stagger-index": 3 } as CSSProperties}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 admin-stagger-item"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Kesiapan Stok
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                  {stockHealth.readyPct}% Tersedia
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dari total SKU aktif
                </p>
              </div>
              <ProgressRing
                percentage={stockHealth.readyPct}
                size={58}
                strokeWidth={6}
                color="#10B981"
                label="Kesiapan Stok"
              />
            </div>
          </div>

          <div
            style={{ "--stagger-index": 4 } as CSSProperties}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
```

Also update the inner table wrapper at line 538 (`border border-zinc-300 rounded-lg`) to `border-t border-slate-200/80 bg-white` so the rounded outer `rounded-2xl` card wraps the table cleanly without double borders.

- [ ] **Step 3: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/app/admin/spare-parts/page.tsx
rtk git commit -m "feat(admin): fix spare-parts header actions and add stock readiness summary strip"
```

---

### Task 9: `/admin/stock-logs` & `/admin/import` Redesign

**Files:**
- Modify: `frontend/src/app/admin/stock-logs/page.tsx:80-212`
- Modify: `frontend/src/app/admin/import/page.tsx:165-275,370-441`

- [ ] **Step 1: Add mutation summary strip & V28 table tokens in `stock-logs/page.tsx`**

Import `type { CSSProperties } from "react"` at line 3 and compute in-view totals right before `return (` in `frontend/src/app/admin/stock-logs/page.tsx`:

```tsx
import { useEffect, useState, useCallback, type CSSProperties } from "react";
```

```tsx
  const inboundCount = logs.filter((l) => l.selisih > 0).length;
  const outboundCount = logs.filter((l) => l.selisih < 0).length;
```

Update the JSX wrapper to match V28 (`p-4 sm:p-6`, 3-card summary strip with `admin-stagger-item`, `rounded-2xl border-slate-200/80` table card, and `rounded-xl` refresh button):

```tsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Audit Trail Perubahan Stok"
        subtitle={`${total.toLocaleString("id-ID")} catatan perubahan stok suku cadang`}
        breadcrumb="Riwayat Stok"
        icon={History}
        actions={
          <button
            type="button"
            onClick={() => fetchStockLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              style={{ "--stagger-index": 0 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-[#E4002B]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Catatan Mutasi
              </span>
              <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {total.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Audit log tersimpan
              </span>
            </div>

            <div
              style={{ "--stagger-index": 1 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Mutasi Masuk (Halaman Ini)
              </span>
              <div className="mt-1.5 text-2xl font-black text-emerald-600 tabular-nums">
                +{inboundCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Penambahan / pengembalian stok
              </span>
            </div>

            <div
              style={{ "--stagger-index": 2 } as CSSProperties}
              className="relative overflow-hidden bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
            >
              <span className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Mutasi Keluar (Halaman Ini)
              </span>
              <div className="mt-1.5 text-2xl font-black text-amber-600 tabular-nums">
                {outboundCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Pengurangan / pemakaian part
              </span>
            </div>
          </div>

          {/* Table */}
          <div
            style={{ "--stagger-index": 3 } as CSSProperties}
            className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] admin-stagger-item"
          >
```

Keep the existing table `<thead>`, `<tbody>`, and pagination structure inside that rounded card, updating `bg-zinc-50` header to `bg-slate-50 dark:bg-slate-800/60`.

- [ ] **Step 2: Add 3-step pipeline indicator & clean sheet surface in `import/page.tsx`**

In `frontend/src/app/admin/import/page.tsx`, import `type { CSSProperties } from "react"` at line 3:

```tsx
import { useState, useEffect, useCallback, type CSSProperties } from "react";
```

Update lines 166-188 (`div` wrapper, `AdminPageHeader` template button, and content container):

```tsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminPageHeader
        title="Import Excel Suku Cadang"
        subtitle="Upload & sinkronisasi katalog AHM via spreadsheet"
        breadcrumb="Import Excel"
        icon={FileSpreadsheet}
        actions={
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#E4002B]" />
            Template Excel
          </button>
        }
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* 3-Step Import Pipeline */}
          <div
            style={{ "--stagger-index": 0 } as CSSProperties}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 admin-stagger-item"
          >
```

And close `<div className="max-w-6xl mx-auto space-y-5">` right before the closing `</div>` of the `flex-1 overflow-auto` container, while using `bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl` on the Upload, Preview, and History cards (`admin-stagger-item`).

```tsx
            {[
              {
                step: "1",
                title: "Pilih File Excel",
                desc: "Format AHASS atau standar",
                active: !previewData && !confirmResult,
                done: Boolean(previewData || confirmResult),
              },
              {
                step: "2",
                title: "Preview & Validasi",
                desc: "Cek baris valid & error",
                active: Boolean(previewData),
                done: Boolean(confirmResult),
              },
              {
                step: "3",
                title: "Sinkronisasi Katalog",
                desc: "Simpan & catat riwayat",
                active: Boolean(confirmResult),
                done: Boolean(confirmResult),
              },
            ].map((s) => (
              <div
                key={s.step}
                className={`relative overflow-hidden rounded-2xl border p-4 bg-white dark:bg-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-3 ${
                  s.active
                    ? "border-[#E4002B] ring-2 ring-[#E4002B]/15"
                    : "border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                    s.done
                      ? "bg-emerald-500 text-white"
                      : s.active
                      ? "bg-[#E4002B] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.step}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
```

- [ ] **Step 3: Verify TypeScript**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/app/admin/stock-logs/page.tsx frontend/src/app/admin/import/page.tsx
rtk git commit -m "feat(admin): align stock-logs and import pages with unified dashboard tokens"
```

---

### Task 10: Full Automated Verification Suite

- [ ] **Step 1: Run pure metric unit tests**

Run: `node --test frontend/src/lib/admin-metrics.test.mjs`
Expected: All 5 tests pass, 0 failed.

- [ ] **Step 2: Run strict TypeScript check**

Run: `.\frontend\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit --incremental false`
Expected: Exit code 0 with zero errors.

- [ ] **Step 3: Run ESLint**

Run: `npm --prefix frontend run lint`
Expected: Exit code 0 with zero errors.

- [ ] **Step 4: Run Next.js production build**

Run: `npm --prefix frontend run build`
Expected: Production build succeeds cleanly across all `/admin*` routes.
