-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for AS Putra Rahmat

-- Enable pg_trgm for trigram based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types for status
CREATE TYPE spare_part_status AS ENUM ('ACTIVE', 'DISCONTINUE', 'UNKNOWN');
CREATE TYPE import_batch_status AS ENUM ('PREVIEW', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE profile_role AS ENUM ('ADMIN', 'KEPALA_BENGKEL');

-- TABLE: profiles
-- Stores internal users profiles and roles. Linked to auth.users.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role profile_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: spare_parts
-- The main catalog of spare parts.
CREATE TABLE spare_parts (
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

-- Indexes for spare_parts
CREATE INDEX idx_spare_parts_part_no ON spare_parts(part_no);
CREATE INDEX idx_spare_parts_status ON spare_parts(status);
CREATE INDEX idx_spare_parts_part_name_trgm ON spare_parts USING GIN (part_name gin_trgm_ops);
CREATE INDEX idx_spare_parts_nama_umum_trgm ON spare_parts USING GIN (nama_umum gin_trgm_ops);
CREATE INDEX idx_spare_parts_category_detail ON spare_parts(category_detail);

-- TABLE: import_batches
-- Stores history of Excel import processes.
CREATE TABLE import_batches (
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

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_spare_parts
BEFORE UPDATE ON spare_parts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ROW LEVEL SECURITY (RLS) Configuration

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- Note: Because we use Express backend as the API layer with Service Role Key, 
-- these RLS policies are mainly for defense in depth and future direct-client queries. 
-- The backend uses Service Role to bypass these if needed, or passes user context.

-- RLS for spare_parts
-- Anyone (including anonymous) can read ACTIVE spare_parts.
CREATE POLICY "Public can read ACTIVE spare parts" 
ON spare_parts FOR SELECT 
USING (status = 'ACTIVE');

-- Note: Admin/Kepala Bengkel permissions are enforced in the Express API layer via roles.
-- If the API uses Service Role Key, it bypasses RLS anyway. 
-- If the API passes user JWT to Supabase (e.g. using set_config), more policies can be added.
