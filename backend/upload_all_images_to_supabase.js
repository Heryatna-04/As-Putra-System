const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esvwatrnlqgcnvjtebmr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdndhdHJubHFnY252anRlYm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI0NzYyMiwiZXhwIjoyMTA1ODIzNjIyfQ.NzXJzhBRyE0XWwh7_ypZDAXs2ZV0KUk4m8ndx9qOSQ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'spare-parts';
const CONCURRENCY = 5;

async function uploadFile(partsDir, fileName) {
  try {
    const filePath = path.join(partsDir, fileName);
    const buffer = fs.readFileSync(filePath);
    
    let contentType = 'image/jpeg';
    if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.webp')) contentType = 'image/webp';
    else if (fileName.endsWith('.svg')) contentType = 'image/svg+xml';

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { status: 'error', error: error.message };
    }

    const partNoMatch = fileName.match(/^([A-Z0-9]+)_/i);
    if (partNoMatch && partNoMatch[1]) {
      const partNo = partNoMatch[1];
      if (fileName.endsWith('-1.jpg') || !fileName.match(/-\d+\.[a-zA-Z0-9]+$/)) {
        await supabase
          .from('spare_parts')
          .update({ gambar_path: fileName })
          .eq('part_no', partNo);
      }
    }

    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

async function main() {
  console.log('=== STARTING SUPABASE BATCH IMAGE UPLOADER (QUARTER BATCHING) ===');
  const partsDir = path.resolve(__dirname, '../frontend/public/images/parts');
  if (!fs.existsSync(partsDir)) {
    console.error('Directory does not exist:', partsDir);
    return;
  }

  const allFiles = fs.readdirSync(partsDir).filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f));
  const total = allFiles.length;
  console.log(`Total image files: ${total}`);

  const quarterSize = Math.ceil(total / 4);
  let successCount = 0;
  let failCount = 0;

  for (let q = 0; q < 4; q++) {
    const start = q * quarterSize;
    const end = Math.min(start + quarterSize, total);
    const quarterFiles = allFiles.slice(start, end);
    if (quarterFiles.length === 0) break;

    console.log(`\n--- Processing Quarter ${q + 1}/4 (Items ${start + 1} - ${end}) ---`);

    for (let i = 0; i < quarterFiles.length; i += CONCURRENCY) {
      const batch = quarterFiles.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(file => uploadFile(partsDir, file)));

      results.forEach(res => {
        if (res.status === 'ok') successCount++;
        else failCount++;
      });

      const currentProgress = start + Math.min(i + CONCURRENCY, quarterFiles.length);
      const pct = ((currentProgress / total) * 100).toFixed(1);
      if (i % 100 === 0 || i + CONCURRENCY >= quarterFiles.length) {
        console.log(`Progress: ${currentProgress}/${total} (${pct}%) | Success: ${successCount} | Failed: ${failCount}`);
      }
    }

    if (q < 3) {
      console.log(`Quarter ${q + 1} complete. Cooling down 1s before next quarter...`);
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  console.log(`\n=== UPLOAD COMPLETE ===`);
  console.log(`Total Success: ${successCount}`);
  console.log(`Total Failed: ${failCount}`);
}

main();
