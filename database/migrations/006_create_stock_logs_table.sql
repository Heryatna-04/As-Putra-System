-- Migration: 005_create_stock_logs_table.sql
-- Description: Create stock_logs table for audit trail of spare parts inventory changes

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_logs_spare_part ON stock_logs(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_changed_by ON stock_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs(created_at DESC);

-- Enable RLS
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
