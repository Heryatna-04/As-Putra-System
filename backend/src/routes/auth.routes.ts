import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 failed login attempts per IP
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/login
router.post('/login', loginLimiter, AuthController.login);
router.get('/login', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Endpoint login menggunakan HTTP POST dengan body JSON: { email, password }',
  });
});

// POST /api/v1/auth/refresh
router.post('/refresh', AuthController.refresh);

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, AuthController.logout);

// GET /api/v1/auth/me
router.get('/me', authMiddleware, AuthController.me);

export default router;
