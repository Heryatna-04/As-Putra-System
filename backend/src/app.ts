import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import crmRoutes from './routes/crm.routes';


const app: Application = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AS Putra API is running',
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/api/internal-upload-images', async (_req: Request, res: Response) => {
  const fs = require('fs');
  const path = require('path');
  const { supabase } = require('./config/supabase');

  const BUCKET = 'spare-parts';
  const FOLDER_PATH = 'D:\\Kerja Praktik\\Foto Spare-Part';

  if (!fs.existsSync(FOLDER_PATH)) {
    return res.status(400).json({ error: `Folder ${FOLDER_PATH} tidak ada` });
  }

  const files = fs.readdirSync(FOLDER_PATH).filter((file: string) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const logs: string[] = [];

  for (const filename of files) {
    const filePath = path.join(FOLDER_PATH, filename);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);

    const rawPartNo = baseName.split(' - ')[0].split(' ')[0].trim();
    const cleanPartNo = rawPartNo.replace(/\s+/g, '');

    const { data: part, error: dbError } = await supabase
      .from('spare_parts')
      .select('id, part_no, gambar_path')
      .or(`part_no.eq.${cleanPartNo},part_no.eq.${rawPartNo}`)
      .limit(1)
      .maybeSingle();

    if (dbError || !part) {
      skippedCount++;
      logs.push(`SKIP: ${filename} (part_no: ${cleanPartNo} not in DB)`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${part.part_no}/${cleanPartNo}_${Date.now()}${ext.toLowerCase()}`;
    const contentType = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType, upsert: true });

    if (uploadError) {
      failCount++;
      logs.push(`FAIL UPLOAD: ${filename} -> ${uploadError.message}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('spare_parts')
      .update({ gambar_path: storagePath })
      .eq('id', part.id);

    if (updateError) {
      failCount++;
      logs.push(`FAIL DB UPDATE: ${filename} -> ${updateError.message}`);
    } else {
      successCount++;
      logs.push(`SUCCESS: ${filename} -> ${part.part_no}`);
    }
  }

  res.json({ totalFiles: files.length, successCount, skippedCount, failCount, logs });
});

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    errors: [],
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      message: 'Ukuran file terlalu besar. Maksimum 10MB.',
      errors: [],
    });
    return;
  }

  // Multer file-type error
  if (err.message?.includes('Tipe file tidak diizinkan')) {
    res.status(400).json({
      success: false,
      message: err.message,
      errors: [],
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: [err.message ?? 'Terjadi kesalahan tak terduga'],
  });
});

export default app;
