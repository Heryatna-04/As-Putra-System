# Database Documentation

## 1. Tujuan Database
Database ini dirancang untuk melayani Sistem Informasi AS Putra Rahmat, terutama sebagai sumber data untuk Katalog Digital Spare Part. Menggunakan PostgreSQL (Supabase) sebagai sistem database.

## 2. Arsitektur Data
- **PostgreSQL via Supabase** digunakan sebagai RDBMS utama.
- **Supabase Auth** menangani autentikasi dan menyimpan tabel `auth.users`.
- **Supabase Storage** digunakan untuk menyimpan gambar fisik dari spare part.
- Backend (Node.js/Express) akan menjadi perantara antara frontend dan database.

## 3. Tabel

### 3.1. `profiles`
Menyimpan profil tambahan dan role pengguna internal.

| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | ID User dari Supabase Auth |
| `full_name` | TEXT | NOT NULL | Nama Lengkap User |
| `role` | profile_role | NOT NULL | Enum: ADMIN, KEPALA_BENGKEL |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu pembuatan |
| `updated_at`| TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu update terakhir |

### 3.2. `spare_parts`
Menyimpan katalog master spare part.

| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique ID internal |
| `part_no` | TEXT | NOT NULL, UNIQUE | Kode part unik (String agar format tidak rusak) |
| `part_name` | TEXT | NOT NULL | Nama teknis spare part |
| `nama_umum` | TEXT | NULL | Nama panggilan umum (opsional) |
| `category_detail` | TEXT | NULL | Asal dari `NEW_MATGROUP` Excel |
| `het` | NUMERIC(14,2) | NULL, CHECK (het >= 0) | Harga Eceran Tertinggi |
| `stok` | INTEGER | NOT NULL, DEFAULT 0, CHECK (stok >= 0) | Jumlah stok (manual oleh admin) |
| `gambar_path` | TEXT | NULL | Path gambar di Storage (spare-parts/part_no.ext) |
| `detail` | TEXT | NULL | Keterangan tambahan |
| `status` | spare_part_status | NOT NULL, DEFAULT 'ACTIVE' | Enum: ACTIVE, DISCONTINUE, UNKNOWN |
| `created_at`| TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | - |
| `updated_at`| TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | - |

### 3.3. `import_batches`
Menyimpan riwayat dan status import Excel.

| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID Batch |
| `file_name` | TEXT | NOT NULL | Nama file Excel |
| `uploaded_by` | UUID | NOT NULL, REFERENCES profiles(id) | Uploader |
| `uploaded_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu upload |
| `status` | import_batch_status| NOT NULL | Enum: PREVIEW, PROCESSING, COMPLETED, FAILED |
| `total_rows` | INTEGER | NOT NULL, DEFAULT 0 | Jumlah baris dlm file |
| `processed_rows`| INTEGER | NOT NULL, DEFAULT 0 | Baris diproses |
| `inserted_rows`| INTEGER | NOT NULL, DEFAULT 0 | Data baru |
| `updated_rows`| INTEGER | NOT NULL, DEFAULT 0 | Data di-update |
| `skipped_rows`| INTEGER | NOT NULL, DEFAULT 0 | Data terlewat |
| `error_rows` | INTEGER | NOT NULL, DEFAULT 0 | Data error |
| `notes` | TEXT | NULL | Catatan tambahan |
| `finished_at` | TIMESTAMPTZ | NULL | Waktu selesai import |

## 4. Constraint & Index
- `spare_parts(part_no)` memiliki index UNIQUE.
- Trigram index (`gin_trgm_ops`) diterapkan pada `part_name` dan `nama_umum` untuk mempercepat pencarian teks.
- Enum `spare_part_status` membatasi status hanya untuk `ACTIVE`, `DISCONTINUE`, dan `UNKNOWN`.

## 5. Row Level Security (RLS)
- Diaktifkan untuk tabel-tabel utama.
- Publik hanya dapat membaca data dari `spare_parts` jika `status = 'ACTIVE'`.
- Sebagian besar operasi read/write lainnya akan dilewati (bypassed) oleh Node.js backend yang menggunakan `SUPABASE_SERVICE_ROLE_KEY`. Jangan expose kunci ini ke client. Role-based Access Control (RBAC) ditegakkan di layer API Express.

## 6. Storage
Gambar disimpan di bucket Supabase Storage, bukan di PostgreSQL. Path gambar disimpan di field `gambar_path`.

## 7. Import Excel & Data Synchronization
- Import Excel menggunakan operasi sinkronisasi (Upsert/Selective Update).
- Kolom yang dikelola secara manual seperti `nama_umum`, `stok`, dan `gambar_path` **TIDAK** ditimpa (overwrite) oleh proses import Excel.
- Data yang tidak ada lagi di Excel terbaru tidak boleh dihapus secara otomatis. Statusnya disesuaikan berdasarkan aturan bisnis.

## 8. Data Retention
- Data discontinue akan tetap disimpan di database dengan flag `status = 'DISCONTINUE'` untuk referensi historis.

## 9. Future Enhancement
- TBD: Implementasi modul Booking Service, termasuk tabel relasi model/tipe motor dan compatibility untuk spare part. Modul ini belum dirancang sekarang.
