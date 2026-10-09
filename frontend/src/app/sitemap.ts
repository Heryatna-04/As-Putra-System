import type { MetadataRoute } from "next";

const SITE_URL = "https://asputra.vercel.app";

/**
 * Sitemap otomatis — Next.js akan serve di /sitemap.xml
 * Google butuh ini untuk crawl semua halaman.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/katalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
