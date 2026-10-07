# ADR: Architecture & RBAC Isolation untuk Modul Booking Servis
- **Date**: 2026-09-30
- **Status**: Accepted
- **Driver**: Kebutuhan modul Booking publik, Admin terpadu (Katalog + Booking), dan portal CRM terisolasi (hanya Booking read-only).

---

## Context
Sistem AS Putra Motor membutuhkan sistem booking servis dari customer. Data booking harus bisa dilihat oleh:
1. **Admin / Kepala Bengkel**: Mengelola seluruh sistem (Katalog Suku Cadang, Import, dan Booking Servis + update status).
2. **CRM Staff**: Hanya berfokus memantau data booking dan follow-up customer (read-only, nomor telepon di-mask demi privasi, tanpa akses katalog suku cadang).
3. **Customer Publik**: Akses form reservasi tanpa perlu registrasi/login akun.

## Decision

1. **Role & RBAC**:
   - Menambahkan enum value `'CRM'` pada `profile_role` di PostgreSQL.
   - Middleware `rbac(['ADMIN', 'KEPALA_BENGKEL'])` menjaga seluruh route `/api/v1/admin/*`.
   - Middleware khusus `rbac(['CRM'])` (atau fallback role internal) menjaga `/api/v1/crm/*`.
   - Route `/api/v1/bookings` (POST) dibuka untuk umum (Public) dengan IP rate limiting & sanitasi ketat.

2. **Frontend Route Isolation**:
   - `/admin/*`: Tetap menjadi Super Workspace (Dashboard metrik, Manajemen Katalog Suku Cadang, Import, dan Manajemen Booking).
   - `/crm/*`: Halaman dedicated minimalis hanya untuk tabel booking dan monitoring, terisolasi dari nav item katalog.
   - `/booking`: Halaman publik bagi customer untuk input reservasi servis.

3. **Data Protection (Zero-Leak)**:
   - Data `no_hp` dimasker di level backend query/transformer khusus untuk respons CRM (`0812****6789`).
   - Admin tetap melihat nomor utuh untuk keperluan operasional mekanik.

## Consequences & Mitigations
- **Pros**:
  - Prinsip *Least Privilege* terjamin (CRM tidak sengaja mengutak-atik harga atau stok spare part).
  - Codebase konsisten dengan arsitektur Express + Next.js App Router yang sudah ada (Ponytail zero-bloat).
- **Cons & Mitigation**:
  - Perlu migrasi enum database di Supabase (`ALTER TYPE profile_role ADD VALUE 'CRM'`).
