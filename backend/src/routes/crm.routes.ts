import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { rbac } from '../middleware/rbac.middleware';

const router = Router();

// Khusus role CRM (bisa juga diakses ADMIN)
router.get('/bookings/export', rbac(['CRM', 'ADMIN', 'KEPALA_BENGKEL']), BookingController.exportExcelCrm);
router.get('/bookings', rbac(['CRM', 'ADMIN', 'KEPALA_BENGKEL']), BookingController.getListCrm);
router.get('/bookings/:id', rbac(['CRM', 'ADMIN', 'KEPALA_BENGKEL']), BookingController.getDetailCrm);

export default router;
