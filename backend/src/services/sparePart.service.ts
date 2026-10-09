import { supabase } from '../config/supabase';
import { CatalogQueryInput, SparePartCreateInput, SparePartUpdateInput } from '../validators/sparePart.validator';
import * as xlsx from 'xlsx';
const BUCKET = 'spare-parts';

let categoryCache: { total: number; categories: { name: string; count: number }[] } | null = null;
let lastCategoryCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export const SparePartService = {
  // ─── PUBLIC ──────────────────────────────────────────────────────────────

  clearCategoryCache() {
    categoryCache = null;
    lastCategoryCacheTime = 0;
  },

  async getCatalog(params: CatalogQueryInput) {
    const { search, category, page, limit, sort, stock_only } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('spare_parts')
      .select('id, part_no, part_name, nama_umum, category_detail, het, stok, gambar_path, status', { count: 'exact' })
      .eq('status', 'ACTIVE');

    if (search) {
      const cleanSearch = search.trim();
      const cleanNoSpace = cleanSearch.replace(/\s+/g, '');
      const terms = cleanSearch.split(/\s+/).filter(Boolean);

      if (terms.length === 1) {
        query = query.or(`part_no.ilike.%${cleanNoSpace}%,part_name.ilike.%${cleanSearch}%,nama_umum.ilike.%${cleanSearch}%`);
      } else {
        // Multi-term AND matching: Every search term must exist in part_no, part_name, or nama_umum
        terms.forEach((t) => {
          const tNoSpace = t.replace(/\s+/g, '');
          query = query.or(`part_no.ilike.%${tNoSpace}%,part_name.ilike.%${t}%,nama_umum.ilike.%${t}%`);
        });
      }
    }

    if (category) {
      query = query.eq('category_detail', category);
    }

    if (stock_only) {
      query = query.gt('stok', 0);
    }

    // Sorting
    switch (sort) {
      case 'name_desc':
      case 'z_a':
        query = query
          .order('nama_umum', { ascending: false, nullsFirst: false })
          .order('part_name', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('het', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('het', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name_asc':
      case 'a_z':
      default:
        query = query
          .order('nama_umum', { ascending: true, nullsFirst: false })
          .order('part_name', { ascending: true, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Generate public image URLs synchronously without per-item storage API calls
    const partsWithUrls = (data ?? []).map((part) => {
      let mainUrl: string | null = null;
      if (part.gambar_path) {
        mainUrl = part.gambar_path.startsWith('http') || part.gambar_path.startsWith('/')
          ? part.gambar_path
          : supabase.storage.from(BUCKET).getPublicUrl(part.gambar_path).data.publicUrl;
      }

      return {
        ...part,
        gambar_url: mainUrl,
        gambar_urls: mainUrl ? [mainUrl] : [],
      };
    });

    return {
      data: partsWithUrls,
      meta: { page, limit, total: count ?? 0 },
    };
  },

  async getByPartNo(partNo: string) {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('part_no', partNo)
      .eq('status', 'ACTIVE')
      .single();

    if (error) throw error;

    let gambar_urls: string[] = [];
    if (data?.part_no) {
      const { data: storageFiles } = await supabase.storage.from(BUCKET).list(data.part_no);
      if (storageFiles && storageFiles.length > 0) {
        gambar_urls = storageFiles.map(
          (f) => supabase.storage.from(BUCKET).getPublicUrl(`${data.part_no}/${f.name}`).data.publicUrl
        );
      }
    }

    const mainUrl = data?.gambar_path
      ? (data.gambar_path.startsWith('http') || data.gambar_path.startsWith('/')
          ? data.gambar_path
          : supabase.storage.from(BUCKET).getPublicUrl(data.gambar_path).data.publicUrl)
      : gambar_urls[0] ?? null;

    if (mainUrl && !gambar_urls.includes(mainUrl)) {
      gambar_urls.unshift(mainUrl);
    }

    return {
      ...data,
      gambar_url: mainUrl,
      gambar_urls,
    };
  },

  async getCategories() {
    const now = Date.now();
    if (categoryCache && now - lastCategoryCacheTime < CACHE_TTL_MS) {
      return categoryCache;
    }

    const { data: parts, error: fetchError } = await supabase
      .from('spare_parts')
      .select('category_detail')
      .eq('status', 'ACTIVE')
      .not('category_detail', 'is', null)
      .range(0, 99999);

    if (fetchError) throw fetchError;

    let totalCount = 0;
    const categoryCounts: Record<string, number> = {};

    (parts ?? []).forEach((part) => {
      totalCount++;
      const cat = part.category_detail;
      if (cat) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    const categories = Object.keys(categoryCounts)
      .map((name) => ({
        name,
        count: categoryCounts[name],
      }))
      .sort((a, b) => b.count - a.count);

    const result = {
      total: totalCount,
      categories,
    };

    categoryCache = result;
    lastCategoryCacheTime = now;

    return result;
  },

  // ─── ADMIN ───────────────────────────────────────────────────────────────

  async getAllAdmin(params: CatalogQueryInput) {
    const { search, category, page, limit, sort, status, stock_only } = params;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('spare_parts')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      const cleanSearch = search.replace(/\s+/g, '');
      query = query.or(`part_no.ilike.%${cleanSearch}%,part_name.ilike.%${search}%,nama_umum.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_detail', category);
    }

    if (stock_only) {
      query = query.gt('stok', 0);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('het', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('het', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('part_name', { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const partsWithUrls = (data ?? []).map((part) => ({
      ...part,
      gambar_url: part.gambar_path
        ? supabase.storage.from(BUCKET).getPublicUrl(part.gambar_path).data.publicUrl
        : null,
    }));

    return {
      data: partsWithUrls,
      meta: { page, limit, total: count ?? 0 },
    };
  },

  async getByIdAdmin(id: string) {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      gambar_url: data?.gambar_path
        ? supabase.storage.from(BUCKET).getPublicUrl(data.gambar_path).data.publicUrl
        : null,
    };
  },

  async create(input: SparePartCreateInput) {
    const { data, error } = await supabase
      .from('spare_parts')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: SparePartUpdateInput) {
    const { data, error } = await supabase
      .from('spare_parts')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStock(id: string, stok: number, userId?: string) {
    // 1. Fetch current stock first
    const { data: currentPart, error: fetchErr } = await supabase
      .from('spare_parts')
      .select('id, part_no, part_name, stok')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const stokSebelum = currentPart.stok;
    const selisih = stok - stokSebelum;
    const tipePerubahan = selisih > 0 ? 'TAMBAH' : selisih < 0 ? 'KURANG' : 'SESUAI';

    // 2. Update stock
    const { data, error } = await supabase
      .from('spare_parts')
      .update({ stok })
      .eq('id', id)
      .select('id, part_no, part_name, stok')
      .single();

    if (error) throw error;

    // 3. Log audit trail if stock changed and userId is available
    if (selisih !== 0 && userId) {
      try {
        await supabase.from('stock_logs').insert([{
          spare_part_id: id,
          changed_by: userId,
          stok_sebelum: stokSebelum,
          stok_sesudah: stok,
          selisih: selisih,
          tipe_perubahan: tipePerubahan,
          keterangan: `Stok ${tipePerubahan.toLowerCase()} sebesar ${Math.abs(selisih)} unit oleh user`,
        }]);
      } catch (logErr) {
        console.error('Gagal mencatat audit log stok:', logErr);
      }
    }

    return data;
  },

  async uploadImage(id: string, fileBuffer: Buffer, mimetype: string, partNo: string) {
    // 1. Fetch current image path first
    const { data: part, error: fetchError } = await supabase
      .from('spare_parts')
      .select('gambar_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Determine new file extension & path
    const ext = mimetype.split('/')[1] ?? 'jpg';
    const filePath = `${partNo}.${ext}`;

    // 3. Upload to Supabase Storage (upsert to overwrite existing if exact same name)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 4. Cleanup old image if the extension (and thus the filePath) is different
    if (part?.gambar_path && part.gambar_path !== filePath) {
      await supabase.storage
        .from(BUCKET)
        .remove([part.gambar_path]);
    }

    // 5. Update gambar_path in DB
    const { data, error: dbError } = await supabase
      .from('spare_parts')
      .update({ gambar_path: filePath })
      .eq('id', id)
      .select('id, part_no, gambar_path')
      .single();

    if (dbError) throw dbError;

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

    return { ...data, gambar_url: publicUrl };
  },

  async deleteImage(id: string) {
    // First get the current gambar_path
    const { data: part, error: fetchError } = await supabase
      .from('spare_parts')
      .select('gambar_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (part?.gambar_path) {
      // Remove from Storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([part.gambar_path]);

      if (storageError) throw storageError;
    }

    // Set gambar_path to null in DB
    const { data, error: dbError } = await supabase
      .from('spare_parts')
      .update({ gambar_path: null })
      .eq('id', id)
      .select('id, part_no, gambar_path')
      .single();

    if (dbError) throw dbError;
    return data;
  },

  async softDelete(id: string) {
    const { data, error } = await supabase
      .from('spare_parts')
      .update({ status: 'DISCONTINUE' })
      .eq('id', id)
      .select('id, part_no, part_name, status')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getSummary() {
    const { count: totalActive } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    const { count: outOfStock } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE').eq('stok', 0);
    const { count: totalDiscontinue } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true }).eq('status', 'DISCONTINUE');

    return {
      totalActive: totalActive ?? 0,
      outOfStock: outOfStock ?? 0,
      totalDiscontinue: totalDiscontinue ?? 0,
    };
  },

  async exportExcel() {
    const { data, error } = await supabase
      .from('spare_parts')
      .select('part_no, part_name, nama_umum, category_detail, het, stok, status')
      .order('part_name', { ascending: true });

    if (error) throw error;

    const worksheet = xlsx.utils.json_to_sheet(data ?? []);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Katalog');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  },

  async getStockLogs(params: { page: number; limit: number; sparePartId?: string }) {
    const { page, limit, sparePartId } = params;
    const offset = (page - 1) * limit;

    try {
      let query = supabase
        .from('stock_logs')
        .select('*, spare_parts(part_no, part_name), profiles(full_name, role)', { count: 'exact' });

      if (sparePartId) {
        query = query.eq('spare_part_id', sparePartId);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) {
        console.warn('stock_logs table query warning:', error.message);
        return { logs: [], total: 0, page, limit, totalPages: 1 };
      }

      return {
        logs: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (err) {
      console.warn('stock_logs error fallback:', err);
      return { logs: [], total: 0, page, limit, totalPages: 1 };
    }
  },
};
