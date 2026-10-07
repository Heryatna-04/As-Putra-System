import { z } from 'zod';

export const SparePartCreateSchema = z.object({
  part_no: z.string().min(1, 'Part number wajib diisi').max(50),
  part_name: z.string().min(1, 'Nama part wajib diisi').max(200),
  nama_umum: z.string().max(200).optional().nullable(),
  category_detail: z.string().max(100).optional().nullable(),
  het: z.number().min(0).optional().nullable(),
  stok: z.number().int().min(0).default(0),
  detail: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISCONTINUE', 'UNKNOWN']).default('ACTIVE'),
});

export const SparePartUpdateSchema = SparePartCreateSchema.partial();

export const StockUpdateSchema = z.object({
  stok: z.number().int().min(0, 'Stok tidak boleh negatif'),
});

export const CatalogQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest']).default('relevance'),
  status: z.enum(['ACTIVE', 'DISCONTINUE', 'UNKNOWN']).optional(),
  stock_only: z.coerce.boolean().optional(),
});

export const ImportConfirmSchema = z.object({
  batch_id: z.string().uuid('batch_id harus berupa UUID yang valid'),
});

export type SparePartCreateInput = z.infer<typeof SparePartCreateSchema>;
export type SparePartUpdateInput = z.infer<typeof SparePartUpdateSchema>;
export type StockUpdateInput = z.infer<typeof StockUpdateSchema>;
export type CatalogQueryInput = z.infer<typeof CatalogQuerySchema>;
export type ImportConfirmInput = z.infer<typeof ImportConfirmSchema>;
