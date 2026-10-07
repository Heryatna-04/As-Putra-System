import type { CatalogResponse, SparePartDetailResponse } from '@/types/spare-part';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export async function fetchCatalog(
  params: Record<string, string>,
  revalidate = 60
): Promise<CatalogResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
  ).toString();

  const res = await fetch(`${BASE_URL}/spare-parts?${qs}`, {
    next: { revalidate },
  });

  if (!res.ok) throw new Error('Gagal mengambil data katalog');
  return res.json();
}

export async function fetchCategories(): Promise<{
  success: boolean;
  data: {
    total: number;
    categories: { name: string; count: number }[];
  };
}> {
  const res = await fetch(`${BASE_URL}/spare-parts/categories`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Gagal mengambil data kategori');
  return res.json();
}

export async function fetchSparePartDetail(
  partNo: string
): Promise<SparePartDetailResponse> {
  const res = await fetch(`${BASE_URL}/spare-parts/${encodeURIComponent(partNo)}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error('Gagal mengambil detail spare part');
  }
  return res.json();
}
