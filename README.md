# AS Putra Rahmat - Sistem Informasi & Katalog Spare Part

## Deskripsi
Proyek ini merupakan sistem informasi dan katalog spare part digital untuk AS Putra Rahmat. Sistem ini memiliki 2 layer utama:
1. **Frontend**: Next.js App Router (Katalog publik dan dashboard Admin/Kepala Bengkel).
2. **Backend**: Node.js & Express (REST API Layer).
3. **Database & Auth**: PostgreSQL via Supabase, beserta Supabase Storage untuk penyimpanan gambar fisik.

## Struktur Direktori
- `frontend/` - Aplikasi Next.js
- `backend/` - Aplikasi Express.js (API)
- `database/migrations/` - SQL schema & migrations
- `docs/` - Dokumentasi teknis sistem (Database, API, ERD)

## Teknologi Utama
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Axios/Fetch.
- **Backend**: Node.js, Express.js, TypeScript, Zod.
- **Database**: PostgreSQL (Supabase).
- **Authentication**: Supabase Auth (di validasi oleh Backend).
- **Storage**: Supabase Storage.

## Panduan Menjalankan Sistem

### Persyaratan
- Node.js (>= 18.x)
- Akun Supabase (project dibuat dengan url, anon_key, service_role_key)

### Setup Database
1. Buka Supabase SQL Editor.
2. Jalankan isi file `database/migrations/001_initial_schema.sql`.

### Setup Backend
```bash
cd backend
npm install
# Salin dan isi environment variables
cp .env.example .env
# Menjalankan development server (port 5000)
npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
# Salin dan isi environment variables
cp .env.example .env.local
# Menjalankan development server (port 3000)
npm run dev
```

## TBD (To Be Determined)
- **Nama Umum**: Data nama umum spare part belum seluruhnya tersedia.
- **Tipe Motor**: Belum direlasikan. Informasi compatibility motor menunggu data.
- **Kategori Detail (NEW_MATGROUP)**: Mapping dan filter kategori (termasuk aksesoris) akan dikonfigurasi berdasarkan analisis data yang rilis.
- **Hak Akses Final**: Konfigurasi hak akses Kepala Bengkel vs Admin masih dapat disesuaikan.
- **Status Tampilan Stok**: Keputusan final terkait visibilitas stok ke konsumen publik masih perlu konfirmasi lebih lanjut.
- **Modul Booking Service**: Fitur ini bukan bagian dari MVP/Tahap Pertama dan merupakan modul yang direncanakan untuk masa depan, bergantung pada konfirmasi requirement.

## Rekomendasi Tahap Pengembangan Berikutnya
1. Konfigurasi integrasi Supabase Auth ke dalam Next.js.
2. Implementasi JWT Token verification middleware di backend.
3. Pengembangan parser file Excel (`xlsx` / `SheetJS`) untuk endpoint Preview Import di Backend.
4. Implementasi logic `upsert` pada sinkronisasi Excel di endpoint Confirm Import.
5. Pembuatan UI katalog publik beserta filter trigram search.
