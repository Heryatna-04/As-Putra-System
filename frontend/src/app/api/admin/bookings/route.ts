import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|62|\+62)[0-9]{8,13}$/;
const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseServices(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

async function generateTicketNoSupabase(
  supabaseUrl: string,
  serviceKey: string,
  dateStr: string,
  attempt: number
): Promise<string> {
  const rawDate = new Date(dateStr);
  const yyyy = rawDate.getFullYear();
  const mm = String(rawDate.getMonth() + 1).padStart(2, "0");
  const dd = String(rawDate.getDate()).padStart(2, "0");
  const prefix = `SRV-${yyyy}${mm}${dd}-`;

  let currentCount = 0;
  try {
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?ticket_no=like.${encodeURIComponent(
        `${prefix}*`
      )}&select=id`,
      {
        method: "HEAD",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "count=exact",
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    const rangeHeader = countRes.headers.get("content-range");
    if (rangeHeader) {
      const totalPart = rangeHeader.split("/")[1];
      const parsedCount = Number(totalPart);
      if (Number.isFinite(parsedCount)) {
        currentCount = parsedCount;
      }
    }
  } catch {
    // Fallback to attempt-based suffix
  }

  const seq = String(currentCount + 1 + attempt).padStart(4, "0");
  if (attempt > 0) {
    const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${prefix}${seq}-${rand}`;
  }
  return `${prefix}${seq}`;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Token autentikasi wajib disertakan" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format payload JSON tidak valid" },
      { status: 400 }
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { success: false, message: "Payload booking tidak valid" },
      { status: 400 }
    );
  }

  // 1. Primary path: forward ke Express Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (res.status !== 404) {
      const data: unknown = await res.json().catch(() => ({
        success: false,
        message: "Respon backend tidak valid",
      }));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (err) {
    console.warn(
      "[Route /api/admin/bookings] Backend unavailable, trying Supabase admin fallback:",
      err
    );
  }

  // 2. Fallback path: verify admin JWT & role, then insert directly to Supabase
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://esvwatrnlqgcnvjtebmr.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseServiceKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Endpoint /admin/bookings belum aktif di server API dan service key tidak tersedia.",
      },
      { status: 503 }
    );
  }

  const token = authHeader.slice(7).trim();
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!userRes.ok) {
    return NextResponse.json(
      { success: false, message: "Sesi login tidak valid atau kedaluwarsa" },
      { status: 401 }
    );
  }

  const userJson: unknown = await userRes.json().catch(() => null);
  const userId = isRecord(userJson) && typeof userJson.id === "string" ? userJson.id : "";
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Identitas pengguna tidak ditemukan" },
      { status: 401 }
    );
  }

  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
      userId
    )}&select=role`,
    {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      signal: AbortSignal.timeout(5000),
    }
  );

  const profilesJson: unknown = await profileRes.json().catch(() => []);
  const role =
    Array.isArray(profilesJson) &&
    profilesJson.length > 0 &&
    isRecord(profilesJson[0]) &&
    typeof profilesJson[0].role === "string"
      ? profilesJson[0].role
      : "";

  if (role !== "ADMIN" && role !== "KEPALA_BENGKEL") {
    return NextResponse.json(
      { success: false, message: "Akses ditolak: hanya Admin / Kepala Bengkel" },
      { status: 403 }
    );
  }

  // Validate sanitized fields strictly
  const errors: string[] = [];
  const namaCustomer =
    typeof body.nama_customer === "string" ? body.nama_customer.trim() : "";
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const noHp =
    typeof body.no_hp === "string" ? body.no_hp.replace(/\s|-/g, "").trim() : "";
  const platKendaraan =
    typeof body.plat_kendaraan === "string" ? body.plat_kendaraan.trim() : "";
  const noMesin =
    typeof body.no_mesin === "string" ? body.no_mesin.trim() : "";
  const tipeMotor =
    typeof body.tipe_motor === "string" ? body.tipe_motor.trim() : "";
  const tanggalBooking =
    typeof body.tanggal_booking === "string" ? body.tanggal_booking.trim() : "";
  const jamBooking =
    typeof body.jam_booking === "string" ? body.jam_booking.trim() : "";
  const detailLainnya =
    typeof body.detail_lainnya === "string" ? body.detail_lainnya.trim() : "";
  const catatanAdmin =
    typeof body.catatan_admin === "string" ? body.catatan_admin.trim() : "";
  const services = parseServices(body.jenis_servis);
  const rawStatus = typeof body.status === "string" ? body.status : "CONFIRMED";

  if (namaCustomer.length < 2) {
    errors.push("Nama customer wajib diisi minimal 2 karakter");
  }
  if (rawEmail.length > 0 && !EMAIL_REGEX.test(rawEmail)) {
    errors.push("Format Email tidak valid");
  }
  if (!noHp || !PHONE_REGEX.test(noHp)) {
    errors.push("Nomor WhatsApp/HP tidak valid (contoh: 081234567890)");
  }
  if (!tanggalBooking || Number.isNaN(Date.parse(tanggalBooking))) {
    errors.push("Tanggal booking wajib valid");
  }
  if (!jamBooking) {
    errors.push("Jam booking wajib dipilih");
  }
  if (services.length === 0) {
    errors.push("Pilih atau isi minimal satu jenis servis");
  } else if (services.includes("Lainnya") && detailLainnya.length < 3) {
    errors.push('Untuk opsi "Lainnya", isi rincian servis minimal 3 karakter');
  }
  if (!(ALLOWED_STATUSES as readonly string[]).includes(rawStatus)) {
    errors.push("Status awal booking tidak valid");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, message: errors[0], errors },
      { status: 400 }
    );
  }

  const bookingPayload = {
    nama_customer: namaCustomer,
    email: rawEmail ? rawEmail.toLowerCase() : null,
    no_hp: noHp,
    no_mesin: noMesin ? noMesin.toUpperCase() : "-",
    plat_kendaraan: platKendaraan ? platKendaraan.toUpperCase() : "-",
    tipe_motor: tipeMotor || null,
    tanggal_booking: tanggalBooking,
    jam_booking: jamBooking,
    jenis_servis: services.join(", "),
    detail_lainnya: detailLainnya || null,
    status: rawStatus,
    catatan_admin: catatanAdmin || null,
    tipe_booking: "SERVIS",
    total_harga: 0,
    metode_layanan: "AMBIL",
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const ticketNo = await generateTicketNoSupabase(
      supabaseUrl,
      supabaseServiceKey,
      tanggalBooking,
      attempt
    );

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ ...bookingPayload, ticket_no: ticketNo }),
      signal: AbortSignal.timeout(8000),
    });

    if (insertRes.ok) {
      const inserted: unknown = await insertRes.json().catch(() => []);
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      return NextResponse.json(
        {
          success: true,
          message: "Booking servis pelanggan berhasil dibuat!",
          data: row,
        },
        { status: 201 }
      );
    }

    if (insertRes.status !== 409) {
      const errJson: unknown = await insertRes.json().catch(() => null);
      const errMsg =
        isRecord(errJson) && typeof errJson.message === "string"
          ? errJson.message
          : "Gagal menyimpan data booking";
      return NextResponse.json(
        { success: false, message: errMsg },
        { status: insertRes.status }
      );
    }
  }

  return NextResponse.json(
    { success: false, message: "Gagal membuat nomor tiket unik, coba lagi" },
    { status: 409 }
  );
}
