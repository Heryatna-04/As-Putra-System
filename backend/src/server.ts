import 'dotenv/config'; // Must be first — loads .env before any other import
import app from './app';
import fs from 'fs';
import path from 'path';
import { supabase } from './config/supabase';

const PORT = process.env.PORT || 5000;

app.get('/api/internal-upload-images', async (req, res) => {
  const BUCKET = 'spare-parts';
  const FOLDER_PATH = 'D:\\Kerja Praktik\\Foto Spare-Part';

  if (!fs.existsSync(FOLDER_PATH)) {
    return res.status(400).json({ error: `Folder ${FOLDER_PATH} tidak ada` });
  }

  const files = fs.readdirSync(FOLDER_PATH).filter((file) => {
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

app.listen(PORT, () => {
  console.log(`[SERVER] AS Putra API running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});
