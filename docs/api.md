# API Documentation

## 1. Base URL
`http://localhost:5000/api/v1`

## 2. Authentication
Menggunakan **Bearer Token** dari Supabase Auth (JWT). 
Header: `Authorization: Bearer <access_token>`

## 3. Authorization
Role-based Access Control (RBAC) diimplementasikan pada middleware backend. Role diekstrak dari tabel `profiles` setelah memvalidasi `access_token` melalui Supabase.

## 4. Response Format
**Success Response:**
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    { "field": "part_no", "message": "Part number wajib diisi" }
  ]
}
```

## 5. Role Permission Matrix

| Endpoint | Public | Admin | Kepala Bengkel |
|----------|--------|-------|----------------|
| `GET /spare-parts` | ✅ | ✅ | ✅ |
| `GET /spare-parts/:partNo` | ✅ | ✅ | ✅ |
| `GET /admin/spare-parts` | ❌ | ✅ | ✅ |
| `POST /admin/spare-parts` | ❌ | ✅ | ❌ |
| `GET /admin/spare-parts/:id` | ❌ | ✅ | ✅ |
| `PUT /admin/spare-parts/:id` | ❌ | ✅ | ❌ |
| `PATCH /admin/spare-parts/:id/stock` | ❌ | ✅ | ❌ |
| `POST /admin/spare-parts/:id/image` | ❌ | ✅ | ❌ |
| `DELETE /admin/spare-parts/:id/image`| ❌ | ✅ | ❌ |
| `POST /admin/import/...` (preview) | ❌ | ✅ | ✅ |
| `POST /admin/import/...` (confirm) | ❌ | ✅ | ✅ |
| `GET /admin/imports` | ❌ | ✅ | ✅ |
| `GET /admin/imports/:id` | ❌ | ✅ | ✅ |

*(Catatan: Hak akses Kepala Bengkel dapat disesuaikan lebih lanjut).*

## 6. Public API Endpoints

### 6.1. Get Spare Parts Catalog
`GET /spare-parts`

**Query Parameters:**
- `search`: string (cari `part_no`, `part_name`, `nama_umum`)
- `category`: string
- `page`: integer
- `limit`: integer
- `sort`: string

*Catatan: Hanya akan menampilkan spare parts dengan `status = 'ACTIVE'`.*

### 6.2. Get Spare Part Detail
`GET /spare-parts/:partNo`

Hanya menampilkan spare part ACTIVE.

## 7. Admin API Endpoints

### 7.1. Get All Spare Parts (Admin View)
`GET /admin/spare-parts`

**Query Parameters:**
Sama seperti public API, namun mendukung param `status` (ACTIVE, DISCONTINUE, UNKNOWN).

### 7.2. Create Spare Part Manual
`POST /admin/spare-parts`

**Body:**
```json
{
  "part_no": "12345ABC",
  "part_name": "OIL FILTER",
  "nama_umum": "Filter Oli",
  "category_detail": "MAINTENANCE",
  "het": 45000,
  "stok": 10,
  "status": "ACTIVE"
}
```

### 7.3. Update Spare Part
`PUT /admin/spare-parts/:id`
Melakukan update partial/complete.

### 7.4. Update Stock
`PATCH /admin/spare-parts/:id/stock`

**Body:**
```json
{
  "stok": 15
}
```

### 7.5. Upload Image
`POST /admin/spare-parts/:id/image`
**Content-Type:** `multipart/form-data`
**File field:** `image`

File dinamai dengan format `{PART_NO}.{ext}` dan disimpan ke Supabase Storage. Path akan diupdate ke DB.

### 7.6. Delete Image
`DELETE /admin/spare-parts/:id/image`
Menghapus gambar dari Storage dan mengubah `gambar_path` menjadi null di DB. Data record utama tidak dihapus.

## 8. Import API Endpoints

### 8.1. Import Preview
`POST /admin/import/spare-parts/preview`
**Content-Type:** `multipart/form-data`
**File field:** `file` (Excel)

*Response mengembalikan hasil parser dan validasi sementara untuk di-review oleh user.*

### 8.2. Import Confirm
`POST /admin/import/spare-parts/confirm`

**Body:**
```json
{
  "batch_id": "uuid-dari-preview"
}
```

Proses sinkronisasi/upsert dijalankan di tahap ini tanpa menimpa data buatan internal (seperti nama_umum, stok, gambar).

### 8.3. Get Import History
`GET /admin/imports`
Menampilkan history/batch import.
