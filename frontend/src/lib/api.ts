import type { CatalogResponse, SparePartDetailResponse, SparePart } from '@/types/spare-part';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-beta-murex-36.vercel.app/api/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvwatrnlqgcnvjtebmr.supabase.co';
const SUPABASE_STORAGE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/spare-parts`;

// In-Memory Category Cache to prevent repeated queries
let categoryCache: {
  success: boolean;
  data: { total: number; categories: { name: string; count: number }[] };
} | null = null;
let lastCategoryFetch = 0;
const CATEGORY_CACHE_TTL = 10 * 60 * 1000; // 10 Minutes Cache

/** Helper format gambar URL */
export function formatPartImage(part: SparePart): SparePart {
  if (part.gambar_url && Array.isArray(part.gambar_urls) && part.gambar_urls.length > 0) {
    return part;
  }

  let gambar_url: string | null = null;
  let gambar_urls: string[] = [];

  if (part.gambar_path) {
    if (part.gambar_path.startsWith('http://') || part.gambar_path.startsWith('https://')) {
      gambar_url = part.gambar_path;
      gambar_urls = [gambar_url];
    } else {
      const cleanPath = part.gambar_path.replace(/^\/+/, '').replace(/^images\/parts\//, '');
      const match = cleanPath.match(/^(.*?)-\d+(\.[a-zA-Z0-9]+)$/);

      if (match) {
        const stem = match[1];
        const ext = match[2];
        const primaryFileName = `${stem}-1${ext}`;
        gambar_url = `${SUPABASE_STORAGE_PUBLIC_URL}/${primaryFileName}`;
        gambar_urls = [1, 2, 3].map((i) => `${SUPABASE_STORAGE_PUBLIC_URL}/${stem}-${i}${ext}`);
      } else {
        gambar_url = `${SUPABASE_STORAGE_PUBLIC_URL}/${cleanPath}`;
        gambar_urls = [gambar_url];
      }
    }
  }

  return {
    ...part,
    gambar_url,
    gambar_urls,
  };
}

/** Fetch data katalog suku cadang dari Express backend API */
export async function fetchCatalog(
  params: Record<string, string>,
  revalidate = 0
): Promise<CatalogResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
  ).toString();

  const fetchOptions: RequestInit = {
    signal: AbortSignal.timeout(8000),
    ...(revalidate === 0 ? { cache: 'no-store' } : { next: { revalidate } }),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/spare-parts?${qs}`, fetchOptions);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json: CatalogResponse = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return {
        ...json,
        data: json.data.map(formatPartImage),
      };
    }
    return json;
  } catch (err) {
    console.error('[API] fetchCatalog error:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Gagal memuat katalog',
      data: [],
      meta: {
        page: parseInt(params.page || '1', 10),
        limit: parseInt(params.limit || '12', 10),
        total: 0,
      },
    };
  }
}

/** Fetch daftar kategori suku cadang */
export async function fetchCategories(): Promise<{
  success: boolean;
  data: {
    total: number;
    categories: { name: string; count: number }[];
  };
}> {
  const now = Date.now();
  if (categoryCache && now - lastCategoryFetch < CATEGORY_CACHE_TTL) {
    return categoryCache;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/spare-parts/categories`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        categoryCache = json;
        lastCategoryFetch = now;
        return json;
      }
    }
  } catch (err) {
    console.error('[API] fetchCategories error:', err);
  }

  return {
    success: false,
    data: {
      total: 0,
      categories: [],
    },
  };
}

/** Fetch detail suku cadang berdasarkan partNo */
export async function fetchSparePartDetail(
  partNo: string
): Promise<SparePartDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/spare-parts/${encodeURIComponent(partNo)}`, {
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (res.status === 404) {
    throw new Error('NOT_FOUND');
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Gagal memuat detail part`);
  }

  const json: SparePartDetailResponse = await res.json();
  if (json.success && json.data) {
    return {
      ...json,
      data: formatPartImage(json.data),
    };
  }

  throw new Error('NOT_FOUND');
}
