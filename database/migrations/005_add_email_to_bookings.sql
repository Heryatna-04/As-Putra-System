-- Migration: 005_add_email_to_bookings.sql
-- Description: Add email column to bookings table for customer Gmail/identity proof

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email TEXT;
