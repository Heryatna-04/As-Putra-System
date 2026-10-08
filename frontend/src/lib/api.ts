import type { CatalogResponse, SparePartDetailResponse, SparePart } from '@/types/spare-part';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvwatrnlqgcnvjtebmr.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdndhdHJubHFnY252anRlYm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI0NzYyMiwiZXhwIjoyMTA1ODIzNjIyfQ.NzXJzhBRyE0XWwh7_ypZDAXs2ZV0KUk4m8ndx9qOSQ4';
const SUPABASE_STORAGE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/spare-parts`;

/** Helper format gambar URL (Point directly to Supabase Storage Public CDN) */
function formatPartImage(part: SparePart): SparePart {
  let gambar_url: string | null = null;

  if (part.gambar_path) {
    if (part.gambar_path.startsWith('http://') || part.gambar_path.startsWith('https://')) {
      gambar_url = part.gambar_path;
    } else {
      const cleanPath = part.gambar_path.replace(/^\/+/, '').replace(/^images\/parts\//, '');
      gambar_url = `${SUPABASE_STORAGE_PUBLIC_URL}/${cleanPath}`;
    }
  }

  return {
    ...part,
    gambar_url,
    gambar_urls: gambar_url ? [gambar_url] : [],
  };
}

/** Fallback fetch langsung ke Supabase PostgREST API (Cloud Native) */
async function fetchCatalogFromSupabase(params: Record<string, string>): Promise<CatalogResponse> {
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
    const search = params.search.trim();
    const cleanNoSpace = search.replace(/\s+/g, '');
    url.searchParams.append('or', `(part_no.ilike.%${cleanNoSpace}%,part_name.ilike.%${search}%,nama_umum.ilike.%${search}%)`);
  }

  // Sorting
  if (params.sort === 'price_asc') {
    url.searchParams.append('order', 'het.asc');
  } else if (params.sort === 'price_desc') {
    url.searchParams.append('order', 'het.desc');
  } else {
    url.searchParams.append('order', 'id.asc');
  }

  // Range limit offset
  url.searchParams.append('offset', offset.toString());
  url.searchParams.append('limit', limit.toString());

  const res = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact',
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Gagal mengambil data dari Supabase');

  const contentRange = res.headers.get('content-range');
  let total = 0;
  if (contentRange) {
    const parts = contentRange.split('/');
    if (parts[1]) total = parseInt(parts[1], 10);
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
      total: total || data.length,
    },
  };
}

export async function fetchCatalog(
  params: Record<string, string>,
  revalidate = 60
): Promise<CatalogResponse> {
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const isLocalhost = BASE_URL.includes('localhost');

  if (isVercel || isLocalhost) {
    try {
      return await fetchCatalogFromSupabase(params);
    } catch {
      // jika gagal, coba backend API
    }
  }

  try {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
    ).toString();

    const res = await fetch(`${BASE_URL}/spare-parts?${qs}`, {
      next: { revalidate },
    });

    if (res.ok) {
      const json: CatalogResponse = await res.json();
      return {
        ...json,
        data: json.data.map(formatPartImage),
      };
    }
  } catch {
    // Fallback ke Supabase jika Express backend lokal mati
  }

  return await fetchCatalogFromSupabase(params);
}

export async function fetchCategories(): Promise<{
  success: boolean;
  data: {
    total: number;
    categories: { name: string; count: number }[];
  };
}> {
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const isLocalhost = BASE_URL.includes('localhost');

  if (!isVercel && !isLocalhost) {
    try {
      const res = await fetch(`${BASE_URL}/spare-parts/categories`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
  }

  // Supabase fallback query
  const url = `${SUPABASE_URL}/rest/v1/spare_parts?select=category_detail&status=eq.ACTIVE&limit=10000`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error('Gagal mengambil data kategori');

  const parts: { category_detail: string }[] = await res.json();
  const categoryCounts: Record<string, number> = {};
  let total = 0;

  parts.forEach((p) => {
    total++;
    if (p.category_detail) {
      categoryCounts[p.category_detail] = (categoryCounts[p.category_detail] || 0) + 1;
    }
  });

  const categories = Object.keys(categoryCounts)
    .map((name) => ({ name, count: categoryCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return {
    success: true,
    data: {
      total,
      categories,
    },
  };
}

export async function fetchSparePartDetail(
  partNo: string
): Promise<SparePartDetailResponse> {
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
  const isLocalhost = BASE_URL.includes('localhost');

  if (!isVercel && !isLocalhost) {
    try {
      const res = await fetch(`${BASE_URL}/spare-parts/${encodeURIComponent(partNo)}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const json: SparePartDetailResponse = await res.json();
        return {
          ...json,
          data: formatPartImage(json.data),
        };
      }
    } catch {
      // Fallback
    }
  }

  // Supabase fallback fetch
  const url = `${SUPABASE_URL}/rest/v1/spare_parts?part_no=eq.${encodeURIComponent(partNo)}&select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Gagal mengambil detail spare part');

  const data: SparePart[] = await res.json();
  if (!data || data.length === 0) throw new Error('NOT_FOUND');

  const part = formatPartImage(data[0]);

  return {
    success: true,
    message: 'OK',
    data: part,
  };
}
