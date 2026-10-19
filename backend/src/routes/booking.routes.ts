import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { BookingController } from '../controllers/booking.controller';
import { validateCreateBooking } from '../validators/booking.validator';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10, // Max 10 bookings per IP within 30 minutes
  message: {
    success: false,
    message: 'Terlalu banyak permintaan reservasi dari IP ini. Silakan coba lagi setelah 30 menit.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/bookings
router.post('/', bookingLimiter, validateCreateBooking, BookingController.create);

export default router;
