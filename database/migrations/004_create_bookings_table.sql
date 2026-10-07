-- Migration: 004_create_bookings_table.sql
-- Description: Create bookings table and add CRM role for AS Putra Motor

-- 1. Tambah nilai role CRM jika belum ada
ALTER TYPE profile_role ADD VALUE IF NOT EXISTS 'CRM';

-- 2. Buat enum status booking
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Bookings
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tanggal ON bookings(tanggal_booking);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_no ON bookings(ticket_no);
CREATE INDEX IF NOT EXISTS idx_bookings_nama_trgm ON bookings USING GIN (nama_customer gin_trgm_ops);

-- 5. Trigger updated_at
DROP TRIGGER IF EXISTS set_timestamp_bookings ON bookings;
CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 6. RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
