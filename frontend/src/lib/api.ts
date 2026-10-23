import type { CatalogResponse, SparePartDetailResponse, SparePart } from '@/types/spare-part';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend-beta-murex-36.vercel.app/api/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvwatrnlqgcnvjtebmr.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_STORAGE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/spare-parts`;

// In-Memory Category Cache to prevent downloading 44k category rows on every page click
let categoryCache: {
  success: boolean;
  data: { total: number; categories: { name: string; count: number }[] };
} | null = null;
let lastCategoryFetch = 0;
const CATEGORY_CACHE_TTL = 10 * 60 * 1000; // 10 Minutes Cache

/** Helper format gambar URL */
function formatPartImage(part: SparePart): SparePart {
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

/** Fallback fetch langsung ke Supabase PostgREST API (Cloud Native & Ultra Fast) */
async function fetchCatalogFromSupabase(params: Record<string, string>): Promise<CatalogResponse> {
  if (!SUPABASE_KEY) {
    throw new Error("No Supabase key configured");
  }
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '12', 10);
  const offset = (page - 1) * limit;

  const url = new URL(`${SUPABASE_URL}/rest/v1/spare_parts`);
  url.searchParams.append('select', 'id,part_no,part_name,nama_umum,category_detail,het,stok,gambar_path,status');
  url.searchParams.append('status', 'eq.ACTIVE');

  if (params.category) {
    url.searchParams.append('category_detail', `eq.${params.category}`);
  }

  if (params.stock_only) {
    url.searchParams.append('stok', 'gt.0');
  }

  if (params.search) {
    const sanitizedSearch = params.search.replace(/[(),:;"'%_\\]/g, ' ').trim();
    if (sanitizedSearch) {
      const cleanNoSpace = sanitizedSearch.replace(/\s+/g, '');
      url.searchParams.append('or', `(part_no.ilike.%${cleanNoSpace}%,part_name.ilike.%${sanitizedSearch}%,nama_umum.ilike.%${sanitizedSearch}%)`);
    }
  }

  // Sorting
  if (params.sort === 'price_asc') {
    url.searchParams.append('order', 'het.asc');
  } else if (params.sort === 'price_desc') {
    url.searchParams.append('order', 'het.desc');
  } else if (params.sort === 'name_desc' || params.sort === 'z_a') {
    url.searchParams.append('order', 'nama_umum.desc.nullslast,part_name.desc');
  } else if (params.sort === 'newest') {
    url.searchParams.append('order', 'created_at.desc.nullslast,id.desc');
  } else {
    // Default: Sort A to Z by nama_umum (nulls last), then part_name
    url.searchParams.append('order', 'nama_umum.asc.nullslast,part_name.asc');
  }

  // Range limit offset
  url.searchParams.append('offset', offset.toString());
  url.searchParams.append('limit', limit.toString());

  // Use count=planned to avoid slow PostgreSQL exact table scan on 44k rows
  const res = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=planned',
    },
    signal: AbortSignal.timeout(4000),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Gagal mengambil data dari Supabase');

  const contentRange = res.headers.get('content-range');
  let total = 44234; // Fallback total items
  if (contentRange) {
    const parts = contentRange.split('/');
    if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
      total = parseInt(parts[1], 10);
    }
  }

  const rawData: SparePart[] = await res.json();
  const data = rawData.map(formatPartImage);

  return {
    success: true,
    message: 'OK',
    data,
    meta: {
      page,
      limit,
      total: total || 44234,
    },
  };
}

export async function fetchCatalog(
  params: Record<string, string>,
  revalidate = 0
): Promise<CatalogResponse> {
  // 1. Try Backend API first (fully operational on Vercel)
  try {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
    ).toString();

    const fetchOptions: RequestInit = {
      signal: AbortSignal.timeout(4000),
      ...(revalidate === 0 ? { cache: "no-store" } : { next: { revalidate } }),
    };

    const res = await fetch(`${BASE_URL}/spare-parts?${qs}`, fetchOptions);

    if (res.ok) {
      const json: CatalogResponse = await res.json();
      if (json.success && json.data) {
        return {
          ...json,
          data: json.data.map(formatPartImage),
        };
      }
    }
  } catch {
    // Fallback
  }

  // 2. Fallback to Supabase PostgREST if key is available
  if (SUPABASE_KEY) {
    try {
      return await fetchCatalogFromSupabase(params);
    } catch {
      // Fallback
    }
  }

  return {
    success: false,
    message: "Gagal memuat katalog",
    data: [],
    meta: {
      page: parseInt(params.page || "1", 10),
      limit: parseInt(params.limit || "12", 10),
      total: 44234,
    },
  };
}

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

  // 1. Try Backend API first
  try {
    const res = await fetch(`${BASE_URL}/spare-parts/categories`, {
      signal: AbortSignal.timeout(4000),
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
  } catch {
    // Fallback
  }

  // 2. Supabase fallback query using database view category_counts
  if (SUPABASE_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/category_counts?select=*&order=count.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const rows: { category_detail: string; count: number }[] = await res.json();
        let total = 0;
        const categories = (rows ?? []).map((r) => {
          total += Number(r.count || 0);
          return {
            name: r.category_detail,
            count: Number(r.count || 0),
          };
        });

        const result = {
          success: true,
          data: {
            total,
            categories,
          },
        };

        categoryCache = result;
        lastCategoryFetch = now;
        return result;
      }
    } catch {
      // Fallback
    }
  }

  return {
    success: true,
    data: {
      total: 44234,
      categories: [],
    },
  };
}

export async function fetchSparePartDetail(
  partNo: string
): Promise<SparePartDetailResponse> {
  // 1. Try Backend API first
  try {
    const res = await fetch(`${BASE_URL}/spare-parts/${encodeURIComponent(partNo)}`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.ok) {
      const json: SparePartDetailResponse = await res.json();
      if (json.success && json.data) {
        return {
          ...json,
          data: formatPartImage(json.data),
        };
      }
    }
  } catch {
    // Fallback
  }

  // 2. Supabase fallback fetch if key is available
  if (SUPABASE_KEY) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/spare_parts?part_no=eq.${encodeURIComponent(partNo)}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });

      if (res.ok) {
        const data: SparePart[] = await res.json();
        if (data && data.length > 0) {
          const part = formatPartImage(data[0]);
          return {
            success: true,
            message: "OK",
            data: part,
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  throw new Error("NOT_FOUND");
}
