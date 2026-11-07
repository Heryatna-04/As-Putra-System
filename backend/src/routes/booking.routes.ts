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

// Rate limiter for tracking lookup (max 60 queries per 15 minutes)
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan pengecekan tiket. Silakan coba lagi beberapa saat.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/v1/bookings/track/:ticketNo
router.get('/track/:ticketNo', trackLimiter, BookingController.track);

// POST /api/v1/bookings
router.post('/', bookingLimiter, validateCreateBooking, BookingController.create);

export default router;
