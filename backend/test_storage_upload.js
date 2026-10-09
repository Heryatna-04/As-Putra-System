const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esvwatrnlqgcnvjtebmr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdndhdHJubHFnY252anRlYm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI0NzYyMiwiZXhwIjoyMTA1ODIzNjIyfQ.NzXJzhBRyE0XWwh7_ypZDAXs2ZV0KUk4m8ndx9qOSQ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'spare-parts';

async function main() {
  try {
    // 1. Ensure bucket exists & is public
    const { data: buckets, error: getErr } = await supabase.storage.listBuckets();
    if (getErr) console.error('Error listing buckets:', getErr);
    
    const exists = buckets?.some(b => b.name === BUCKET);
    if (!exists) {
      console.log(`Creating public storage bucket '${BUCKET}'...`);
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createErr) console.error('Error creating bucket:', createErr);
      else console.log('Bucket created!');
    } else {
      console.log(`Bucket '${BUCKET}' already exists.`);
    }

    // 2. Test uploading 1 sample image file if exists
    const partsDir = path.resolve(__dirname, '../frontend/public/images/parts');
    if (fs.existsSync(partsDir)) {
      const files = fs.readdirSync(partsDir).filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f));
      console.log(`Found ${files.length} total image files in ${partsDir}`);
      
      if (files.length > 0) {
        const sampleFile = files[0];
        const filePath = path.join(partsDir, sampleFile);
        const buffer = fs.readFileSync(filePath);

        const { data: upData, error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(sampleFile, buffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (upErr) console.error('Sample upload error:', upErr);
        else {
          console.log('Sample upload success:', upData);
          const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(sampleFile);
          console.log('Sample Public URL:', pubData.publicUrl);
        }
      }
    } else {
      console.log('partsDir does not exist at:', partsDir);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

main();
