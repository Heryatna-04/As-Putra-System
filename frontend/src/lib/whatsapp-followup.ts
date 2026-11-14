/**
 * Pure WhatsApp follow-up template, placeholder interpolation, and URL helpers
 * shared by the Admin Dashboard, Admin Bookings, and CRM Portal.
 */

export type WaBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export interface WaFollowUpItem {
  part_no: string;
  part_name: string;
  quantity: number;
  het: number;
}

export interface WaFollowUpBooking {
  id: string;
  ticket_no: string;
  nama_customer: string;
  no_hp?: string;
  no_telepon?: string;
  plat_kendaraan?: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  status: WaBookingStatus;
  tipe_booking?: "SERVIS" | "SPAREPART";
  items_json?: WaFollowUpItem[] | null;
  total_harga?: number;
  metode_layanan?: "AMBIL" | "PASANG";
}

export interface WaTemplate {
  id: string;
  name: string;
  category: "BUILT_IN" | "CUSTOM";
  body: string;
}

export const WA_CUSTOM_TEMPLATES_STORAGE_KEY = "as_putra_wa_custom_templates";

const WORKSHOP_NAME = "AHASS AS Putra Rahmat Kuningan";

const ID_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const ID_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const WA_TEMPLATE_VARIABLES: ReadonlyArray<{
  token: string;
  label: string;
}> = [
  { token: "{nama}", label: "Nama Customer" },
  { token: "{tiket}", label: "Kode Booking" },
  { token: "{tanggal}", label: "Tanggal" },
  { token: "{jam}", label: "Jam" },
  { token: "{kendaraan}", label: "Motor & Plat" },
  { token: "{plat}", label: "Plat Nomor" },
  { token: "{motor}", label: "Tipe Motor" },
  { token: "{layanan}", label: "Jenis Layanan" },
  { token: "{total}", label: "Estimasi Biaya" },
  { token: "{daftar_part}", label: "Daftar Part" },
];

export const BUILT_IN_WA_TEMPLATES: ReadonlyArray<WaTemplate> = [
  {
    id: "status_default",
    name: "Konfirmasi & Status Booking",
    category: "BUILT_IN",
    body: [
      "Halo Bapak/Ibu *{nama}*,",
      "",
      `Berikut informasi reservasi *{tipe_label}* Anda di *${WORKSHOP_NAME}*:`,
      "- Kode Booking : {tiket}",
      "- Jadwal       : {tanggal}, Pukul {jam} WIB",
      "- Kendaraan    : {kendaraan}",
      "- Layanan/Part : {daftar_part}",
      "- Status       : *{status_label}*",
      "",
      "Terima kasih telah mempercayakan perawatan motor Honda Anda kepada kami. Salam Satu Hati.",
    ].join("\n"),
  },
  {
    id: "reminder_schedule",
    name: "Pengingat Jadwal (H-1 / Hari H)",
    category: "BUILT_IN",
    body: [
      "Halo Bapak/Ibu *{nama}*,",
      "",
      `Kami dari *${WORKSHOP_NAME}* mengingatkan jadwal reservasi Anda:`,
      "- Kode Booking : {tiket}",
      "- Jadwal       : {tanggal}, Pukul {jam} WIB",
      "- Kendaraan    : {kendaraan}",
      "- Keperluan    : {daftar_part}",
      "",
      "Mohon hadir 10-15 menit sebelum jadwal agar langsung kami proses tanpa menunggu lama. Bila ada perubahan jam, silakan balas pesan ini.",
      "",
      "Terima kasih, Salam Satu Hati.",
    ].join("\n"),
  },
  {
    id: "ready_pickup",
    name: "Unit Selesai / Part Siap",
    category: "BUILT_IN",
    body: [
      "Halo Bapak/Ibu *{nama}*,",
      "",
      `Kabar baik, layanan motor Honda Anda (*{tiket}*) di *${WORKSHOP_NAME}* sudah selesai dan siap diproses:`,
      "- Kendaraan    : {kendaraan}",
      "- Rincian      : {daftar_part}",
      "",
      "Silakan datang ke bengkel/kasir kami dengan menunjukkan kode booking *{tiket}*.",
      "",
      "Terima kasih, Salam Satu Hati.",
    ].join("\n"),
  },
  {
    id: "after_service_care",
    name: "Follow-Up Pasca Servis (CRM)",
    category: "BUILT_IN",
    body: [
      "Halo Bapak/Ibu *{nama}*,",
      "",
      `Terima kasih telah mempercayakan perawatan motor Honda ({kendaraan}) di *${WORKSHOP_NAME}* untuk kode booking *{tiket}*.`,
      "Bagaimana kondisi motor Anda setelah layanan tersebut? Jika ada keluhan atau pertanyaan lanjutan, silakan kabari kami melalui nomor ini.",
      "",
      "Sampai jumpa di perawatan berkala berikutnya. Salam Satu Hati.",
    ].join("\n"),
  },
  {
    id: "manual_blank",
    name: "Tulis Manual",
    category: "BUILT_IN",
    body: "Halo Bapak/Ibu *{nama}* (Kode Booking: {tiket}),\n\n",
  },
];

