# PRD: Sistem Booking Servis
- **Author / Date**: AS Putra Team | 2026-09-30
- **Status**: Approved

---

## 1. Problem Statement & Objectives

Saat ini bengkel AS Putra tidak memiliki sistem antrian digital. Customer harus datang langsung atau menelepon untuk booking servis, menyebabkan:
- Antrian tidak teratur dan tidak terdokumentasi
- Admin/Kepala Bengkel tidak memiliki visibilitas jadwal ke depan
- Tim CRM tidak bisa mengelola follow-up customer secara sistematis

**Objektif**: Membangun modul booking online sederhana yang mengalirkan data dari customer → Admin → CRM.

---

## 2. User Personas & User Stories

### 👤 Customer (Pemilik Kendaraan)
- **As a** customer, **I want to** mengisi form booking servis online, **so that** saya tidak perlu antri/telepon untuk reservasi.
- **As a** customer, **I want to** menerima konfirmasi booking (nomor tiket), **so that** saya punya bukti reservasi.

### 🔧 Admin (Kepala Bengkel / Administrator)
- **As an** admin, **I want to** melihat semua data booking yang masuk di dashboard, **so that** saya bisa merencanakan jadwal bengkel.
- **As an** admin, **I want to** mengubah status booking (Pending → Dikonfirmasi → Selesai → Batal), **so that** saya bisa track progres servis.
- **As an** admin, **I want to** tetap bisa akses modul katalog suku cadang, **so that** semua fungsi terpusat dalam satu workspace.

### 📋 CRM (Staff Customer Relation)
- **As a** CRM staff, **I want to** login ke portal CRM khusus, **so that** saya hanya punya akses ke data booking tanpa bisa ubah katalog.
- **As a** CRM staff, **I want to** filter dan search booking berdasarkan nama/tanggal/status, **so that** saya bisa efisien dalam follow-up.

---

## 3. Functional Scope

### ✅ In Scope
- Form booking publik (tanpa login): nama, nomor HP, plat kendaraan, merk/tipe motor, keluhan/layanan, tanggal pilihan
- Halaman konfirmasi booking dengan nomor tiket unik
- Dashboard Admin: tabel booking + CRUD status booking
- Dashboard Admin: tetap bisa akses modul Katalog & Import (existing)
- Portal CRM: login terpisah, hanya bisa lihat & filter data booking
- Role baru: `CRM` di sistem RBAC

### ❌ Out of Scope
- Payment gateway / pembayaran online
- Notifikasi SMS/email otomatis ke customer
- Slot jadwal terbatas / kapasitas bengkel per hari
- Tracking servis real-time oleh customer
- Mobile app

---

## 4. Non-Functional Requirements (NFR)

| Aspek | Requirement |
|---|---|
| **Performance** | Form submit < 2s response. List booking load < 1.5s |
| **Security** | Form publik: rate-limit + input sanitization. CRM: JWT auth + role check. Admin: existing RBAC |
| **Privacy** | Nomor HP customer tidak boleh tampil plain di CRM list (masking: `0812****5678`) |
| **Scalability** | Schema booking harus support indexing untuk query date-range & status |
| **Accessibility** | Form publik harus bisa diakses di mobile (responsive) |

---

## 5. Acceptance Criteria

- [ ] Customer bisa submit form booking dan menerima nomor tiket di halaman konfirmasi
- [ ] Data booking langsung muncul di tabel Admin tanpa refresh manual
- [ ] Admin bisa ubah status booking: Pending → Dikonfirmasi → Selesai / Batal
- [ ] Admin dashboard tetap memiliki akses penuh ke modul Katalog Suku Cadang
- [ ] Login `/crm/login` terpisah dari `/admin/login`
- [ ] User CRM yang login hanya bisa melihat halaman booking, tidak bisa akses `/admin/*`
- [ ] Nomor HP customer di-mask di tampilan CRM
- [ ] Semua endpoint booking diproteksi dari SQL injection & XSS
