-- ==============================================================================
-- MASTER DATABASE SCHEMA: AS PUTRA RAHMAT KUNINGAN (AHASS 10870)
-- Target Engine: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. CUSTOM TYPES / ENUMS
DO $$ BEGIN
    CREATE TYPE profile_role AS ENUM ('ADMIN', 'KEPALA_BENGKEL', 'CRM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
ALTER TYPE profile_role ADD VALUE IF NOT EXISTS 'CRM';

DO $$ BEGIN
    CREATE TYPE spare_part_status AS ENUM ('ACTIVE', 'DISCONTINUE', 'UNKNOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_batch_status AS ENUM ('PREVIEW', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UTILITY FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLE: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role profile_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_timestamp_profiles ON profiles;
CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 5. TABLE: spare_parts
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_no TEXT NOT NULL UNIQUE,
    part_name TEXT NOT NULL,
    nama_umum TEXT,
    category_detail TEXT,
    het NUMERIC(14,2) CHECK (het >= 0 OR het IS NULL),
    stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    gambar_path TEXT,
    detail TEXT,
    status spare_part_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_timestamp_spare_parts ON spare_parts;
CREATE TRIGGER set_timestamp_spare_parts
BEFORE UPDATE ON spare_parts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Indexes for spare_parts
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_no ON spare_parts(part_no);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON spare_parts(status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_detail ON spare_parts(category_detail);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_no_trgm ON spare_parts USING GIN (part_no gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_name_trgm ON spare_parts USING GIN (part_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_spare_parts_nama_umum_trgm ON spare_parts USING GIN (nama_umum gin_trgm_ops);

-- 6. TABLE: import_batches
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status import_batch_status NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    inserted_rows INTEGER NOT NULL DEFAULT 0,
    updated_rows INTEGER NOT NULL DEFAULT 0,
    skipped_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    finished_at TIMESTAMPTZ
);

-- 7. TABLE: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no TEXT NOT NULL UNIQUE,
    nama_customer TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    no_mesin TEXT NOT NULL,
    plat_kendaraan TEXT NOT NULL,
    tanggal_booking DATE NOT NULL,
    jam_booking TEXT NOT NULL,
    jenis_servis TEXT NOT NULL,
    detail_lainnya TEXT,
    status booking_status NOT NULL DEFAULT 'PENDING',
    catatan_admin TEXT,
    email TEXT,
    tipe_motor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_timestamp_bookings ON bookings;
CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tanggal ON bookings(tanggal_booking);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_no ON bookings(ticket_no);
CREATE INDEX IF NOT EXISTS idx_bookings_nama_trgm ON bookings USING GIN (nama_customer gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bookings_plat_kendaraan_trgm ON bookings USING GIN (plat_kendaraan gin_trgm_ops);

-- 8. TABLE: stock_logs
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    stok_sebelum INTEGER NOT NULL,
    stok_sesudah INTEGER NOT NULL,
    selisih INTEGER NOT NULL,
    tipe_perubahan TEXT NOT NULL, -- 'TAMBAH', 'KURANG', 'MANUAL', 'IMPORT'
    keterangan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stock_logs
CREATE INDEX IF NOT EXISTS idx_stock_logs_spare_part ON stock_logs(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_changed_by ON stock_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs(created_at DESC);

-- 9. VIEW: category_counts
CREATE OR REPLACE VIEW category_counts AS
SELECT category_detail, COUNT(*) as count
FROM spare_parts
WHERE status = 'ACTIVE' AND category_detail IS NOT NULL
GROUP BY category_detail;

GRANT SELECT ON category_counts TO anon, authenticated;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Publik dapat membaca suku cadang yang aktif
DO $$ BEGIN
    CREATE POLICY "Public can read ACTIVE spare parts" 
    ON spare_parts FOR SELECT 
    USING (status = 'ACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 11. STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public) 
VALUES ('spare-parts', 'spare-parts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
    CREATE POLICY "Public Access spare-parts bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'spare-parts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

NOTIFY pgrst, 'reload schema';
