-- Migration: 006_add_tipe_motor_to_bookings.sql
-- Description: Add tipe_motor column to bookings table

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tipe_motor TEXT;
NOTIFY pgrst, 'reload schema';
