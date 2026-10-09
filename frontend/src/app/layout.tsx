import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://asputra.vercel.app";
const SITE_NAME = "AS Putra Rahmat Motor - AHASS 10870 Kuningan";
const DEFAULT_DESC =
  "AHASS resmi Honda di Kabupaten Kuningan (kode 10870). Cek stok & harga HET suku cadang asli AHM, booking servis online, mekanik bersertifikat Honda.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — AS Putra Rahmat AHASS Kuningan`,
  },
  description: DEFAULT_DESC,
  keywords: [
    "bengkel Honda Kuningan",
    "AHASS Kuningan",
    "servis motor Honda Kuningan",
    "spare part Honda Kuningan",
    "suku cadang Honda asli",
    "AS Putra Rahmat",
    "booking servis motor Kuningan",
    "dealer Honda Kuningan",
    "HET spare part Honda",
    "AHASS 10870",
    "bengkel resmi Honda Jawa Barat",
    "oli Honda AHM Kuningan",
  ],
  authors: [{ name: "AS Putra Rahmat Motor" }],
  creator: "AS Putra Rahmat Motor",
  publisher: "AS Putra Rahmat Motor",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESC,
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "AS Putra Rahmat Motor - AHASS Honda Kuningan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESC,
    images: [`${SITE_URL}/logo.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${syne.variable} ${inter.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-[#FAFAFA] text-[#0A0A0A]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
