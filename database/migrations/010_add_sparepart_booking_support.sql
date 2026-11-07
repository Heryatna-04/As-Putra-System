-- Migration: 010_add_sparepart_booking_support.sql
-- Description: Add spare part booking support to bookings table

-- 1. Tambah kolom tipe_booking ('SERVIS' vs 'SPAREPART')
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tipe_booking TEXT NOT NULL DEFAULT 'SERVIS';

-- 2. Tambah kolom items_json untuk menyimpan daftar barang suku cadang
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS items_json JSONB;

-- 3. Tambah kolom total_harga untuk estimasi total harga barang
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_harga NUMERIC DEFAULT 0;

-- 4. Tambah kolom metode_layanan ('AMBIL' vs 'PASANG')
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS metode_layanan TEXT DEFAULT 'AMBIL';

-- 5. Buat no_mesin dan plat_kendaraan nullable agar fleksibel untuk pemesanan suku cadang
ALTER TABLE bookings ALTER COLUMN no_mesin DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN plat_kendaraan DROP NOT NULL;

-- 6. Index untuk tipe_booking
CREATE INDEX IF NOT EXISTS idx_bookings_tipe_booking ON bookings(tipe_booking);

NOTIFY pgrst, 'reload schema';
