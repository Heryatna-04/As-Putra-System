import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_WA_TEMPLATES,
  formatPhoneForWa,
  formatBookingDateId,
  formatVehicleLabel,
  renderWaTemplate,
  resolveTemplateMessage,
  buildDirectWaUrl,
  parseStoredTemplates,
} from "./whatsapp-followup.ts";

const servisBooking = {
  id: "b1",
  ticket_no: "SRV-2026-001",
  nama_customer: "Budi Santoso",
  no_hp: "0812-3456-7890",
  plat_kendaraan: "E 1234 XY",
  tipe_motor: "Vario 160",
  tanggal_booking: "2026-11-15",
  jam_booking: "09:30",
  jenis_servis: "Servis Berkala & Ganti Oli",
  status: "CONFIRMED",
  tipe_booking: "SERVIS",
};

const partBooking = {
  id: "b2",
  ticket_no: "PRT-2026-009",
  nama_customer: "Sari Dewi",
  no_telepon: "+62 857-9999-1111",
  tipe_motor: "Beat Street",
  tanggal_booking: "2026-11-15",
  jam_booking: "11:00",
  jenis_servis: "Kampas Rem",
  status: "PENDING",
  tipe_booking: "SPAREPART",
  metode_layanan: "AMBIL",
  total_harga: 125000,
  items_json: [
    { part_no: "06455-K56", part_name: "PAD SET FR", quantity: 1, het: 75000 },
    { part_no: "08232-2MB", part_name: "OLI MPX2", quantity: 1, het: 50000 },
  ],
};

test("formatPhoneForWa normalizes Indonesian 08 and +62 numbers", () => {
  assert.equal(formatPhoneForWa("0812-3456-7890"), "6281234567890");
  assert.equal(formatPhoneForWa("+62 857-9999-1111"), "6285799991111");
  assert.equal(formatPhoneForWa("6281111116408"), "6281111116408");
  assert.equal(formatPhoneForWa(""), "");
  assert.equal(formatPhoneForWa("abc"), "");
});

test("formatBookingDateId and formatVehicleLabel produce clean Indonesian labels", () => {
  assert.equal(formatBookingDateId("2026-11-15"), "Minggu, 15 November 2026");
  assert.equal(formatVehicleLabel(servisBooking), "Vario 160 (E 1234 XY)");
  assert.equal(
    formatVehicleLabel({
      ...servisBooking,
      tipe_motor: undefined,
      plat_kendaraan: "-",
    }),
    "Motor Honda"
  );
});

test("renderWaTemplate replaces placeholders for service and sparepart bookings", () => {
  const tpl =
    "Halo {nama}, tiket {tiket} ({kendaraan}) jam {jam} tgl {tanggal} untuk {layanan}. Total: {total}. Part: {daftar_part}";
  const renderedServis = renderWaTemplate(tpl, servisBooking);
  assert.match(renderedServis, /Budi Santoso/);
  assert.match(renderedServis, /SRV-2026-001/);
  assert.match(renderedServis, /Vario 160 \(E 1234 XY\)/);
  assert.match(renderedServis, /09:30/);
  assert.match(renderedServis, /15 November 2026/);
  assert.match(renderedServis, /Servis Berkala & Ganti Oli/);

  const renderedPart = renderWaTemplate(tpl, partBooking);
  assert.match(renderedPart, /Sari Dewi/);
  assert.match(renderedPart, /125\.000/);
  assert.match(renderedPart, /PAD SET FR/);
  assert.match(renderedPart, /OLI MPX2/);
});

test("resolveTemplateMessage produces polite wording without broken placeholders", () => {
  const readyTpl = BUILT_IN_WA_TEMPLATES.find((t) => t.id === "ready_pickup");
  assert.ok(readyTpl);

  const readyServis = resolveTemplateMessage(readyTpl, {
    ...servisBooking,
    status: "DONE",
  });
  assert.match(readyServis, /Halo Bapak\/Ibu \*Budi Santoso\*/);
  assert.doesNotMatch(readyServis, /Estimasi Biaya:\s*-/);

  const statusPending = resolveTemplateMessage(
    BUILT_IN_WA_TEMPLATES[0],
    partBooking
  );
  assert.match(statusPending, /Menunggu Konfirmasi/);
  assert.match(statusPending, /PAD SET FR/);
});

test("BUILT_IN_WA_TEMPLATES includes official status template and manual template", () => {
  assert.ok(BUILT_IN_WA_TEMPLATES.length >= 5);
  const ids = BUILT_IN_WA_TEMPLATES.map((t) => t.id);
  assert.ok(ids.includes("status_default"));
  assert.ok(ids.includes("manual_blank"));
});

test("buildDirectWaUrl produces encoded wa.me URL or empty string on invalid phone", () => {
  const url = buildDirectWaUrl("08123456789", "Halo Bapak/Ibu Budi!");
  assert.equal(
    url,
    "https://wa.me/628123456789?text=Halo%20Bapak%2FIbu%20Budi!"
  );
  assert.equal(buildDirectWaUrl("", "Halo"), "");
});

test("parseStoredTemplates safely ignores malformed JSON and keeps valid custom templates", () => {
  assert.deepEqual(parseStoredTemplates("not-json"), []);
  assert.deepEqual(parseStoredTemplates('[{"bad": 1}]'), []);

  const validJson = JSON.stringify([
    {
      id: "custom-1",
      name: "Promo Oli",
      category: "CUSTOM",
      body: "Halo {nama}",
    },
  ]);
  const parsed = parseStoredTemplates(validJson);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Promo Oli");
  assert.equal(parsed[0].category, "CUSTOM");
});
