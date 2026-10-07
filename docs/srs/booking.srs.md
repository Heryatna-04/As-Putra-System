# SRS: Sistem Booking Servis
- **Related PRD**: `docs/prd/booking.prd.md`
- **Date**: 2026-09-30

---

## 1. Data Models & Schema

### 1.1 Enum Baru

```sql
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
```

### 1.2 Tabel `bookings`

```sql
CREATE TABLE bookings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no     TEXT NOT NULL UNIQUE,           -- Format: ASP-YYYYMMDD-XXXX (auto-generated)
    nama_customer TEXT NOT NULL,
    no_hp         TEXT NOT NULL,                  -- Disimpan plain, di-mask saat response CRM
    plat_kendaraan TEXT NOT NULL,
    merk_motor    TEXT NOT NULL,
    tipe_motor    TEXT NOT NULL,
    keluhan       TEXT NOT NULL,
    tanggal_booking DATE NOT NULL,
    status        booking_status NOT NULL DEFAULT 'PENDING',
    catatan_admin TEXT,                           -- Note internal dari admin/CRM
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_tanggal ON bookings(tanggal_booking);
CREATE INDEX idx_bookings_ticket_no ON bookings(ticket_no);
CREATE INDEX idx_bookings_nama_trgm ON bookings USING GIN (nama_customer gin_trgm_ops);
```

### 1.3 Role Baru di Enum `profile_role`

```sql
-- Alter existing enum untuk tambah CRM
ALTER TYPE profile_role ADD VALUE 'CRM';
```

### 1.4 Trigger `updated_at`

```sql
CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
```

### 1.5 RLS

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- Backend menggunakan Service Role Key → bypass RLS.
-- RLS sebagai defense-in-depth jika ada akses direct client di masa depan.
```

---

## 2. API Contract & Endpoint Spec

### 2.1 Public Routes (No Auth)

#### `POST /api/v1/bookings`
Submit booking oleh customer.

**Request:**
```json
{
  "nama_customer": "Budi Santoso",
  "no_hp": "08123456789",
  "plat_kendaraan": "B 1234 ABC",
  "merk_motor": "Honda",
  "tipe_motor": "Beat 2022",
  "keluhan": "Rem blong, ganti kampas",
  "tanggal_booking": "2025-10-15"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "ticket_no": "ASP-20251015-0042",
    "nama_customer": "Budi Santoso",
    "tanggal_booking": "2025-10-15",
    "status": "PENDING"
  },
  "error": null
}
```

**Validasi:**
- `nama_customer`: required, 2–100 chars
- `no_hp`: required, regex Indonesia (`/^(0|62|\+62)[0-9]{8,12}$/`)
- `plat_kendaraan`: required, max 10 chars
- `merk_motor` / `tipe_motor`: required, max 50 chars
- `keluhan`: required, 5–500 chars
- `tanggal_booking`: required, ISO date, minimal H+1, maksimal H+30

---

### 2.2 Admin Routes (`ADMIN` | `KEPALA_BENGKEL`)

#### `GET /api/v1/admin/bookings`
List semua booking dengan filter & pagination.

**Query Params:**
| Param | Type | Default | Desc |
|---|---|---|---|
| `page` | int | 1 | Halaman |
| `limit` | int | 20 | Per halaman (max 100) |
| `status` | string | — | Filter status |
| `tanggal_from` | date | — | Filter date range mulai |
| `tanggal_to` | date | — | Filter date range akhir |
| `q` | string | — | Search nama customer |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "bookings": [ { ...booking object full... } ],
    "total": 128,
    "page": 1,
    "limit": 20
  },
  "error": null
}
```

#### `GET /api/v1/admin/bookings/:id`
Detail satu booking.

#### `PATCH /api/v1/admin/bookings/:id/status`
Update status booking.

**Request:**
```json
{ "status": "CONFIRMED", "catatan_admin": "Konfirmasi via WA" }
```

---

### 2.3 CRM Routes (`CRM` only)

#### `GET /api/v1/crm/bookings`
Sama seperti admin list, **tapi `no_hp` selalu di-mask** (`0812****5678`).

#### `GET /api/v1/crm/bookings/:id`
Detail booking. `no_hp` tetap di-mask.

> CRM **tidak bisa** PATCH/PUT/DELETE booking maupun akses `/api/v1/admin/*`.

---

## 3. Error Codes & Handling

| Code | HTTP | Kondisi |
|---|---|---|
| `BAD_REQUEST` | 400 | Validasi input gagal |
| `UNAUTHORIZED` | 401 | Token tidak ada / invalid |
| `FORBIDDEN` | 403 | Role tidak punya izin |
| `NOT_FOUND` | 404 | Booking ID tidak ditemukan |
| `RATE_LIMITED` | 429 | Submit booking terlalu sering (max 3 req/menit/IP) |
| `SERVER_ERROR` | 500 | Error internal tanpa expose detail |

---

## 4. UI/UX Interaction Flow

### 4.1 Customer Flow
```
[Halaman Publik / Landing]
       │
       ▼
[Form Booking] ──validate──► [Error inline per field]
       │ submit OK
       ▼
[POST /api/v1/bookings]
       │ 201
       ▼
[Halaman Konfirmasi]
  ┌─────────────────────────┐
  │ ✅ Booking Berhasil!    │
  │ Nomor Tiket: ASP-xxxx   │
  │ Tanggal: 15 Okt 2025    │
  │ Status: Menunggu konfirmasi│
  └─────────────────────────┘
```

### 4.2 Admin Flow (Booking Tab)
```
[Dashboard Admin]
  ├── Tab: Katalog Suku Cadang  (existing)
  └── Tab: Booking              (NEW)
       │
       ▼
  [Tabel Booking] ← filter status, date range, search nama
       │ klik row
       ▼
  [Modal/Drawer Detail Booking]
       │
       ▼
  [Dropdown ubah Status] → PATCH /api/v1/admin/bookings/:id/status
```

### 4.3 CRM Flow
```
[/crm/login]  → JWT auth, role=CRM
       │
       ▼
[/crm/bookings]  Tabel read-only
  - Filter status, date range, search nama
  - no_hp di-mask
  - TIDAK ada tombol ubah status / hapus
```

---

## 5. Ticket Number Generation Logic

Format: `ASP-YYYYMMDD-XXXX` dimana `XXXX` adalah 4-digit urutan booking pada hari tersebut (auto-increment per hari).

```typescript
// Dieksekusi di backend saat INSERT
async function generateTicketNo(date: Date): Promise<string> {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ASP-${dateStr}-`;
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .like('ticket_no', `${prefix}%`);
  const seq = String((count ?? 0) + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}
```

---

## 6. Phone Number Masking

```typescript
function maskPhone(phone: string): string {
  if (phone.length <= 6) return '****';
  return phone.slice(0, 4) + '****' + phone.slice(-4);
}
// "08123456789" → "0812****6789"
```
