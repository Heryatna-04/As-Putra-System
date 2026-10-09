import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../services/import.service';
import { ImportConfirmSchema } from '../validators/sparePart.validator';

export const ImportController = {
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'File Excel wajib diunggah', errors: [] });
        return;
      }

      const userId = req.user!.id;
      const result = await ImportService.previewExcel(req.file.buffer, req.file.originalname, userId);

      res.json({
        success: true,
        message: `Preview berhasil. ${result.valid_rows.length} baris valid, ${result.error_rows.length} baris error.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ImportConfirmSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Validasi gagal', errors: parsed.error.issues });
        return;
      }

      const result = await ImportService.confirmImport(parsed.data.batch_id);
      res.json({
        success: true,
        message: `Import selesai. ${result.inserted_rows} data baru, ${result.updated_rows} data diperbarui.`,
        data: result,
      });
    } catch (err: any) {
      if (err?.message?.includes('sudah diproses')) {
        res.status(400).json({ success: false, message: err.message, errors: [] });
        return;
      }
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ImportService.getImportHistory();
      res.json({ success: true, message: 'Berhasil', data });
    } catch (err) {
      next(err);
    }
  },

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params['id']);
      const data = await ImportService.getImportDetail(id);
      res.json({ success: true, message: 'Berhasil', data });
    } catch (err: any) {
      if (err?.code === 'PGRST116') {
        res.status(404).json({ success: false, message: 'Import batch tidak ditemukan', errors: [] });
        return;
      }
      next(err);
    }
  },
};
