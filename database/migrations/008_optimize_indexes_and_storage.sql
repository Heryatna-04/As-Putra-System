-- Migration: 008_optimize_indexes_and_storage.sql
-- Description: Add GIN Trigram index on bookings.plat_kendaraan and ensure spare-parts storage bucket configuration

-- 1. Index trigram untuk pencarian cepat plat kendaraan customer di Admin/CRM
CREATE INDEX IF NOT EXISTS idx_bookings_plat_kendaraan_trgm 
ON bookings USING GIN (plat_kendaraan gin_trgm_ops);

-- 2. Konfigurasi storage bucket 'spare-parts' untuk foto suku cadang
INSERT INTO storage.buckets (id, name, public) 
VALUES ('spare-parts', 'spare-parts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policy agar file gambar suku cadang dapat dibaca publik tanpa auth
DO $$ BEGIN
    CREATE POLICY "Public Access spare-parts bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'spare-parts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

NOTIFY pgrst, 'reload schema';
