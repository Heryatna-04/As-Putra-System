import { Router } from 'express';
import multer from 'multer';
import { SparePartController } from '../controllers/sparePart.controller';
import { ImportController } from '../controllers/import.controller';
import { BookingController } from '../controllers/booking.controller';
import { validateUpdateBookingStatus } from '../validators/booking.validator';
import { rbac } from '../middleware/rbac.middleware';

const router = Router();

// Multer setup — store in memory (buffer), then pass to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if ([...imageTypes, ...excelTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak diizinkan. Gunakan JPEG, PNG, WebP (untuk gambar) atau XLS/XLSX (untuk import).'));
    }
  },
});

// ─── Spare Parts ────────────────────────────────────────────────────────────

// GET /api/v1/admin/summary
router.get('/summary', rbac(['ADMIN', 'KEPALA_BENGKEL']), SparePartController.getSummary);

// GET /api/v1/admin/stock-logs
router.get('/stock-logs', rbac(['ADMIN', 'KEPALA_BENGKEL']), SparePartController.getStockLogs);

// GET /api/v1/admin/spare-parts/export (Must be before /:id)
router.get('/spare-parts/export', rbac(['ADMIN', 'KEPALA_BENGKEL']), SparePartController.exportExcel);

// GET /api/v1/admin/spare-parts
router.get('/spare-parts', rbac(['ADMIN', 'KEPALA_BENGKEL']), SparePartController.getCatalogAdmin);

// POST /api/v1/admin/spare-parts
router.post('/spare-parts', rbac(['ADMIN']), SparePartController.create);

// GET /api/v1/admin/spare-parts/:id
router.get('/spare-parts/:id', rbac(['ADMIN', 'KEPALA_BENGKEL']), SparePartController.getDetailAdmin);

// PUT /api/v1/admin/spare-parts/:id
router.put('/spare-parts/:id', rbac(['ADMIN']), SparePartController.update);

// PATCH /api/v1/admin/spare-parts/:id/stock
router.patch('/spare-parts/:id/stock', rbac(['ADMIN']), SparePartController.updateStock);

// POST /api/v1/admin/spare-parts/:id/image
router.post('/spare-parts/:id/image', rbac(['ADMIN']), upload.single('image'), SparePartController.uploadImage);

// DELETE /api/v1/admin/spare-parts/:id/image
router.delete('/spare-parts/:id/image', rbac(['ADMIN']), SparePartController.deleteImage);

// DELETE /api/v1/admin/spare-parts/:id  (soft-delete — set status = DISCONTINUE)
router.delete('/spare-parts/:id', rbac(['ADMIN']), SparePartController.softDelete);

// ─── Import ─────────────────────────────────────────────────────────────────

// POST /api/v1/admin/import/spare-parts/preview
router.post('/import/spare-parts/preview', rbac(['ADMIN', 'KEPALA_BENGKEL']), upload.single('file'), ImportController.preview);

// POST /api/v1/admin/import/spare-parts/confirm
router.post('/import/spare-parts/confirm', rbac(['ADMIN', 'KEPALA_BENGKEL']), ImportController.confirm);

// GET /api/v1/admin/imports
router.get('/imports', rbac(['ADMIN', 'KEPALA_BENGKEL']), ImportController.getHistory);

// GET /api/v1/admin/imports/:id
router.get('/imports/:id', rbac(['ADMIN', 'KEPALA_BENGKEL']), ImportController.getDetail);

// ─── Bookings ───────────────────────────────────────────────────────────────

// GET /api/v1/admin/bookings/export (Must be before /:id)
router.get('/bookings/export', rbac(['ADMIN', 'KEPALA_BENGKEL']), BookingController.exportExcelAdmin);

// GET /api/v1/admin/bookings
router.get('/bookings', rbac(['ADMIN', 'KEPALA_BENGKEL']), BookingController.getListAdmin);

// PATCH /api/v1/admin/bookings/:id/status
router.patch('/bookings/:id/status', rbac(['ADMIN', 'KEPALA_BENGKEL']), validateUpdateBookingStatus, BookingController.updateStatus);

export default router;
