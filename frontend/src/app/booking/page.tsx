"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, Copy, Check, Clock, MapPin, Navigation } from "lucide-react";
import Navbar from "@/components/Navbar";

interface ServicePackage {
  id: string;
  title: string;
  badge: string;
  points: string[];
}

interface SuccessData {
  ticket_no: string;
  nama_customer: string;
  email: string;
  tanggal_booking: string;
}

const REGULAR_PACKAGES: ServicePackage[] = [
  {
    id: "ganti-oli-saja",
    title: "Ganti Oli Mesin Saja",
    badge: "Fast Track",
    points: ["Penggantian oli mesin AHM Oil asli", "Pemeriksaan ring baut tap oli", "Reset indikator oli (bila ada)"],
  },
  {
    id: "bongkar-cvt",
    title: "Servis & Bongkar CVT",
    badge: "Perawatan Matic",
    points: ["Pembersihan komponen CVT matic", "Pemeriksaan roller & v-belt", "Pelumasan greasing CVT khusus"],
  },
  {
    id: "paket-oli",
    title: "Paket Ganti Oli + 5 Poin Servis",
    badge: "Free 5 Poin",
    points: [
      "Ganti oli mesin",
      "Setel & lumasi rantai roda",
      "Setel rem depan & belakang",
      "Periksa tekanan angin ban",
      "Periksa lampu & klakson",
      "Pemeriksaan air radiator",
    ],
  },
  {
    id: "paket-ringan",
    title: "Paket Servis Ringan",
    badge: "9 Poin Servis",
    points: ["Pengecekan komponen Rangka", "Pengecekan performa Mesin", "Pengecekan sistem Kelistrikan"],
  },
  {
    id: "paket-lengkap",
    title: "Paket Servis Lengkap",
    badge: "15 Poin Servis",
    points: ["Pemeriksaan menyeluruh Mesin", "Pemeriksaan sistem Rangka & Suspensi", "Pemeriksaan penuh sistem Kelistrikan"],
  },
];

