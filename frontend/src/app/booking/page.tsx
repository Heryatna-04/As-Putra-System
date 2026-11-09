"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Clock,
  MapPin,
  Navigation,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Store,
  ShieldCheck,
  ArrowRight,
  Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import LazyMap from "@/components/LazyMap";
import { buildBookingWaUrl, buildSparePartBookingWaUrl, formatIDR } from "@/lib/utils";
import { usePartInquiry } from "@/context/PartInquiryContext";
import { fetchSparePartDetail } from "@/lib/api";

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

interface SparePartSuccessData {
  ticket_no: string;
  nama_customer: string;
  email: string;
  no_hp: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  metode_layanan: string;
  items: Array<{ part_no: string; part_name: string; nama_umum?: string | null; quantity: number; het: number; gambar_url?: string | null }>;
  total_harga: number;
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

const PREMIUM_HONDA_MODELS = [
  "Honda Vario 160",
  "Honda PCX 160",
  "Honda ADV 160",
  "Honda Stylo 160",
  "Honda CBR150R",
  "Honda CBR 250RR / CBR250R",
  "Honda CB150X",
  "Honda CRF250 Rally / L",
  "Honda EM1 e: (Listrik)",
  "Honda Monkey / Super Cub C125",
];

const HONDA_MOTOR_GROUPS = [
  {
    group: "Skuter Matic Standard 110cc & 125cc (4x KPB)",
    items: [
      "Honda Beat & Beat Street",
      "Honda Scoopy",
      "Honda Genio",
      "Honda Vario 125",
    ],
  },
  {
    group: "Matic Premium 160cc+ & EV (3x KPB)",
    items: [
      "Honda Vario 160",
      "Honda PCX 160",
      "Honda ADV 160",
      "Honda Stylo 160",
      "Honda EM1 e: (Listrik)",
    ],
  },
  {
    group: "Motor Bebek / Cub (4x KPB)",
    items: [
      "Honda Revo Series (Revo Fit, Revo X)",
      "Honda Supra X 125",
      "Honda Supra GTR 150",
      "Honda Monkey / Super Cub C125",
    ],
  },
  {
    group: "Sport Series 150cc - 250cc+",
    items: [
      "Honda CB150 Verza",
      "Honda Sonic 150R",
      "Honda CB150R StreetFire",
      "Honda CB150X",
      "Honda CRF150L",
      "Honda CBR150R",
      "Honda CBR 250RR / CBR250R",
      "Honda CRF250 Rally / L",
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

function BookingContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const partNoParam = searchParams.get("partNo");
  const ticketParam = searchParams.get("ticket");

  const [activeTab, setActiveTab] = useState<"servis" | "sparepart" | "tracking">(
    Boolean(ticketParam)
      ? "tracking"
      : initialType === "sparepart" || (Boolean(partNoParam) && initialType !== "servis")
      ? "sparepart"
      : "servis"
  );

  // State: Tracking Cek Tiket
  const [trackTicketNo, setTrackTicketNo] = useState(ticketParam || "");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<{
    ticket_no: string;
    tipe_booking: string;
    status: string;
    nama_customer: string;
    no_hp: string;
    plat_kendaraan: string;
    tipe_motor: string;
    tanggal_booking: string;
    jam_booking: string;
    jenis_servis: string;
    metode_layanan: string;
    items?: Array<{ part_no: string; part_name: string; quantity: number; het: number }>;
    total_harga?: number;
    created_at?: string;
  } | null>(null);

  const fetchTrackTicket = async (ticketCode: string) => {
    const clean = ticketCode.trim().toUpperCase();
    if (!clean) {
      setTrackError("Masukkan nomor tiket Anda (misal: SRV-... atau PRT-...)");
      return;
    }
    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const res = await fetch(`${baseUrl}/bookings/track/${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Tiket tidak ditemukan. Pastikan nomor tiket sudah benar.");
      }
      setTrackResult(json.data);
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : "Terjadi kesalahan saat memeriksa tiket");
    } finally {
      setTrackLoading(false);
    }
  };

  useEffect(() => {
    if (ticketParam) {
      fetchTrackTicket(ticketParam);
    }
  }, [ticketParam]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackTicket(trackTicketNo);
  };

  const [trackCopied, setTrackCopied] = useState(false);
  const copyTrackTicket = async () => {
    if (!trackResult?.ticket_no) return;
    try {
      await navigator.clipboard.writeText(trackResult.ticket_no);
      setTrackCopied(true);
      setTimeout(() => setTrackCopied(false), 2000);
    } catch {
      setTrackCopied(false);
    }
  };

  const {
    items: inquiryItems,
    addItem,
    removeItem,
    updateQuantity,
    clearItems,
    totalEstimate,
    totalCount: inquiryTotalCount,
    isInInquiry,
    generateWaUrl,
  } = usePartInquiry();

  const hasOutOfStockItems = inquiryItems.some((it) => (it.stok ?? 0) < it.quantity || (it.stok ?? 0) <= 0);

  // Load part detail if partNo is passed in query
  useEffect(() => {
    if (partNoParam && !isInInquiry(partNoParam)) {
      fetchSparePartDetail(partNoParam)
        .then((res) => {
          if (res.success && res.data) {
            addItem(res.data, 1);
          }
        })
        .catch(() => {});
    }
  }, [partNoParam]);

  // State: Booking Suku Cadang
  const [sparePartForm, setSparePartForm] = useState({
    nama_customer: "",
    email: "",
    no_hp: "",
    tipe_motor: "",
    metode_layanan: "AMBIL" as "AMBIL" | "PASANG",
    tanggal_booking: "",
    jam_booking: "",
    detail_lainnya: "",
  });
  const [sparePartLoading, setSparePartLoading] = useState(false);
  const [sparePartError, setSparePartError] = useState<string | null>(null);
  const [sparePartSuccessData, setSparePartSuccessData] = useState<SparePartSuccessData | null>(null);
  const [sparePartCopied, setSparePartCopied] = useState(false);
  const sparePartErrorRef = useRef<HTMLDivElement>(null);

  // State: Booking Servis (Existing)
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
  const sparePartSlots = getAvailableTimeSlots(sparePartForm.tanggal_booking);

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
    if (name === "tipe_motor") {
      const isPremium = PREMIUM_HONDA_MODELS.includes(value);
      setKpbCategory(isPremium ? "premium" : "standard");
      setFormData((prev) => ({ ...prev, tipe_motor: value, jenis_servis: [] }));
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
        body: JSON.stringify({
          ...formData,
          tipe_booking: "SERVIS",
          email: formData.email.trim().toLowerCase(),
        }),
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

  const handleSparePartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "tanggal_booking") {
      const validSlots = getAvailableTimeSlots(value);
      const firstAvailable = validSlots.find((s) => !s.disabled)?.slot || "";
      setSparePartForm((prev) => ({
        ...prev,
        tanggal_booking: value,
        jam_booking: firstAvailable,
      }));
      return;
    }
    setSparePartForm((prev) => ({ ...prev, [name]: value }));
  };

  const failSparePart = (msg: string) => {
    setSparePartError(msg);
    requestAnimationFrame(() => sparePartErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleSparePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSparePartError(null);

    if (inquiryItems.length === 0) {
      return failSparePart("Pilih minimal satu suku cadang dari katalog untuk dibooking.");
    }
    if (!sparePartForm.tanggal_booking) {
      return failSparePart("Pilih tanggal pengambilan / kedatangan.");
    }

    const slots = getAvailableTimeSlots(sparePartForm.tanggal_booking);
    const chosenSlot = slots.find((s) => s.slot === sparePartForm.jam_booking);
    if (!sparePartForm.jam_booking || !chosenSlot || chosenSlot.disabled) {
      return failSparePart("Jam pengambilan yang dipilih tidak valid atau sudah terlewat.");
    }

    if (!sparePartForm.nama_customer.trim()) {
      return failSparePart("Nama lengkap pemesan wajib diisi.");
    }
    if (!sparePartForm.no_hp.trim()) {
      return failSparePart("Nomor WhatsApp wajib diisi untuk konfirmasi stok.");
    }
    if (!EMAIL_REGEX.test(sparePartForm.email.trim())) {
      return failSparePart("Masukkan alamat email yang valid. Bukti tiket booking dikirim ke email ini.");
    }

    setSparePartLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-beta-murex-36.vercel.app/api/v1";
      const payload = {
        tipe_booking: "SPAREPART",
        nama_customer: sparePartForm.nama_customer.trim(),
        email: sparePartForm.email.trim().toLowerCase(),
        no_hp: sparePartForm.no_hp.trim(),
        tipe_motor: sparePartForm.tipe_motor.trim() || undefined,
        metode_layanan: sparePartForm.metode_layanan,
        tanggal_booking: sparePartForm.tanggal_booking,
        jam_booking: sparePartForm.jam_booking,
        items: inquiryItems.map((it) => ({
          part_no: it.part_no,
          part_name: it.nama_umum || it.part_name,
          nama_umum: it.nama_umum,
          quantity: it.quantity,
          het: it.het,
          gambar_url: it.gambar_url,
        })),
        total_harga: totalEstimate,
        jenis_servis: `Booking Suku Cadang (${inquiryItems.length} Item)`,
        detail_lainnya: sparePartForm.detail_lainnya.trim() || undefined,
      };

      const res = await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.errors?.[0] || resData.message || "Gagal melakukan reservasi suku cadang.");
      }

      setSparePartSuccessData({
        ticket_no: resData.data.ticket_no,
        nama_customer: sparePartForm.nama_customer.trim(),
        email: sparePartForm.email.trim().toLowerCase(),
        no_hp: sparePartForm.no_hp.trim(),
        tipe_motor: sparePartForm.tipe_motor.trim(),
        tanggal_booking: resData.data.tanggal_booking || sparePartForm.tanggal_booking,
        jam_booking: sparePartForm.jam_booking,
        metode_layanan: sparePartForm.metode_layanan,
        items: [...inquiryItems],
        total_harga: totalEstimate,
      });

      clearItems();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      failSparePart(err instanceof Error ? err.message : "Terjadi kesalahan koneksi server.");
    } finally {
      setSparePartLoading(false);
    }
  };

  const copySparePartTicket = async () => {
    if (!sparePartSuccessData) return;
    try {
      await navigator.clipboard.writeText(sparePartSuccessData.ticket_no);
      setSparePartCopied(true);
      setTimeout(() => setSparePartCopied(false), 2000);
    } catch {
      setSparePartCopied(false);
    }
  };

  const resetSparePartForm = () => {
    setSparePartSuccessData(null);
    setSparePartForm({
      nama_customer: "",
      email: "",
      no_hp: "",
      tipe_motor: "",
      metode_layanan: "AMBIL",
      tanggal_booking: "",
      jam_booking: "",
      detail_lainnya: "",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-20 md:pt-[110px] sm:px-6">
        {/* Mode Switcher Banner */}
        {!successData && !sparePartSuccessData && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 bg-zinc-200/70 rounded-2xl border border-zinc-300">
            <button
              type="button"
              onClick={() => setActiveTab("servis")}
              className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "servis"
                  ? "bg-white text-zinc-900 shadow-md border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === "servis" ? "bg-red-50 text-[#E4002B]" : "bg-zinc-200/70 text-zinc-500"
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base">Booking Servis Kendaraan</div>
                <div className="text-xs font-normal text-zinc-500 line-clamp-1">
                  Perawatan rutin, ganti oli, tune up, atau KPB
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sparepart")}
              className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "sparepart"
                  ? "bg-white text-zinc-900 shadow-md border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === "sparepart" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-200/70 text-zinc-500"
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base flex items-center gap-2">
                  <span>Booking Suku Cadang</span>
                  {inquiryItems.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                      {inquiryTotalCount} item
                    </span>
                  )}
                </div>
                <div className="text-xs font-normal text-zinc-500 line-clamp-1">
                  Pesan &amp; reservasi suku cadang asli Honda AHM
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "tracking"
                  ? "bg-white text-zinc-900 shadow-md border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === "tracking" ? "bg-blue-50 text-blue-700" : "bg-zinc-200/70 text-zinc-500"
                }`}
              >
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-extrabold text-base">Cek Status Tiket</div>
                <div className="text-xs font-normal text-zinc-500 line-clamp-1">
                  Lacak jadwal &amp; progres reservasi Anda
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Tab 1: Booking Suku Cadang */}
        {activeTab === "sparepart" && (
          sparePartSuccessData ? (
            <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl transition-all">
              {/* Ticket Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-6 text-white text-center relative">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white">
                  <CheckCircle2 size={28} />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-1">
                  AHASS AS Putra Motor Kuningan
                </span>
                <h1 className="font-display text-2xl font-black">Booking Suku Cadang Berhasil!</h1>
                <p className="mt-1 text-xs text-emerald-100">
                  Simpan atau tunjukkan nomor tiket ini ke kasir suku cadang saat tiba di bengkel.
                </p>
              </div>

              {/* Ticket Cutout Line */}
              <div className="relative border-b-2 border-dashed border-zinc-200 bg-zinc-50 py-4 px-6 text-center">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-r border-zinc-200"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-l border-zinc-200"></div>

                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Kode Tiket Suku Cadang (Part)</p>
                <div className="mt-1 flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-black tracking-wider text-emerald-800">{sparePartSuccessData.ticket_no}</span>
                  <button
                    type="button"
                    onClick={copySparePartTicket}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
                    title="Salin Nomor Tiket"
                  >
                    {sparePartCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {sparePartCopied ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-6 space-y-4 text-sm text-zinc-800">
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Nama Pemesan:</span>
                    <span className="font-bold text-zinc-900">{sparePartSuccessData.nama_customer}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Jadwal Pengambilan:</span>
                    <span className="font-bold text-zinc-900">
                      {formatDate(sparePartSuccessData.tanggal_booking)} ({sparePartSuccessData.jam_booking} WIB)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Metode Layanan:</span>
                    <span className="font-bold text-emerald-700">
                      {sparePartSuccessData.metode_layanan === "PASANG" ? "Sekalian Pasang oleh Mekanik AHASS" : "Ambil Sendiri di Toko / Kasir"}
                    </span>
                  </div>
                  {sparePartSuccessData.tipe_motor && (
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                      <span className="text-zinc-500">Tipe Motor:</span>
                      <span className="font-bold text-zinc-900">{sparePartSuccessData.tipe_motor}</span>
                    </div>
                  )}

                  {/* List of items */}
                  <div className="pt-1">
                    <div className="text-xs font-bold text-zinc-700 mb-2">Daftar Suku Cadang ({sparePartSuccessData.items.length} item):</div>
                    <div className="space-y-2">
                      {sparePartSuccessData.items.map((it) => (
                        <div key={it.part_no} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-zinc-200">
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-zinc-900 truncate">{it.nama_umum || it.part_name}</div>
                            <div className="font-mono text-[11px] text-zinc-500">{it.part_no} &bull; {it.quantity} pcs</div>
                          </div>
                          <div className="font-bold text-emerald-700 shrink-0">
                            {formatIDR(it.het * it.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm font-extrabold text-zinc-900 pt-3 border-t border-zinc-200 mt-3">
                      <span>Total Estimasi HET:</span>
                      <span className="text-base text-emerald-800">{formatIDR(sparePartSuccessData.total_harga)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 px-1 pt-1">
                  <span>Email Tiket: <strong className="text-zinc-700">{sparePartSuccessData.email}</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Terdaftar
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-6 pt-0 space-y-3">
                <a
                  href={buildSparePartBookingWaUrl({
                    ticketNo: sparePartSuccessData.ticket_no,
                    nama: sparePartSuccessData.nama_customer,
                    noHp: sparePartSuccessData.no_hp,
                    tipeMotor: sparePartSuccessData.tipe_motor,
                    items: sparePartSuccessData.items,
                    totalHarga: sparePartSuccessData.total_harga,
                    metodeLayanan: sparePartSuccessData.metode_layanan,
                    tanggal: formatDate(sparePartSuccessData.tanggal_booking),
                    jam: sparePartSuccessData.jam_booking,
                    catatan: sparePartForm.detail_lainnya,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
                >
                  <MessageSquare size={20} />
                  Kirim Tiket Suku Cadang ke WhatsApp Admin
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("tracking");
                    setTrackTicketNo(sparePartSuccessData.ticket_no);
                    fetchTrackTicket(sparePartSuccessData.ticket_no);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lacak Status Tiket Ini</span>
                </button>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={resetSparePartForm}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                  >
                    Booking Part Baru
                  </button>
                  <Link
                    href="/katalog"
                    className="w-full text-center rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                  >
                    Kembali ke Katalog
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Reservasi Suku Cadang Resmi AHM</span>
                </div>
                <h1 className="font-display text-3xl font-extrabold [text-wrap:balance] md:text-4xl text-zinc-900">
                  Booking Suku Cadang
                </h1>
                <p className="mt-2 text-base text-zinc-600">
                  Pesan dan amankan suku cadang asli Honda langsung dari bengkel resmi AHASS AS Putra Rahmat. Anda dapat mengambilnya langsung di kasir toko atau meminta dipasangkan oleh mekanik kami.
                </p>
              </header>

              <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
                <form onSubmit={handleSparePartSubmit} className="space-y-8">
                  {/* Step 1: Daftar Suku Cadang */}
                  <Step n={1} title="Suku Cadang yang Dipesan">
                    {inquiryItems.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center bg-white">
                        <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-zinc-900 mb-1">Belum Ada Suku Cadang yang Dipilih</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
                          Jelajahi katalog suku cadang Honda kami dan pilih barang yang Anda butuhkan sebelum mengisi form booking.
                        </p>
                        <Link
                          href="/katalog"
                          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition"
                        >
                          <span>Buka Katalog Suku Cadang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inquiryItems.map((item) => (
                          <div
                            key={item.part_no}
                            className="p-4 rounded-2xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                                {item.gambar_url ? (
                                  <Image
                                    src={item.gambar_url}
                                    alt={item.part_name}
                                    fill
                                    sizes="56px"
                                    className="object-contain p-1"
                                  />
                                ) : (
                                  <span className="text-[9px] font-bold text-zinc-400 text-center leading-tight">
                                    AHM<br />PARTS
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-zinc-900 truncate">
                                  {item.nama_umum || item.part_name}
                                </h4>
                                <div className="text-xs font-mono font-medium text-zinc-500">
                                  {item.part_no}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs font-bold text-emerald-700">
                                    {formatIDR(item.het)} / pcs
                                  </span>
                                  {item.stok === 0 ? (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                      Stok Habis (0)
                                    </span>
                                  ) : item.stok < item.quantity ? (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      Sisa {item.stok} unit
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-zinc-500">
                                      (Tersedia: {item.stok})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                              <div className="flex items-center border border-zinc-300 rounded-lg bg-zinc-50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.part_no, -1)}
                                  className="p-1.5 px-2.5 text-zinc-600 hover:bg-zinc-200 transition-colors"
                                  aria-label="Kurangi jumlah"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-zinc-900 tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.part_no, 1)}
                                  disabled={item.stok > 0 && item.quantity >= item.stok}
                                  className="p-1.5 px-2.5 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={item.stok > 0 && item.quantity >= item.stok ? `Maksimal kuantitas adalah sisa stok (${item.stok})` : "Tambah jumlah"}
                                  aria-label="Tambah jumlah"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-right min-w-[90px]">
                                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Subtotal</div>
                                <div className="text-sm font-extrabold text-zinc-900">
                                  {formatIDR(item.het * item.quantity)}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.part_no)}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus suku cadang"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                          <Link
                            href="/katalog"
                            className="text-xs font-bold text-[#E4002B] hover:underline inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Suku Cadang Lain dari Katalog</span>
                          </Link>
                          <div className="text-xs text-zinc-500">
                            Total Estimasi: <strong className="text-zinc-900 text-sm font-extrabold">{formatIDR(totalEstimate)}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </Step>

                  {/* Step 2: Pilihan Layanan */}
                  <Step n={2} title="Metode Layanan">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setSparePartForm((prev) => ({ ...prev, metode_layanan: "AMBIL" }))}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          sparePartForm.metode_layanan === "AMBIL"
                            ? "border-[#E4002B] bg-red-50/20 ring-2 ring-[#E4002B]/20"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Store className={`w-5 h-5 ${sparePartForm.metode_layanan === "AMBIL" ? "text-[#E4002B]" : "text-zinc-500"}`} />
                          <span className="font-bold text-sm text-zinc-900">Ambil Sendiri di Toko / Kasir</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Ambil langsung di kasir spare part AHASS AS Putra Rahmat Kuningan saat Anda tiba. Tanpa biaya pasang.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSparePartForm((prev) => ({ ...prev, metode_layanan: "PASANG" }))}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          sparePartForm.metode_layanan === "PASANG"
                            ? "border-[#E4002B] bg-red-50/20 ring-2 ring-[#E4002B]/20"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className={`w-5 h-5 ${sparePartForm.metode_layanan === "PASANG" ? "text-[#E4002B]" : "text-zinc-500"}`} />
                          <span className="font-bold text-sm text-zinc-900">Sekalian Pasang oleh Mekanik AHASS</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Pemasangan langsung oleh teknisi resmi Honda di pit servis. Ongkos pasang dibayarkan di bengkel sesuai tarif AHASS.
                        </p>
                      </button>
                    </div>
                  </Step>

                  {/* Step 3: Jadwal Pengambilan */}
                  <Step n={3} title="Jadwal Kedatangan / Pengambilan">
                    <div className="space-y-4">
                      <Field id="sp_tanggal" label="Tanggal Kedatangan / Pengambilan" hint="Pilih tanggal kunjungan ke AHASS (Senin s.d Minggu)">
                        <input
                          type="date"
                          id="sp_tanggal"
                          name="tanggal_booking"
                          min={today}
                          value={sparePartForm.tanggal_booking}
                          onChange={handleSparePartChange}
                          required
                          className={INPUT_CLASS}
                        />
                      </Field>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-800">
                          Pilih Jam Kedatangan
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {sparePartSlots.map(({ slot, disabled }) => {
                            const isSelected = sparePartForm.jam_booking === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={disabled}
                                onClick={() => setSparePartForm((prev) => ({ ...prev, jam_booking: slot }))}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                                  disabled
                                    ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-[#E4002B] text-white border-[#E4002B] shadow-sm"
                                    : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                }`}
                              >
                                {slot} WIB
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Step 4: Identitas Pemesan */}
                  <Step n={4} title="Data Pemesan">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="sp_nama" label="Nama Lengkap Pemesan">
                        <input
                          type="text"
                          id="sp_nama"
                          name="nama_customer"
                          value={sparePartForm.nama_customer}
                          onChange={handleSparePartChange}
                          placeholder="Contoh: Budi Santoso"
                          required
                          className={INPUT_CLASS}
                        />
                      </Field>

                      <Field id="sp_hp" label="Nomor WhatsApp" hint="Untuk konfirmasi stok & notifikasi siap diambil">
                        <input
                          type="tel"
                          id="sp_hp"
                          name="no_hp"
                          value={sparePartForm.no_hp}
                          onChange={handleSparePartChange}
                          placeholder="081234567890"
                          required
                          className={INPUT_CLASS}
                        />
                      </Field>

                      <Field id="sp_email" label="Alamat Email / Gmail" hint="Tiket bukti pemesanan dikirim ke email ini">
                        <input
                          type="email"
                          id="sp_email"
                          name="email"
                          value={sparePartForm.email}
                          onChange={handleSparePartChange}
                          placeholder="nama@gmail.com"
                          required
                          className={INPUT_CLASS}
                        />
                      </Field>

                      <Field id="sp_motor" label="Tipe Motor Honda (Opsional)" hint="Membantu kami memastikan part 100% cocok">
                        <select
                          id="sp_motor"
                          name="tipe_motor"
                          value={sparePartForm.tipe_motor}
                          onChange={handleSparePartChange}
                          className={INPUT_CLASS}
                        >
                          <option value="">Pilih Tipe Motor (Opsional)</option>
                          {HONDA_MOTOR_GROUPS.map((grp) => (
                            <optgroup key={grp.group} label={grp.group}>
                              {grp.items.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field id="sp_catatan" label="Catatan Tambahan (Opsional)">
                          <textarea
                            id="sp_catatan"
                            name="detail_lainnya"
                            rows={2}
                            value={sparePartForm.detail_lainnya}
                            onChange={handleSparePartChange}
                            placeholder="Contoh: Tolong disiapkan lebih awal..."
                            className={INPUT_CLASS}
                          />
                        </Field>
                      </div>
                    </div>
                  </Step>

                  {hasOutOfStockItems && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Suku Cadang Sedang Habis di Bengkel</span>
                      </div>
                      <p className="leading-relaxed">
                        Ada item di daftar Anda yang stoknya saat ini <strong>0 (habis)</strong> atau melebihi persediaan fisik bengkel. Anda tetap bisa memesan secara <strong>Inden Resmi AHM</strong> melalui CS WhatsApp kami.
                      </p>
                      <a
                        href={generateWaUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Pesan Inden Resmi via WhatsApp Sekarang &rarr;</span>
                      </a>
                    </div>
                  )}

                  {sparePartError && (
                    <div ref={sparePartErrorRef} className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{sparePartError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sparePartLoading || inquiryItems.length === 0 || hasOutOfStockItems}
                    className="w-full rounded-xl bg-[#E4002B] py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-[#b00020] transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sparePartLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Reservasi Suku Cadang...</span>
                      </>
                    ) : hasOutOfStockItems ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Stok Tidak Mencukupi (Gunakan Opsi Inden WA di Atas)</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Konfirmasi Booking Suku Cadang</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Sidebar Summary for Spare Part */}
                <aside className="rounded-2xl border border-zinc-200 bg-white p-5 lg:sticky lg:top-[120px] space-y-4">
                  <h2 className="font-display text-lg font-bold">Ringkasan Suku Cadang</h2>
                  <dl className="divide-y divide-zinc-200 text-sm">
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-zinc-600">Jumlah Part</dt>
                      <dd className="font-bold text-zinc-900">{inquiryTotalCount} pcs ({inquiryItems.length} jenis)</dd>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-zinc-600">Metode</dt>
                      <dd className="font-bold text-zinc-900">
                        {sparePartForm.metode_layanan === "PASANG" ? "Pasang di Bengkel" : "Ambil di Kasir"}
                      </dd>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <dt className="text-zinc-600">Jadwal</dt>
                      <dd className="font-bold text-zinc-900 text-right">
                        {sparePartForm.tanggal_booking ? formatDate(sparePartForm.tanggal_booking) : "Belum dipilih"}
                        {sparePartForm.jam_booking ? ` (${sparePartForm.jam_booking} WIB)` : ""}
                      </dd>
                    </div>
                    <div className="py-3 flex justify-between items-baseline">
                      <dt className="text-sm font-bold text-zinc-900">Estimasi Total</dt>
                      <dd className="text-lg font-extrabold text-[#E4002B]">
                        {formatIDR(totalEstimate)}
                      </dd>
                    </div>
                  </dl>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>100% Suku Cadang Asli Honda (AHM Genuine Parts) dengan jaminan keaslian.</span>
                  </div>

                  {/* Location card */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-zinc-900">
                      <MapPin className="w-4 h-4 text-[#E4002B]" />
                      <span>Lokasi Pengambilan AHASS 10870</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mb-2.5 leading-snug">
                      Jl. Siliwangi 126 Kasturi, Sebelah Utara Taman Cirendang, Kuningan, Jawa Barat 45518
                    </p>
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
          )
        )}

        {/* Tab 2: Booking Servis Kendaraan */}
        {activeTab === "servis" && (
          successData ? (
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl transition-all">
            {/* Ticket Header Banner */}
            <div className="bg-gradient-to-r from-[#E4002B] to-[#99001C] p-6 text-white text-center relative">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white">
                <CheckCircle2 size={28} />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-1">
                AHASS AS Putra Motor
              </span>
              <h1 className="font-display text-2xl font-black">Booking Berhasil!</h1>
              <p className="mt-1 text-xs text-red-100">Simpan atau tunjukkan tiket ini saat tiba di bengkel.</p>
            </div>

            {/* Ticket Cutout Line */}
            <div className="relative border-b-2 border-dashed border-zinc-200 bg-zinc-50 py-4 px-6 text-center">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-r border-zinc-200"></div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-l border-zinc-200"></div>
              
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Kode Tiket Servis Motor (Servis)</p>
              <div className="mt-1 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-black tracking-wider text-zinc-900">{successData.ticket_no}</span>
                <button
                  type="button"
                  onClick={copyTicket}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
                  title="Salin Nomor Tiket"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-6 space-y-4 text-sm text-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-xs text-zinc-500 block">Nama Pemilik</span>
                  <span className="font-bold text-zinc-900">{successData.nama_customer}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Motor &amp; Plat</span>
                  <span className="font-bold text-zinc-900">{formData.tipe_motor || "-"} ({formData.plat_kendaraan ? formData.plat_kendaraan.toUpperCase() : "-"})</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Paket Servis</span>
                  <span className="font-bold text-[#E4002B]">{selectedService || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Jadwal Kedatangan</span>
                  <span className="font-bold text-zinc-900">{formatDate(successData.tanggal_booking)} ({formData.jam_booking})</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 px-1 pt-1">
                <span>Email Tiket: <strong className="text-zinc-700">{successData.email}</strong></span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terdaftar
                </span>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="p-6 pt-0 space-y-3">
              <a
                href={buildBookingWaUrl({
                  ticketNo: successData.ticket_no,
                  nama: successData.nama_customer,
                  noHp: formData.no_hp,
                  tipeMotor: formData.tipe_motor,
                  plat: formData.plat_kendaraan,
                  noMesin: formData.no_mesin,
                  paketServis: selectedService,
                  tanggal: formatDate(successData.tanggal_booking),
                  jam: formData.jam_booking,
                  catatan: formData.detail_lainnya,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
              >
                <MessageSquare size={20} />
                Kirim Tiket ke WhatsApp Admin
              </a>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("tracking");
                  setTrackTicketNo(successData.ticket_no);
                  fetchTrackTicket(successData.ticket_no);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Lacak Status Tiket Ini</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                >
                  Buat Booking Baru
                </button>
                <Link
                  href="/"
                  className="w-full text-center rounded-xl border border-zinc-300 bg-white py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                >
                  Kembali ke Beranda
                </Link>
              </div>
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E4002B] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#C20026] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4002B] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
                  {loading ? "Memproses..." : "Konfirmasi Booking"}
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

                {/* Checklist Kedatangan */}
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                  <span className="font-bold text-zinc-800 block mb-1.5">Persiapan ke Bengkel:</span>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Bawa STNK motor (asli/foto)</li>
                    <li>Bawa Buku Servis/Garansi (khusus servis gratis KPB)</li>
                    <li>Tunjukkan nomor tiket ini ke petugas AHASS</li>
                  </ul>
                </div>

                {/* Location & Map Card */}
                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-zinc-900">
                    <MapPin className="w-4 h-4 text-[#E4002B]" />
                    <span>Lokasi AHASS 10870</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mb-2.5 leading-snug">
                    Jl. Siliwangi 126 Kasturi, Sebelah Utara Taman Cirendang, Kuningan, Jawa Barat 45518
                  </p>
                  <div className="h-32 rounded-lg overflow-hidden border border-zinc-200 relative mb-3">
                    <LazyMap heightClass="h-full" title="Peta Lokasi AHASS" />
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
        )
      )}

      {/* Tab 3: Cek Status Tiket Reservasi (Self-Service) */}
      {activeTab === "tracking" && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Form Pencarian Tiket */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 mb-2">
                <Search className="w-3.5 h-3.5" />
                Lacak Mandiri
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
                Cek Status Tiket Reservasi
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                Ketik nomor tiket reservasi servis (SRV-...) atau suku cadang (PRT-...) untuk mengetahui progres konfirmasi bengkel.
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label htmlFor="track_ticket_no" className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                  Nomor Tiket Booking
                </label>
                <div className="relative">
                  <input
                    id="track_ticket_no"
                    type="text"
                    value={trackTicketNo}
                    onChange={(e) => setTrackTicketNo(e.target.value.toUpperCase())}
                    placeholder="Contoh: SRV-20261107-0001 atau PRT-20261107-0001"
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-4 py-3.5 font-mono text-base font-bold uppercase tracking-wider text-zinc-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition"
                    required
                  />
                  {trackTicketNo && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketNo("");
                        setTrackResult(null);
                        setTrackError(null);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
                      title="Hapus input"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={trackLoading || !trackTicketNo.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition active:scale-[0.99]"
              >
                {trackLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memeriksa Tiket...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Periksa Status Tiket</span>
                  </>
                )}
              </button>
            </form>

            {trackError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Tiket Tidak Ditemukan:</span>
                  <p className="text-red-700 leading-relaxed">{trackError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Kartu Hasil Pelacakan Tiket */}
          {trackResult && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header Card Hasil */}
              <div
                className={`p-6 text-white relative ${
                  trackResult.status === "SELESAI"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                    : trackResult.status === "DIKONFIRMASI"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700"
                    : trackResult.status === "DIBATALKAN"
                    ? "bg-gradient-to-r from-zinc-600 to-zinc-800"
                    : "bg-gradient-to-r from-amber-600 to-orange-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-1.5">
                      {trackResult.tipe_booking === "SPAREPART" ? "Suku Cadang Honda" : "Servis Motor AHASS"}
                    </span>
                    <h2 className="font-display text-2xl font-black">
                      Status: {trackResult.status}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-1.5 border border-white/20 text-right">
                    <div className="text-[10px] uppercase font-bold text-white/80">Kode Tiket</div>
                    <div className="font-mono text-lg font-black tracking-wider text-white">
                      {trackResult.ticket_no}
                    </div>
                  </div>
                </div>
              </div>

              {/* Garis Tiket */}
              <div className="relative border-b-2 border-dashed border-zinc-200 bg-zinc-50 py-3 px-6 text-center">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-r border-zinc-200"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-zinc-50 border-l border-zinc-200"></div>
                
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-zinc-900">
                    {trackResult.ticket_no}
                  </span>
                  <button
                    type="button"
                    onClick={copyTrackTicket}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
                    title="Salin Nomor Tiket"
                  >
                    {trackCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {trackCopied ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Rincian Tiket */}
              <div className="p-6 space-y-4 text-sm text-zinc-800">
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Nama Pelanggan:</span>
                    <span className="font-bold text-zinc-900">{trackResult.nama_customer}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Nomor WhatsApp:</span>
                    <span className="font-mono font-bold text-zinc-800">{trackResult.no_hp}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500">Jadwal Kedatangan:</span>
                    <span className="font-bold text-zinc-900">
                      {formatDate(trackResult.tanggal_booking)} ({trackResult.jam_booking} WIB)
                    </span>
                  </div>

                  {trackResult.tipe_booking === "SPAREPART" ? (
                    <>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Metode Pengambilan:</span>
                        <span className="font-bold text-emerald-800">
                          {trackResult.metode_layanan === "PASANG"
                            ? "Sekalian Pasang oleh Mekanik AHASS"
                            : "Ambil di Toko / Kasir Part"}
                        </span>
                      </div>

                      {trackResult.items && trackResult.items.length > 0 && (
                        <div className="pt-1">
                          <div className="text-xs font-bold text-zinc-700 mb-2">
                            Item Suku Cadang ({trackResult.items.length}):
                          </div>
                          <div className="space-y-2">
                            {trackResult.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-zinc-200"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-zinc-900 truncate">
                                    {it.part_name}
                                  </div>
                                  <div className="font-mono text-[11px] text-zinc-500">
                                    {it.part_no} &bull; {it.quantity} pcs
                                  </div>
                                </div>
                                <div className="font-bold text-emerald-700 shrink-0">
                                  {formatIDR((it.het || 0) * (it.quantity || 1))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {trackResult.total_harga ? (
                            <div className="flex items-center justify-between text-sm font-extrabold text-zinc-900 pt-3 border-t border-zinc-200 mt-3">
                              <span>Total Estimasi HET:</span>
                              <span className="text-base text-emerald-800">
                                {formatIDR(trackResult.total_harga)}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Kendaraan:</span>
                        <span className="font-bold text-zinc-900">
                          {trackResult.tipe_motor || "-"} ({trackResult.plat_kendaraan || "-"})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Paket Servis:</span>
                        <span className="font-bold text-[#E4002B]">
                          {trackResult.jenis_servis || "-"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Hubungi WhatsApp CS Bengkel */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER || "6281111116408"}?text=${encodeURIComponent(
                      `Halo Admin AHASS AS Putra, saya ingin menanyakan progres tiket reservasi *${trackResult.ticket_no}* atas nama *${trackResult.nama_customer}*. Mohon informasinya, terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm active:scale-[0.99]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tanya / Konfirmasi ke Admin via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Panduan & Info Tiket */}
          {!trackResult && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 text-xs space-y-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Informasi Nomor Tiket
              </h3>
              <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-zinc-600">
                <li>
                  Nomor tiket diterbitkan otomatis setelah Anda mengisi formulir <strong>Booking Servis</strong> atau <strong>Booking Suku Cadang</strong>.
                </li>
                <li>
                  Format tiket servis motor: <code className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">SRV-YYYYMMDD-XXXX</code>.
                </li>
                <li>
                  Format tiket suku cadang: <code className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-emerald-800">PRT-YYYYMMDD-XXXX</code>.
                </li>
                <li>
                  Bukti tiket dan jadwal kedatangan juga otomatis dikirimkan ke alamat email yang Anda daftarkan saat reservasi.
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#E4002B]" />
            <span>Memuat halaman booking...</span>
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
