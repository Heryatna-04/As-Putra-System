import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Servis Motor Honda Online | Tanpa Antre",
  description:
    "Booking servis motor Honda online di AHASS AS Putra Rahmat Kuningan. Pilih tanggal & jam, tiket langsung dikirim ke email. Tersedia paket ganti oli, CVT, servis berkala (KPB).",
  alternates: {
    canonical: "https://asputra.vercel.app/booking",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
