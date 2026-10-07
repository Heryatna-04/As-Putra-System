export interface SparePart {
  id: string;
  part_no: string;
  part_name: string;
  nama_umum: string | null;
  category_detail: string | null;
  het: number | null;
  stok: number;
  gambar_path: string | null;
  gambar_url: string | null;
  gambar_urls?: string[];
  status: 'ACTIVE' | 'DISCONTINUE' | 'UNKNOWN';
  detail: string | null;
  created_at?: string;
}

export interface CatalogMeta {
  page: number;
  limit: number;
  total: number;
}

export interface CatalogResponse {
  success: boolean;
  message: string;
  data: SparePart[];
  meta: CatalogMeta;
}

export interface SparePartDetailResponse {
  success: boolean;
  message: string;
  data: SparePart;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';
