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

export const metadata: Metadata = {
  title: "AS Putra Rahmat — E-Katalog Suku Cadang Honda",
  description: "Katalog resmi suku cadang dan spare part asli motor Honda di AS Putra Rahmat.",
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
