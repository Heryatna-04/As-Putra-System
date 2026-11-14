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