function isSparepartBooking(booking: WaFollowUpBooking): boolean {
  return (
    booking.tipe_booking === "SPAREPART" ||
    Boolean(booking.ticket_no?.startsWith("PRT"))
  );
}

/** Formats ISO YYYY-MM-DD dates into readable Indonesian weekday and date without timezone drift. */
export function formatBookingDateId(rawDate?: string): string {
  const clean = rawDate?.trim() ?? "";
  if (!clean) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean);
  if (!match) return clean;

  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIdx < 0 || monthIdx > 11 || day < 1 || day > 31) {
    return clean;
  }

  const utcDate = new Date(Date.UTC(year, monthIdx, day));
  const weekday = ID_DAYS[utcDate.getUTCDay()];
  const monthName = ID_MONTHS[monthIdx];
  return `${weekday}, ${day} ${monthName} ${year}`;
}

/** Formats vehicle type and plate concisely, avoiding placeholder duplicates like "Motor Honda (-)". */
export function formatVehicleLabel(booking: WaFollowUpBooking): string {
  const motor = booking.tipe_motor?.trim() ?? "";
  const rawPlat = booking.plat_kendaraan?.trim() ?? "";
  const hasPlat = Boolean(rawPlat && rawPlat !== "-");
  const hasMotor = Boolean(motor && motor !== "-");

  if (hasMotor && hasPlat) return `${motor} (${rawPlat})`;
  if (hasPlat) return `Motor Honda (${rawPlat})`;
  if (hasMotor) return motor;
  return "Motor Honda";
}

function getStatusDisplayLabel(
  status: WaBookingStatus,
  isPart: boolean
): string {
  switch (status) {
    case "PENDING":
      return "Menunggu Konfirmasi";
    case "CONFIRMED":
      return "Terkonfirmasi";
    case "IN_PROGRESS":
      return isPart ? "Sedang Disiapkan" : "Sedang Dikerjakan Mekanik";
    case "DONE":
      return isPart ? "Siap Diambil / Dipasang" : "Servis Selesai";
    case "CANCELLED":
      return "Dibatalkan";
  }
}

