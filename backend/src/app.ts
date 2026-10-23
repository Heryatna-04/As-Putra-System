import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import crmRoutes from './routes/crm.routes';


const app: Application = express();
app.set('trust proxy', 1);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    const frontendUrl = process.env.FRONTEND_URL;
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const allowed = [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://asputra.vercel.app',
    ].filter(Boolean);

    const isAllowedVercel = /^https:\/\/(asputra|as-putra)(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

    if (allowed.includes(origin) || isAllowedVercel) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health & Root Check ──────────────────────────────────────────────────────
app.get(['/api/v1/health', '/v1/health', '/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AS Putra API is running',
  });
});

app.get(['/', '/api/v1', '/v1'], (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AS Putra API Server is running',
    version: '1.1.0',
    status: 'ONLINE',
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use(['/api/v1/auth', '/v1/auth', '/auth'], authRoutes);
app.use(['/api/v1/bookings', '/v1/bookings', '/bookings'], bookingRoutes);
app.use(['/api/v1/crm', '/v1/crm', '/crm'], crmRoutes);
app.use(['/api/v1/admin', '/v1/admin', '/admin'], adminRoutes);
app.use(['/api/v1', '/v1', '/'], publicRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Endpoint tidak ditemukan',
    errors: [],
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint tidak ditemukan',
    },
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      data: null,
      message: 'Ukuran file terlalu besar. Maksimum 10MB.',
      errors: [],
      error: {
        code: 'BAD_REQUEST',
        message: 'Ukuran file terlalu besar. Maksimum 10MB.',
      },
    });
    return;
  }

  // Multer file-type error
  if (err.message?.includes('Tipe file tidak diizinkan')) {
    res.status(400).json({
      success: false,
      data: null,
      message: err.message,
      errors: [],
      error: {
        code: 'BAD_REQUEST',
        message: err.message,
      },
    });
    return;
  }

  const message = err.message ?? 'Terjadi kesalahan tak terduga';
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal Server Error',
    errors: [message],
    error: {
      code: 'SERVER_ERROR',
      message,
    },
  });
});

export default app;
