# Plan: Sistem Booking Servis & Role CRM

- **Related Docs**:
  - PRD: [booking.prd.md](file:///D:/Kerja%20Praktik/Web%20Bengkel%20As%20Putra/as-putra-system/docs/prd/booking.prd.md)
  - SRS: [booking.srs.md](file:///D:/Kerja%20Praktik/Web%20Bengkel%20As%20Putra/as-putra-system/docs/srs/booking.srs.md)
  - ADR: [20260930-booking-rbac.adr.md](file:///D:/Kerja%20Praktik/Web%20Bengkel%20As%20Putra/as-putra-system/docs/adr/20260930-booking-rbac.adr.md)

---

## Target Files

### Database & Backend (Express)
1. **Migration SQL**:
   - `database/migrations/004_create_bookings_table.sql`
2. **Backend Services & Controllers**:
   - `backend/src/validators/booking.validator.ts`
   - `backend/src/services/booking.service.ts`
   - `backend/src/controllers/booking.controller.ts`
   - `backend/src/routes/booking.routes.ts`
   - `backend/src/routes/crm.routes.ts`
   - Update `backend/src/middleware/rbac.middleware.ts` & `auth.middleware.ts` (tambah role `'CRM'`)
   - Wire route di `backend/src/app.ts`

### Frontend (Next.js App Router)
1. **Public Booking**:
   - `frontend/src/app/booking/page.tsx` (Form reservasi customer + konfirmasi tiket)
2. **Admin Booking View**:
   - `frontend/src/app/admin/bookings/page.tsx` (Tabel booking di Admin Workspace + kontrol status)
   - Update `frontend/src/components/admin/AdminSidebar.tsx` (Tambah menu "Booking Servis")
3. **CRM Portal (Dedicated Read-only)**:
   - `frontend/src/app/crm/login/page.tsx`
   - `frontend/src/app/crm/layout.tsx`
   - `frontend/src/app/crm/page.tsx` (Daftar booking customer dengan masking telepon)

---

## Task Checklist

- [ ] **Step 1: Database Migration SQL**
  - Buat file migrasi `004_create_bookings_table.sql` berisi enum status, tabel `bookings`, index, trigger, dan role `CRM`.
- [ ] **Step 2: Backend Implementation**
  - Tambah tipe role `CRM` ke middleware auth & RBAC.
  - Buat validator schema booking (Zod/manual check sanitasi).
  - Buat service booking (create public, list admin full, list CRM masked, update status admin).
  - Buat controller & pasang routing di Express (`/api/v1/bookings`, `/api/v1/admin/bookings`, `/api/v1/crm/bookings`).
- [ ] **Step 3: Frontend Public Booking**
  - Buat halaman `/booking` dengan UI bersih bergaya AS Putra (merah #E8272A, responsif mobile/desktop).
  - Tampilkan modal/alert nomor tiket setelah submit sukses.
- [ ] **Step 4: Frontend Admin Integration**
  - Tambahkan link "Booking Servis" di `AdminSidebar.tsx`.
  - Buat halaman `/admin/bookings` untuk manajemen jadwal servis dan pergantian status.
- [ ] **Step 5: Frontend CRM Portal**
  - Setup `/crm` dengan akses read-only khusus data booking (nomor HP terproteksi/masking).
- [ ] **Step 6: Dev Log & Verification**
  - Catat dev log implementasi di `docs/devlogs/`.
