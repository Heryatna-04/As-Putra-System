import { Request, Response, NextFunction } from 'express';
import { SparePartService } from '../services/sparePart.service';
import {
  CatalogQuerySchema,
  SparePartCreateSchema,
  SparePartUpdateSchema,
  StockUpdateSchema,
} from '../validators/sparePart.validator';

export const SparePartController = {
  // ─── PUBLIC ──────────────────────────────────────────────────────────────

  async getCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CatalogQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Parameter tidak valid', errors: parsed.error.issues });
        return;
      }

      const result = await SparePartService.getCatalog(parsed.data);
      res.json({ success: true, message: 'Berhasil mengambil katalog', ...result });
    } catch (err) {
      next(err);
    }
  },

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const partNo = String(req.params['partNo']);
      const data = await SparePartService.getByPartNo(partNo);

      if (!data) {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }

      res.json({ success: true, message: 'Berhasil', data });
    } catch (err: any) {
      if (err?.code === 'PGRST116') {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }
      next(err);
    }
  },

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SparePartService.getCategories();
      res.json({ success: true, message: 'Berhasil mengambil daftar kategori', data });
    } catch (err) {
      next(err);
    }
  },

  // ─── ADMIN ───────────────────────────────────────────────────────────────

  async getCatalogAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CatalogQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Parameter tidak valid', errors: parsed.error.issues });
        return;
      }

      const result = await SparePartService.getAllAdmin(parsed.data);
      res.json({ success: true, message: 'Berhasil', ...result });
    } catch (err) {
      next(err);
    }
  },

  async getDetailAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const data = await SparePartService.getByIdAdmin(id);

      if (!data) {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }

      res.json({ success: true, message: 'Berhasil', data });
    } catch (err: any) {
      if (err?.code === 'PGRST116') {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SparePartCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Validasi gagal', errors: parsed.error.issues });
        return;
      }

      const data = await SparePartService.create(parsed.data);
      res.status(201).json({ success: true, message: 'Spare part berhasil dibuat', data });
    } catch (err: any) {
      if (err?.code === '23505') {
        res.status(409).json({ success: false, message: 'Part number sudah ada', errors: [] });
        return;
      }
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const parsed = SparePartUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Validasi gagal', errors: parsed.error.issues });
        return;
      }

      const data = await SparePartService.update(id, parsed.data);
      res.json({ success: true, message: 'Spare part berhasil diperbarui', data });
    } catch (err) {
      next(err);
    }
  },

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const parsed = StockUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Validasi gagal', errors: parsed.error.issues });
        return;
      }

      const user = req.user!;
      const data = await SparePartService.updateStock(id, parsed.data.stok, user.id);
      res.json({ success: true, message: 'Stok berhasil diperbarui', data });
    } catch (err) {
      next(err);
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);

      if (!req.file) {
        res.status(400).json({ success: false, message: 'File gambar wajib diunggah', errors: [] });
        return;
      }

      const part = await SparePartService.getByIdAdmin(id);
      if (!part) {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }

      const data = await SparePartService.uploadImage(id, req.file.buffer, req.file.mimetype, part.part_no);
      res.json({ success: true, message: 'Gambar berhasil diunggah', data });
    } catch (err) {
      next(err);
    }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const data = await SparePartService.deleteImage(id);
      res.json({ success: true, message: 'Gambar berhasil dihapus', data });
    } catch (err) {
      next(err);
    }
  },

  async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const data = await SparePartService.softDelete(id);
      if (!data) {
        res.status(404).json({ success: false, message: 'Spare part tidak ditemukan', errors: [] });
        return;
      }
      res.json({ success: true, message: 'Spare part berhasil dihapus (discontinued)', data });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await SparePartService.getSummary();
      res.json({
        success: true,
        message: 'Berhasil mengambil summary',
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await SparePartService.exportExcel();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Katalog_AS_Putra.xlsx"');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async getStockLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query['page'] as string || '1', 10);
      const limit = parseInt(req.query['limit'] as string || '15', 10);
      const sparePartId = req.query['spare_part_id'] as string | undefined;

      const result = await SparePartService.getStockLogs({ page, limit, sparePartId });
      res.json({
        success: true,
        message: 'Berhasil mengambil riwayat perubahan stok',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
