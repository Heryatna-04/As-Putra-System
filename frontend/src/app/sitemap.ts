import type { MetadataRoute } from "next";
import { fetchCategories } from "@/lib/api";

const SITE_URL = "https://asputra.vercel.app";

/**
 * Sitemap otomatis — Next.js akan serve di /sitemap.xml
 * Google butuh ini untuk crawl semua halaman dan kategori katalog.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
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

  try {
    const categoriesRes = await fetchCategories();
    if (categoriesRes.success && categoriesRes.data?.categories) {
      const categoryRoutes: MetadataRoute.Sitemap = categoriesRes.data.categories.map((c) => ({
        url: `${SITE_URL}/katalog?category=${encodeURIComponent(c.name)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
      return [...staticRoutes, ...categoryRoutes];
    }
  } catch {
    // Fallback to static routes
  }

  return staticRoutes;
}