const KPB_STANDARD_PACKAGES: ServicePackage[] = [
  {
    id: "kpb-1-std",
    title: "KPB 1 (1.000 km / 2 Bulan)",
    badge: "Gratis Oli & Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 1",
      "Gratis Oli Mesin AHM & Jasa Servis Gratis",
      "1.000 km atau 2 bulan pertama (mana tercapai lebih dulu)",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
  {
    id: "kpb-2-std",
    title: "KPB 2 (4.000 km / 4 Bulan)",
    badge: "Gratis Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 2",
      "Jasa Servis Gratis (Oli/Sparepart berbayar bila ada penggantian)",
      "4.000 km atau 4 bulan berikutnya dari KPB 1",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
  {
    id: "kpb-3-std",
    title: "KPB 3 (8.000 km / 8 Bulan)",
    badge: "Gratis Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 3",
      "Jasa Servis Gratis",
      "8.000 km atau 8 bulan berikutnya dari KPB 2",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
  {
    id: "kpb-4-std",
    title: "KPB 4 (12.000 km / 12 Bulan)",
    badge: "Gratis Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 4",
      "Jasa Servis Gratis",
      "12.000 km atau 12 bulan berikutnya dari KPB 3",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
];

const KPB_PREMIUM_PACKAGES: ServicePackage[] = [
  {
    id: "kpb-1-prem",
    title: "KPB 1 (160cc+) (1.000 km / 2 Bulan)",
    badge: "Gratis Oli & Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 1 (PCX 160, ADV 160, Vario 160, Stylo 160, CBR, dll)",
      "Gratis Oli Mesin AHM & Jasa Servis Gratis",
      "1.000 km atau 2 bulan pertama (mana tercapai lebih dulu)",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
  {
    id: "kpb-2-prem",
    title: "KPB 2 (160cc+) (6.000 km / 6 Bulan)",
    badge: "Gratis Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 2 (Tipe 160cc+)",
      "Jasa Servis Gratis (Oli/Sparepart berbayar bila ada penggantian)",
      "6.000 km atau 6 bulan berikutnya dari KPB 1",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
  {
    id: "kpb-3-prem",
    title: "KPB 3 (160cc+) (12.000 km / 12 Bulan)",
    badge: "Gratis Jasa Servis",
    points: [
      "Kupon Perawatan Berkala 3 (Tipe 160cc+)",
      "Jasa Servis Gratis",
      "12.000 km atau 12 bulan berikutnya dari KPB 2 (total 12.000 km)",
      "Wajib membawa Buku Servis / Garansi & STNK",
    ],
  },
];

const ALL_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

const HONDA_MOTOR_GROUPS = [
  {
    group: "Skuter Matic (110cc & 125cc)",
    items: ["Honda Beat & Beat Street", "Honda Scoopy", "Honda Genio", "Honda Vario 125"],
  },
  {
    group: "Motor Bebek & Sport 150cc (4x KPB)",
    items: [
      "Honda Revo Series (Revo Fit, Revo X)",
      "Honda Supra X 125",
      "Honda Sonic 150R",
      "Honda CB150 Verza",
      "Honda CRF150L",
      "Honda CB150R StreetFire",
    ],
  },
  {
    group: "Matic & Sport (160cc+ / Premium 3x KPB)",
    items: [
      "Honda Vario 160",
      "Honda PCX 160",
      "Honda ADV 160",
      "Honda Stylo 160",
      "Honda CBR150R / CBR 250RR",
    ],
  },
  {
    group: "Tipe Lainnya",
    items: ["Motor Honda Tipe Lainnya"],
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-[#E4002B] focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25";

/** Helper to get available time slots for a specific date string (YYYY-MM-DD) */
function getAvailableTimeSlots(dateStr: string): { slot: string; disabled: boolean }[] {
  if (!dateStr) return ALL_SLOTS.map((slot) => ({ slot, disabled: false }));

  const [y, m, d] = dateStr.split("-").map(Number);
  const selectedDate = new Date(y, m - 1, d);
  const isSunday = selectedDate.getDay() === 0;

  // Sunday max is 14:00 (08:00 to 14:00)
  const slotsForDay = isSunday ? ALL_SLOTS.filter((s) => s <= "14:00") : ALL_SLOTS;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = dateStr === todayStr;

  const currentHour = now.getHours();

  return slotsForDay.map((slot) => {
    const slotHour = parseInt(slot.split(":")[0], 10);
    // If today, disable slots where slotHour <= currentHour
    const disabled = isToday ? slotHour <= currentHour : false;
    return { slot, disabled };
  });
}

/** Numbered form section wrapper. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0">
      <h2 className="mb-5 flex items-center gap-3 font-display text-xl font-bold text-zinc-900">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (Number.isNaN(dateObj.getTime())) return iso;
  return dateObj.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function BookingPage() {
  const [formData, setFormData] = useState({
    nama_customer: "",
    email: "",
    no_hp: "",
    no_mesin: "",
    plat_kendaraan: "",
    tipe_motor: "",
    tanggal_booking: "",
    jam_booking: "",
    jenis_servis: [] as string[],
    detail_lainnya: "",
  });
  const [serviceCategory, setServiceCategory] = useState<"reguler" | "kpb">("reguler");
  const [kpbCategory, setKpbCategory] = useState<"standard" | "premium">("standard");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const activePackages =
    serviceCategory === "reguler"
      ? REGULAR_PACKAGES
      : kpbCategory === "standard"
      ? KPB_STANDARD_PACKAGES
      : KPB_PREMIUM_PACKAGES;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const selectedService = formData.jenis_servis[0];

  const availableSlots = getAvailableTimeSlots(formData.tanggal_booking);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "tanggal_booking") {
      const validSlots = getAvailableTimeSlots(value);
      const firstAvailable = validSlots.find((s) => !s.disabled)?.slot || "";
      setFormData((prev) => ({
        ...prev,
        tanggal_booking: value,
        jam_booking: firstAvailable,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fail = (msg: string) => {
    setErrorMsg(msg);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.jenis_servis.length === 0) return fail("Pilih paket servis terlebih dahulu.");
    if (!formData.tanggal_booking) return fail("Pilih tanggal booking terlebih dahulu.");

    const slots = getAvailableTimeSlots(formData.tanggal_booking);
    const chosenSlot = slots.find((s) => s.slot === formData.jam_booking);

    if (!formData.jam_booking || !chosenSlot || chosenSlot.disabled) {
      return fail("Jam kedatangan yang dipilih tidak valid atau sudah terlewat.");
    }

    if (!formData.plat_kendaraan.trim()) return fail("Plat nomor kendaraan wajib diisi.");
    if (!formData.no_mesin.trim()) return fail("Nomor mesin wajib diisi.");
    if (!formData.nama_customer.trim()) return fail("Nama lengkap pemilik wajib diisi.");
    if (!formData.no_hp.trim()) return fail("Nomor WhatsApp wajib diisi.");
    if (!EMAIL_REGEX.test(formData.email.trim())) return fail("Masukkan alamat email yang valid. Tiket booking dikirim ke email ini.");

    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: formData.email.trim().toLowerCase() }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.errors?.[0] || resData.message || "Gagal melakukan reservasi booking.");
      }
      setSuccessData({ ...resData.data, email: formData.email.trim().toLowerCase() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      fail(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const copyTicket = async () => {
    if (!successData) return;
    try {
      await navigator.clipboard.writeText(successData.ticket_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setFormData({
      nama_customer: "",
      email: "",
      no_hp: "",
      no_mesin: "",
      plat_kendaraan: "",
      tipe_motor: "",
      tanggal_booking: "",
      jam_booking: "",
      jenis_servis: [],
      detail_lainnya: "",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-[125px] sm:pt-[110px] sm:px-6">
        {successData ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 text-center md:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={30} />
            </div>
            <h1 className="font-display text-2xl font-bold [text-wrap:balance]">Booking berhasil</h1>
            <p className="mt-2 text-base text-zinc-600">
              Simpan nomor tiket ini dan tunjukkan ke petugas saat tiba di bengkel.
            </p>

            <div className="mt-6 rounded-xl bg-zinc-100 p-5">
              <p className="text-sm text-zinc-600">Nomor tiket</p>
              <p className="mt-1 break-all font-mono text-3xl font-bold text-zinc-900">{successData.ticket_no}</p>
              <button
                type="button"
                onClick={copyTicket}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Tersalin" : "Salin nomor"}
              </button>
            </div>

            <dl className="mt-6 divide-y divide-zinc-200 text-left text-base">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-600">Nama</dt>
                <dd className="text-right font-semibold">{successData.nama_customer}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-600">Jadwal</dt>
                <dd className="text-right font-semibold">{formatDate(successData.tanggal_booking)} ({formData.jam_booking})</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-zinc-600">Email tiket</dt>
                <dd className="break-all text-right font-semibold">{successData.email}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm text-zinc-600">Mohon hadir 10 menit lebih awal dari jadwal.</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-[#E4002B] px-5 py-3 text-base font-semibold text-white hover:bg-[#C20026] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                Buat booking baru
              </button>
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 px-5 py-3 text-base font-semibold text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B]"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-8 max-w-2xl">
              <h1 className="font-display text-3xl font-extrabold [text-wrap:balance] md:text-4xl">Booking servis</h1>
              <p className="mt-2 text-base text-zinc-600">
                Pilih paket dan jadwal, tiket langsung dikirim ke email Anda. Tanpa antre di tempat.
              </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
              <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-5 md:p-8">
                {errorMsg && (
                  <div
                    ref={errorRef}
                    role="alert"
                    className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-base text-[#B00020]"
                  >
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <Step n={1} title="Pilih paket servis">
                  {/* Category Switcher Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceCategory("reguler");
                        setFormData((p) => ({ ...p, jenis_servis: [] }));
                      }}
                      className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${
                        serviceCategory === "reguler"
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Servis Reguler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceCategory("kpb");
                        setFormData((p) => ({ ...p, jenis_servis: [] }));
                      }}
                      className={`py-2.5 px-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        serviceCategory === "kpb"
                          ? "bg-white text-[#E4002B] shadow-sm border border-zinc-200"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <span>Perawatan Berkala (KPB)</span>
                    </button>
                  </div>

                  {/* KPB Sub-Selector and Notice */}
                  {serviceCategory === "kpb" && (
                    <div className="mb-6 rounded-xl border border-red-100 bg-red-50/40 p-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Pilih Kapasitas Mesin Motor:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                              kpbCategory === "standard"
                                ? "border-[#E4002B] bg-white ring-2 ring-[#E4002B]/20 shadow-sm"
                                : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="kpb_type"
                              checked={kpbCategory === "standard"}
                              onChange={() => {
                                setKpbCategory("standard");
                                setFormData((p) => ({ ...p, jenis_servis: [] }));
                              }}
                              className="accent-[#E4002B]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">Tipe Standard / 110-150cc (4x Servis KPB)</p>
                              <p className="text-xs text-zinc-500">Beat, Scoopy, Genio, Vario 125, Revo, Supra X 125, Sonic 150R, CB150 Verza, CRF150L</p>
                            </div>
                          </label>
                          <label
                            className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                              kpbCategory === "premium"
                                ? "border-[#E4002B] bg-white ring-2 ring-[#E4002B]/20 shadow-sm"
                                : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="kpb_type"
                              checked={kpbCategory === "premium"}
                              onChange={() => {
                                setKpbCategory("premium");
                                setFormData((p) => ({ ...p, jenis_servis: [] }));
                              }}
                              className="accent-[#E4002B]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">Tipe Premium (160cc+)</p>
                              <p className="text-xs text-zinc-500">Vario 160, PCX 160, ADV 160, Stylo 160, CBR 250RR, dll.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-3.5 border border-zinc-200 text-xs text-zinc-700 space-y-1.5">
                        <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-[#E4002B] shrink-0" />
                          Ketentuan &amp; Tips KPB (Kupon Perawatan Berkala) Honda:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-600">
                          <li><strong>Bawa STNK &amp; Buku Servis/Garansi Resmi</strong> saat datang ke bengkel.</li>
                          <li>Acuan batas dihitung dari <strong>tanggal penyerahan motor (Delivery/Faktur Pembelian)</strong> di buku servis.</li>
                          <li>Lakukan servis tepat waktu sebelum batas km/bulan habis agar garansi tidak gugur.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <fieldset>
                    <legend className="sr-only">Paket servis</legend>
                    <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                      {activePackages.map((pkg) => {
                        const active = selectedService === pkg.title;
                        return (
                          <label
                            key={pkg.id}
                            htmlFor={pkg.id}
                            className={`flex cursor-pointer items-start gap-3 p-4 first:rounded-t-xl last:rounded-b-xl focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#E4002B]/40 ${
                              active ? "bg-red-50" : "hover:bg-zinc-50"
                            }`}
                          >
                            <input
                              type="radio"
                              id={pkg.id}
                              name="jenis_servis"
                              checked={active}
                              onChange={() => setFormData((p) => ({ ...p, jenis_servis: [pkg.title] }))}
                              className="mt-1 h-4 w-4 shrink-0 accent-[#E4002B]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-base font-semibold text-zinc-900">{pkg.title}</span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-[#B00020]">
                                  {pkg.badge}
                                </span>
                              </span>
                              {active && (
                                <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                                  {pkg.points.map((pt) => (
                                    <li key={pt} className="flex items-start gap-2">
                                      <Check size={14} className="mt-1 shrink-0 text-[#B00020]" />
                                      {pt}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="mt-5">
                    <Field id="detail_lainnya" label="Keluhan atau catatan tambahan (opsional)">
                      <textarea
                        id="detail_lainnya"
                        name="detail_lainnya"
                        rows={3}
                        value={formData.detail_lainnya}
                        onChange={handleChange}
                        placeholder="Contoh: bunyi kasar saat gas ditarik atau kilometer motor saat ini"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>
                </Step>

                <Step n={2} title="Pilih jadwal">
                  <Field id="tanggal_booking" label="Tanggal" hint="Senin-Sabtu (08:00 - 15:00), Minggu (08:00 - 14:00)">
                    <input
                      id="tanggal_booking"
                      type="date"
                      name="tanggal_booking"
                      required
                      min={today}
                      value={formData.tanggal_booking}
                      onChange={handleChange}
                      className={`${INPUT_CLASS} sm:max-w-xs`}
                    />
                  </Field>
                  <fieldset className="mt-5">
                    <legend className="mb-1.5 text-sm font-semibold text-zinc-800">Jam kedatangan</legend>
                    {!formData.tanggal_booking ? (
                      <p className="text-sm text-zinc-500 italic">Pilih tanggal terlebih dahulu untuk melihat jam yang tersedia.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                        {availableSlots.map(({ slot, disabled }) => {
                          const active = formData.jam_booking === slot;
                          return (
                            <label
                              key={slot}
                              className={`rounded-lg border px-3 py-2.5 text-center text-base font-medium transition-colors ${
                                disabled
                                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 line-through"
                                  : active
                                  ? "cursor-pointer border-[#E4002B] bg-[#E4002B] text-white focus-within:ring-2 focus-within:ring-[#E4002B]/40"
                                  : "cursor-pointer border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400 focus-within:ring-2 focus-within:ring-[#E4002B]/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="jam_booking"
                                value={slot}
                                disabled={disabled}
                                checked={active}
                                onChange={handleChange}
                                className="sr-only"
                              />
                              {slot}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                </Step>

                <Step n={3} title="Data kendaraan">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field id="tipe_motor" label="Model / Tipe Motor Honda" hint="Pilih tipe motor yang akan diservis">
                        <select
                          id="tipe_motor"
                          name="tipe_motor"
                          required
                          value={formData.tipe_motor}
                          onChange={handleChange}
                          className={INPUT_CLASS}
                        >
                          <option value="">-- Pilih Model Motor --</option>
                          {HONDA_MOTOR_GROUPS.map((g) => (
                            <optgroup key={g.group} label={g.group}>
                              {g.items.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field id="plat_kendaraan" label="Plat nomor">
                      <input
                        id="plat_kendaraan"
                        name="plat_kendaraan"
                        required
                        autoComplete="off"
                        autoCapitalize="characters"
                        value={formData.plat_kendaraan}
                        onChange={handleChange}
                        placeholder="E 1234 AB"
                        className={`${INPUT_CLASS} uppercase`}
                      />
                    </Field>
                    <Field id="no_mesin" label="Nomor mesin" hint="Wajib diisi sesuai STNK.">
                      <input
                        id="no_mesin"
                        name="no_mesin"
                        required
                        autoComplete="off"
                        value={formData.no_mesin}
                        onChange={handleChange}
                        placeholder="JM11E-1234567"
                        className={`${INPUT_CLASS} uppercase`}
                      />
                    </Field>
                  </div>
                </Step>

                <Step n={4} title="Data pemilik">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="nama_customer" label="Nama lengkap">
                      <input
                        id="nama_customer"
                        name="nama_customer"
                        required
                        autoComplete="name"
                        value={formData.nama_customer}
                        onChange={handleChange}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field id="no_hp" label="No. WhatsApp">
                      <input
                        id="no_hp"
                        type="tel"
                        inputMode="tel"
                        name="no_hp"
                        required
                        autoComplete="tel"
                        value={formData.no_hp}
                        onChange={handleChange}
                        placeholder="08xxxxxxxxxx"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="email" label="Email" hint="Tiket booking dikirim ke email ini.">
                        <input
                          id="email"
                          type="email"
                          inputMode="email"
                          name="email"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={INPUT_CLASS}
                        />
                      </Field>
                    </div>
                  </div>
                </Step>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E4002B] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#C20026] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
                  {loading ? "Memproses..." : "Konfirmasi booking"}
                </button>
              </form>

              <aside className="rounded-2xl border border-zinc-200 bg-white p-5 lg:sticky lg:top-[120px]">
                <h2 className="font-display text-lg font-bold">Ringkasan</h2>
                <dl className="mt-4 divide-y divide-zinc-200 text-base">
                  <div className="py-3">
                    <dt className="text-sm text-zinc-600">Paket</dt>
                    <dd className="font-semibold">{selectedService ?? "Belum dipilih"}</dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-sm text-zinc-600">Jadwal</dt>
                    <dd className="font-semibold">
                      {formData.tanggal_booking ? formatDate(formData.tanggal_booking) : "Belum dipilih"}, {formData.jam_booking}
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-sm text-zinc-600">Kendaraan</dt>
                    <dd className="font-semibold uppercase">{formData.plat_kendaraan || "-"}</dd>
                  </div>
                </dl>
                <p className="mt-2 flex items-start gap-2 text-sm text-zinc-600">
                  <Clock size={16} className="mt-0.5 shrink-0" />
                  Mohon hadir 10 menit lebih awal dari jadwal.
                </p>

                {/* Location & Map Card */}
                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-zinc-900">
                    <MapPin className="w-4 h-4 text-[#E4002B]" />
                    <span>Lokasi AHASS 10870</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mb-2.5 leading-snug">
                    Jl. Raya Kuningan, Kab. Kuningan, Jawa Barat
                  </p>
                  <div className="h-32 rounded-lg overflow-hidden border border-zinc-200 relative mb-3">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d319.7268610197772!2d108.48832525312899!3d-6.9516689375066765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f16edc0e25e75%3A0x5a4162116590d82d!2sDealer%20Honda%20AS%20Putra%20Motor%20Kuningan!5e1!3m2!1sen!2sid!4v1790916002596!5m2!1sen!2sid"
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      title="Peta Lokasi AHASS"
                    />
                  </div>
                  <a
                    href="https://maps.google.com/?q=Dealer+Honda+AS+Putra+Motor+Kuningan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Buka Rute di Google Maps
                  </a>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