/** Normalizes Indonesian phone strings into clean digits prefixed with country code 62. */
export function formatPhoneForWa(rawPhone?: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

/** Formats sparepart item lines or falls back to jenis_servis for template display. */
function formatItemsSummary(booking: WaFollowUpBooking): string {
  if (Array.isArray(booking.items_json) && booking.items_json.length > 0) {
    return booking.items_json
      .map((it) => `${it.part_name} (${it.quantity}x)`)
      .join(", ");
  }
  return booking.jenis_servis || "-";
}

/** Builds detailed status-aware notification copy for both service and sparepart reservations. */
export function buildDefaultStatusMessage(booking: WaFollowUpBooking): string {
  const isPart = isSparepartBooking(booking);
  const nama = booking.nama_customer?.trim() || "Pelanggan";
  const tanggalLabel = formatBookingDateId(booking.tanggal_booking);
  const jamLabel = booking.jam_booking?.trim() || "--:--";
  const kendaraanLabel = formatVehicleLabel(booking);
  const statusText = getStatusDisplayLabel(booking.status, isPart);

  const lines: string[] = [`Halo Bapak/Ibu *${nama}*,`, ""];

  if (booking.status === "PENDING") {
    lines.push(
      isPart
        ? `Pesanan *Suku Cadang Honda* Anda di *${WORKSHOP_NAME}* telah kami terima dan sedang menunggu konfirmasi:`
        : `Reservasi *Servis Motor Honda* Anda di *${WORKSHOP_NAME}* telah kami terima dan sedang menunggu konfirmasi:`
    );
  } else if (booking.status === "CONFIRMED") {
    lines.push(
      isPart
        ? `Pesanan *Suku Cadang Honda* Anda di *${WORKSHOP_NAME}* telah *TERKONFIRMASI*:`
        : `Reservasi *Servis Motor Honda* Anda di *${WORKSHOP_NAME}* telah *TERKONFIRMASI*:`
    );
  } else if (booking.status === "IN_PROGRESS") {
    lines.push(
      isPart
        ? `Pesanan *Suku Cadang Honda* Anda di *${WORKSHOP_NAME}* sedang kami siapkan:`
        : `Unit motor Honda Anda di *${WORKSHOP_NAME}* saat ini sedang ditangani mekanik kami:`
    );
  } else if (booking.status === "DONE") {
    lines.push(
      isPart
        ? `Kabar baik, pesanan *Suku Cadang Honda* Anda di *${WORKSHOP_NAME}* sudah siap:`
        : `Kabar baik, pengerjaan *Servis Motor Honda* Anda di *${WORKSHOP_NAME}* telah selesai:`
    );
  } else {
    lines.push(
      `Kami menginformasikan bahwa reservasi berikut di *${WORKSHOP_NAME}* telah *DIBATALKAN*:`
    );
  }

  lines.push(`- Kode Booking : ${booking.ticket_no || "-"}`);
  lines.push(`- Jadwal       : ${tanggalLabel}, Pukul ${jamLabel} WIB`);
  lines.push(`- Kendaraan    : ${kendaraanLabel}`);

  if (isPart) {
    const metode =
      booking.metode_layanan === "PASANG"
        ? "Sekalian Pasang oleh Mekanik AHASS"
        : "Ambil di Kasir Suku Cadang";
    lines.push(`- Metode       : ${metode}`);
    if (Array.isArray(booking.items_json) && booking.items_json.length > 0) {
      lines.push("- Daftar Part  :");
      booking.items_json.forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.part_name} (${it.part_no}) x${it.quantity}`);
      });
    } else {
      lines.push(`- Keperluan    : ${booking.jenis_servis || "-"}`);
    }
    if (booking.total_harga && Number(booking.total_harga) > 0) {
      lines.push(
        `- Total Estimasi : *Rp ${Number(booking.total_harga).toLocaleString("id-ID")}*`
      );
    }
  } else {
    lines.push(`- Layanan      : ${booking.jenis_servis || "-"}`);
  }

  lines.push(`- Status       : *${statusText}*`);
  lines.push("");

  if (booking.status === "PENDING") {
    lines.push(
      "Mohon konfirmasi melalui balasan pesan ini jika jadwal di atas sudah sesuai. Terima kasih."
    );
  } else if (booking.status === "CONFIRMED") {
    lines.push(
      `Silakan datang 10-15 menit sebelum jadwal dan tunjukkan kode booking *${booking.ticket_no}* ke petugas kami. Terima kasih.`
    );
  } else if (booking.status === "IN_PROGRESS") {
    lines.push(
      "Kami akan segera mengabarkan kembali begitu selesai. Terima kasih atas kesabarannya."
    );
  } else if (booking.status === "DONE") {
    lines.push(
      `Silakan menuju area kasir/penyerahan ${WORKSHOP_NAME} dengan menunjukkan kode booking *${booking.ticket_no}*. Terima kasih, Salam Satu Hati.`
    );
  } else {
    lines.push(
      "Jika Bapak/Ibu ingin menjadwalkan ulang waktu servis atau pemesanan part, silakan balas pesan ini. Terima kasih."
    );
  }

  return lines.join("\n");
}

function buildReminderMessage(booking: WaFollowUpBooking): string {
  const isPart = isSparepartBooking(booking);
  const nama = booking.nama_customer?.trim() || "Pelanggan";
  const tanggalLabel = formatBookingDateId(booking.tanggal_booking);
  const jamLabel = booking.jam_booking?.trim() || "--:--";
  const kendaraanLabel = formatVehicleLabel(booking);

  const lines = [
    `Halo Bapak/Ibu *${nama}*,`,
    "",
    isPart
      ? `Kami dari *${WORKSHOP_NAME}* mengingatkan jadwal pengambilan suku cadang Honda Anda:`
      : `Kami dari *${WORKSHOP_NAME}* mengingatkan jadwal reservasi servis motor Honda Anda:`,
    `- Kode Booking : ${booking.ticket_no || "-"}`,
    `- Jadwal       : ${tanggalLabel}, Pukul ${jamLabel} WIB`,
    `- Kendaraan    : ${kendaraanLabel}`,
    isPart
      ? `- Suku Cadang  : ${formatItemsSummary(booking)}`
      : `- Layanan      : ${booking.jenis_servis || "-"}`,
    "",
    "Mohon hadir 10-15 menit sebelum jadwal agar langsung kami tangani tanpa antre. Bila ada perubahan jam kedatangan, silakan balas pesan ini.",
    "",
    "Terima kasih, Salam Satu Hati.",
  ];

  return lines.join("\n");
}

function buildReadyPickupMessage(booking: WaFollowUpBooking): string {
  const isPart = isSparepartBooking(booking);
  const nama = booking.nama_customer?.trim() || "Pelanggan";
  const kendaraanLabel = formatVehicleLabel(booking);

  const lines = [
    `Halo Bapak/Ibu *${nama}*,`,
    "",
    isPart
      ? `Kabar baik, pesanan suku cadang Honda Anda di *${WORKSHOP_NAME}* sudah *SIAP*:`
      : `Kabar baik, pengerjaan servis motor Honda Anda di *${WORKSHOP_NAME}* sudah *SELESAI*:`,
    `- Kode Booking : ${booking.ticket_no || "-"}`,
    `- Kendaraan    : ${kendaraanLabel}`,
  ];

  if (isPart) {
    lines.push(`- Suku Cadang  : ${formatItemsSummary(booking)}`);
    if (booking.total_harga && Number(booking.total_harga) > 0) {
      lines.push(
        `- Total Estimasi : *Rp ${Number(booking.total_harga).toLocaleString("id-ID")}*`
      );
    }
    lines.push(
      `- Metode       : ${booking.metode_layanan === "PASANG" ? "Sekalian Pasang di Bengkel" : "Ambil di Kasir Suku Cadang"}`
    );
  } else {
    lines.push(`- Layanan      : ${booking.jenis_servis || "-"}`);
  }

  lines.push("");
  lines.push(
    `Silakan datang ke bengkel/kasir ${WORKSHOP_NAME} dengan menunjukkan kode booking *${booking.ticket_no}*.`
  );
  lines.push("");
  lines.push("Terima kasih, Salam Satu Hati.");

  return lines.join("\n");
}

function buildAfterServiceCareMessage(booking: WaFollowUpBooking): string {
  const isPart = isSparepartBooking(booking);
  const nama = booking.nama_customer?.trim() || "Pelanggan";
  const kendaraanLabel = formatVehicleLabel(booking);

  const intro = isPart
    ? `Terima kasih telah memercayakan kebutuhan suku cadang asli Honda (${kendaraanLabel}) di *${WORKSHOP_NAME}* untuk kode booking *${booking.ticket_no}*.`
    : `Terima kasih telah melakukan perawatan motor Honda (${kendaraanLabel}) di *${WORKSHOP_NAME}* untuk kode booking *${booking.ticket_no}*.`;

  const question = isPart
    ? "Apakah suku cadang yang diterima sudah sesuai dan terpasang dengan baik? Bila ada pertanyaan atau kebutuhan part lainnya, silakan hubungi kami melalui nomor ini."
    : "Bagaimana performa motor Anda setelah diservis di bengkel kami? Bila ada keluhan lanjutan atau masukan terkait pelayanan, silakan balas pesan ini.";

  return [
    `Halo Bapak/Ibu *${nama}*,`,
    "",
    intro,
    question,
    "",
    "Sampai jumpa di kunjungan berikutnya. Salam Satu Hati.",
  ].join("\n");
}

/** Replaces supported {placeholder} tokens inside any template body using booking details. */
export function renderWaTemplate(
  body: string,
  booking: WaFollowUpBooking
): string {
  const isPart = isSparepartBooking(booking);

  const totalFormatted =
    booking.total_harga && Number(booking.total_harga) > 0
      ? `Rp ${Number(booking.total_harga).toLocaleString("id-ID")}`
      : "-";

  const replacements: Record<string, string> = {
    "{nama}": booking.nama_customer?.trim() || "Pelanggan",
    "{tiket}": booking.ticket_no || "-",
    "{tanggal}": formatBookingDateId(booking.tanggal_booking),
    "{jam}": booking.jam_booking || "-",
    "{kendaraan}": formatVehicleLabel(booking),
    "{plat}": booking.plat_kendaraan?.trim() || "-",
    "{motor}": booking.tipe_motor?.trim() || "Motor Honda",
    "{layanan}": booking.jenis_servis || "-",
    "{total}": totalFormatted,
    "{daftar_part}": formatItemsSummary(booking),
    "{tipe_label}": isPart ? "Suku Cadang" : "Servis Motor",
    "{status_label}": getStatusDisplayLabel(booking.status, isPart),
  };

  let output = body;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(value);
  }
  return output;
}

/** Resolves built-in presets with smart context phrasing or interpolates custom templates. */
export function resolveTemplateMessage(
  template: WaTemplate,
  booking: WaFollowUpBooking
): string {
  switch (template.id) {
    case "status_default":
      return buildDefaultStatusMessage(booking);
    case "reminder_schedule":
      return buildReminderMessage(booking);
    case "ready_pickup":
      return buildReadyPickupMessage(booking);
    case "after_service_care":
      return buildAfterServiceCareMessage(booking);
    default:
      return renderWaTemplate(template.body, booking);
  }
}

/** Builds a ready-to-open wa.me deep link, returning empty string when phone is invalid. */
export function buildDirectWaUrl(
  rawPhone: string | undefined,
  message: string
): string {
  const waNumber = formatPhoneForWa(rawPhone);
  if (!waNumber) return "";
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

/** Validates and parses custom templates serialized in localStorage without unsafe casts. */
export function parseStoredTemplates(rawJson: string | null): WaTemplate[] {
  if (!rawJson) return [];
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    const result: WaTemplate[] = [];

    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const rec = item as Record<string, unknown>;
      if (
        typeof rec.id === "string" &&
        typeof rec.name === "string" &&
        typeof rec.body === "string" &&
        rec.name.trim().length > 0 &&
        rec.body.trim().length > 0
      ) {
        result.push({
          id: rec.id,
          name: rec.name.trim(),
          category: "CUSTOM",
          body: rec.body,
        });
      }
    }

    return result;
  } catch {
    return [];
  }
}

export function loadCustomWaTemplates(): WaTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredTemplates(
      window.localStorage.getItem(WA_CUSTOM_TEMPLATES_STORAGE_KEY)
    );
  } catch {
    return [];
  }
}

export function saveCustomWaTemplates(templates: WaTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      WA_CUSTOM_TEMPLATES_STORAGE_KEY,
      JSON.stringify(templates)
    );
  } catch {
    // ignore quota/private-mode errors
  }
}
