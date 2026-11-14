"use client";

import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Loader2,
  MessageSquare,
  Save,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  ADMIN_BOOKING_SOURCE_PRESETS,
  ADMIN_KPB_SERVICES,
  ADMIN_REGULAR_SERVICES,
  BOOKING_TIME_SLOTS,
  HONDA_MOTOR_GROUPS,
} from "@/lib/booking-options";
import type { BookingStatus } from "@/lib/admin-metrics";

export type AdminInitialBookingStatus = Extract<
  BookingStatus,
  "PENDING" | "CONFIRMED" | "IN_PROGRESS"
>;

export interface AdminCreatedBooking {
  id: string;
  ticket_no: string;
  nama_customer: string;
  email?: string;
  no_hp: string;
  no_mesin?: string;
  plat_kendaraan?: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  detail_lainnya?: string;
  status: BookingStatus;
  catatan_admin?: string;
  tipe_booking?: "SERVIS" | "SPAREPART";
  created_at: string;
}

export interface AdminCreateBookingModalProps {
  /** Controls modal visibility. */
  isOpen: boolean;
  /** Closes modal without saving. */
  onClose: () => void;
  /** Invoked after backend creates the booking record; `openWhatsApp` is true when admin requests immediate WA follow-up. */
  onCreated: (created: AdminCreatedBooking, openWhatsApp: boolean) => void;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCreatedBooking(raw: unknown): AdminCreatedBooking | null {
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  const rawStatus = raw.status;
  const status: BookingStatus =
    rawStatus === "PENDING" ||
    rawStatus === "CONFIRMED" ||
    rawStatus === "IN_PROGRESS" ||
    rawStatus === "DONE" ||
    rawStatus === "CANCELLED"
      ? rawStatus
      : "CONFIRMED";

  return {
    id: raw.id,
    ticket_no: typeof raw.ticket_no === "string" ? raw.ticket_no : "",
    nama_customer:
      typeof raw.nama_customer === "string" ? raw.nama_customer : "-",
    email: typeof raw.email === "string" ? raw.email : undefined,
    no_hp: typeof raw.no_hp === "string" ? raw.no_hp : "",
    no_mesin: typeof raw.no_mesin === "string" ? raw.no_mesin : undefined,
    plat_kendaraan:
      typeof raw.plat_kendaraan === "string" ? raw.plat_kendaraan : undefined,
    tipe_motor: typeof raw.tipe_motor === "string" ? raw.tipe_motor : undefined,
    tanggal_booking:
      typeof raw.tanggal_booking === "string" ? raw.tanggal_booking : "",
    jam_booking: typeof raw.jam_booking === "string" ? raw.jam_booking : "",
    jenis_servis:
      typeof raw.jenis_servis === "string" ? raw.jenis_servis : "-",
    detail_lainnya:
      typeof raw.detail_lainnya === "string" ? raw.detail_lainnya : undefined,
    status,
    catatan_admin:
      typeof raw.catatan_admin === "string" ? raw.catatan_admin : undefined,
    tipe_booking: "SERVIS",
    created_at:
      typeof raw.created_at === "string"
        ? raw.created_at
        : new Date().toISOString(),
  };
}

function AdminCreateBookingForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: AdminCreatedBooking, openWhatsApp: boolean) => void;
}) {
  const { authFetch } = useAuth();

  const [namaCustomer, setNamaCustomer] = useState("");
  const [noHp, setNoHp] = useState("");
  const [email, setEmail] = useState("");
  const [tipeMotor, setTipeMotor] = useState("");
  const [platKendaraan, setPlatKendaraan] = useState("");
  const [noMesin, setNoMesin] = useState("");
  const [tanggalBooking, setTanggalBooking] = useState<string>(() =>
    getTodayIsoDate()
  );
  const [jamBooking, setJamBooking] = useState<string>(BOOKING_TIME_SLOTS[0]);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Paket Servis Ringan",
  ]);
  const [detailLainnya, setDetailLainnya] = useState("");
  const [initialStatus, setInitialStatus] =
    useState<AdminInitialBookingStatus>("CONFIRMED");
  const [catatanAdmin, setCatatanAdmin] = useState("Walk-in Bengkel");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isSubmitting]);

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((item) => item !== serviceName)
        : [...prev, serviceName]
    );
  };

  const submitBooking = async (openWhatsAppAfterSave: boolean) => {
    const cleanName = namaCustomer.trim();
    const cleanPhone = noHp.replace(/\s|-/g, "").trim();

    if (cleanName.length < 2) {
      toast.error("Nama pelanggan minimal 2 karakter");
      return;
    }

    if (!/^(0|62|\+62)[0-9]{8,13}$/.test(cleanPhone)) {
      toast.error("Format No. HP / WhatsApp tidak valid (contoh: 081234567890)");
      return;
    }

    if (!tanggalBooking || !jamBooking.trim()) {
      toast.error("Tanggal dan jam booking wajib diisi");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("Pilih minimal satu jenis servis");
      return;
    }

    if (
      selectedServices.includes("Lainnya") &&
      detailLainnya.trim().length < 3
    ) {
      toast.error('Untuk opsi "Lainnya", isi keluhan/rincian servis minimal 3 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama_customer: cleanName,
        no_hp: cleanPhone,
        email: email.trim() || undefined,
        tipe_motor: tipeMotor.trim() || undefined,
        plat_kendaraan: platKendaraan.trim().toUpperCase() || undefined,
        no_mesin: noMesin.trim().toUpperCase() || undefined,
        tanggal_booking: tanggalBooking,
        jam_booking: jamBooking.trim(),
        jenis_servis: selectedServices,
        detail_lainnya: detailLainnya.trim() || undefined,
        status: initialStatus,
        catatan_admin: catatanAdmin.trim() || undefined,
      };

      const res = await authFetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawJson: unknown = await res.json().catch(() => null);
      const isOk =
        res.ok && isRecord(rawJson) && rawJson.success === true;

      if (!isOk) {
        if (res.status === 404) {
          toast.error(
            "Endpoint input booking admin belum tersedia di backend aktif. Jalankan atau deploy backend terbaru."
          );
          return;
        }
        const errorList =
          isRecord(rawJson) && Array.isArray(rawJson.errors)
            ? rawJson.errors.filter((e): e is string => typeof e === "string")
            : [];
        const message =
          errorList[0] ||
          (isRecord(rawJson) && typeof rawJson.message === "string"
            ? rawJson.message
            : "Gagal menyimpan booking servis");
        toast.error(message);
        return;
      }

      const createdRecord = isRecord(rawJson)
        ? parseCreatedBooking(rawJson.data)
        : null;

      if (!createdRecord) {
        toast.success("Booking servis berhasil dibuat!");
        onClose();
        return;
      }

      toast.success(
        `Booking ${createdRecord.ticket_no} untuk ${createdRecord.nama_customer} tersimpan!`
      );
      onCreated(createdRecord, openWhatsAppAfterSave);
    } catch {
      toast.error("Gagal menghubungi server saat menyimpan booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-create-booking-title"
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sticky top-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center text-[#E4002B] shrink-0">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                id="admin-create-booking-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                Input Booking Servis Pelanggan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Catat reservasi dari pelanggan walk-in, WhatsApp, atau telepon ke antrean bengkel
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Tutup modal input booking"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitBooking(false);
          }}
          className="p-5 space-y-5"
        >
          {/* Section 1: Customer Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Data Pelanggan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="admin-bk-nama"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nama Pelanggan <span className="text-[#E4002B]">*</span>
                </label>
                <input
                  id="admin-bk-nama"
                  type="text"
                  required
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  placeholder="cth. Budi Santoso"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-bk-hp"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  No. HP / WhatsApp <span className="text-[#E4002B]">*</span>
                </label>
                <input
                  id="admin-bk-hp"
                  type="tel"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="cth. 081234567890"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-bk-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="admin-bk-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Kirim tiket email jika diisi"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Schedule */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Kendaraan &amp; Jadwal Servis
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="admin-bk-motor"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tipe Motor Honda
                </label>
                <select
                  id="admin-bk-motor"
                  value={tipeMotor}
                  onChange={(e) => setTipeMotor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B] cursor-pointer"
                >
                  <option value="">-- Pilih Tipe Motor --</option>
                  {HONDA_MOTOR_GROUPS.map((grp) => (
                    <optgroup key={grp.group} label={grp.group}>
                      {grp.items.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-bk-plat"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Plat Nomor <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="admin-bk-plat"
                  type="text"
                  value={platKendaraan}
                  onChange={(e) => setPlatKendaraan(e.target.value.toUpperCase())}
                  placeholder="cth. E 1234 YA"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-bk-mesin"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  No. Mesin <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="admin-bk-mesin"
                  type="text"
                  value={noMesin}
                  onChange={(e) => setNoMesin(e.target.value.toUpperCase())}
                  placeholder="cth. JM91E123456"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="admin-bk-tanggal"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tanggal Booking <span className="text-[#E4002B]">*</span>
                </label>
                <input
                  id="admin-bk-tanggal"
                  type="date"
                  required
                  value={tanggalBooking}
                  onChange={(e) => setTanggalBooking(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-bk-jam"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Jam Kedatangan <span className="text-[#E4002B]">*</span>
                </label>
                <select
                  id="admin-bk-jam"
                  value={jamBooking}
                  onChange={(e) => setJamBooking(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B] cursor-pointer"
                >
                  {BOOKING_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} WIB
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-bk-status"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Status Awal
                </label>
                <select
                  id="admin-bk-status"
                  value={initialStatus}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (
                      next === "PENDING" ||
                      next === "CONFIRMED" ||
                      next === "IN_PROGRESS"
                    ) {
                      setInitialStatus(next);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B] cursor-pointer"
                >
                  <option value="CONFIRMED">Terkonfirmasi (Slot Terkunci)</option>
                  <option value="IN_PROGRESS">Langsung Dikerjakan (Pit)</option>
                  <option value="PENDING">Pending (Menunggu Verifikasi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Package Multi-Select */}
          <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#E4002B]" />
                3. Pilih Paket Servis <span className="text-[#E4002B]">*</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Bisa pilih lebih dari satu
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ADMIN_REGULAR_SERVICES.map((srv) => {
                const active = selectedServices.includes(srv);
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleService(srv)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? "bg-[#E4002B] text-white border-[#E4002B] shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {srv}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Kupon Perawatan Berkala (KPB Resmi Honda):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_KPB_SERVICES.map((kpb) => {
                  const active = selectedServices.includes(kpb);
                  return (
                    <button
                      key={kpb}
                      type="button"
                      onClick={() => toggleService(kpb)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {kpb}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="admin-bk-detail"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Keluhan / Rincian Servis{" "}
                  {selectedServices.includes("Lainnya") ? (
                    <span className="text-[#E4002B]">*</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Opsional)</span>
                  )}
                </label>
                <textarea
                  id="admin-bk-detail"
                  rows={2}
                  value={detailLainnya}
                  onChange={(e) => setDetailLainnya(e.target.value)}
                  placeholder="cth. Tarikan berat di putaran awal, cek kampas rem depan"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="admin-bk-catatan"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Catatan Admin / Sumber Booking
                  </label>
                </div>
                <textarea
                  id="admin-bk-catatan"
                  rows={2}
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Sumber booking atau catatan mekanik..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {ADMIN_BOOKING_SOURCE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCatatanAdmin(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                        catatanAdmin === preset
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#E4002B]" />
              )}
              <span>Simpan Booking</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitBooking(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>Simpan &amp; Follow-Up WA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal form allowing AHASS admin staff to manually record customer service
 * bookings received via walk-in, phone, or WhatsApp without customer self-signup friction.
 */
export default function AdminCreateBookingModal({
  isOpen,
  onClose,
  onCreated,
}: AdminCreateBookingModalProps) {
  if (!isOpen) return null;
  return <AdminCreateBookingForm onClose={onClose} onCreated={onCreated} />;
}
