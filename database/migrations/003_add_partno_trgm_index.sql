-- Migration: 003_add_partno_trgm_index.sql
-- Description: Add GIN Trigram index on part_no for faster ilike wildcard searches

CREATE INDEX IF NOT EXISTS idx_spare_parts_part_no_trgm 
ON spare_parts USING GIN (part_no gin_trgm_ops);
