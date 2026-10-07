import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validateCreateBooking } from '../validators/booking.validator';

const router = Router();

// POST /api/v1/bookings
router.post('/', validateCreateBooking, BookingController.create);

export default router;
