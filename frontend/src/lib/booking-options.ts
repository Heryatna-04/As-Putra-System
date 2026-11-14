/**
 * Shared Honda vehicle catalog groups, booking time slots, and official
 * AHASS service packages used by admin booking creation UI.
 */

export const BOOKING_TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
] as const;

export const ADMIN_REGULAR_SERVICES = [
  "Ganti Oli Mesin Saja",
  "Servis & Bongkar CVT",
  "Paket Ganti Oli + 5 Poin Servis",
  "Paket Servis Ringan",
  "Paket Servis Lengkap",
  "Lainnya",
] as const;

export const ADMIN_KPB_SERVICES = [
  "KPB 1 (1.000 km / 2 Bulan)",
  "KPB 2 (4.000 km / 4 Bulan)",
  "KPB 3 (8.000 km / 8 Bulan)",
  "KPB 4 (12.000 km / 12 Bulan)",
  "KPB 1 (160cc+) (1.000 km / 2 Bulan)",
  "KPB 2 (160cc+) (6.000 km / 6 Bulan)",
  "KPB 3 (160cc+) (12.000 km / 12 Bulan)",
] as const;

export const HONDA_MOTOR_GROUPS: ReadonlyArray<{
  group: string;
  items: readonly string[];
}> = [
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

export const ADMIN_BOOKING_SOURCE_PRESETS = [
  "Walk-in Bengkel",
  "Order via WhatsApp",
  "Order via Telepon",
] as const;
