import type { MetadataRoute } from "next";

/**
 * robots.txt otomatis — Next.js akan serve di /robots.txt
 * Mengizinkan semua bot crawl, kecuali halaman admin & API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/crm/", "/api/"],
      },
    ],
    sitemap: "https://asputra.vercel.app/sitemap.xml",
  };
}
