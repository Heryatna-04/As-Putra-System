# Entity Relationship Diagram (ERD)

Diagram berikut menjelaskan relasi entitas dalam database AS Putra Rahmat.

```mermaid
erDiagram
    %% Entities
    AUTH_USERS {
        uuid id PK
        string email
        string encrypted_password
    }
    
    PROFILES {
        uuid id PK "FK to AUTH_USERS"
        string full_name
        string role "Enum: ADMIN, KEPALA_BENGKEL"
        datetime created_at
        datetime updated_at
    }
    
    SPARE_PARTS {
        uuid id PK
        string part_no "UNIQUE"
        string part_name
        string nama_umum "NULL"
        string category_detail "NULL"
        numeric het "NULL"
        int stok
        string gambar_path "NULL"
        string detail "NULL"
        string status "Enum: ACTIVE, DISCONTINUE, UNKNOWN"
        datetime created_at
        datetime updated_at
    }
    
    IMPORT_BATCHES {
        uuid id PK
        string file_name
        uuid uploaded_by "FK to PROFILES"
        datetime uploaded_at
        string status "Enum: PREVIEW, PROCESSING, COMPLETED, FAILED"
        int total_rows
        int processed_rows
        int inserted_rows
        int updated_rows
        int skipped_rows
        int error_rows
        string notes "NULL"
        datetime finished_at "NULL"
    }

    %% Relationships
    AUTH_USERS ||--|| PROFILES : "1:1 mapping"
    PROFILES ||--o{ IMPORT_BATCHES : "uploads"
```

## Penjelasan Relasi
- **AUTH_USERS (Supabase Auth)** dikelola secara otomatis oleh Supabase untuk keperluan otentikasi.
- **PROFILES** merupakan ekstensi 1:1 dari `auth.users` untuk menyimpan role dan metadata internal.
- **SPARE_PARTS** merupakan tabel katalog utama. Saat ini tidak memiliki relasi langsung ke entitas lain karena berdiri sebagai master data. Gambar fisik disimpan di Supabase Storage, bukan di PostgreSQL.
- **IMPORT_BATCHES** memiliki relasi N:1 (many-to-one) dengan tabel `PROFILES` (`uploaded_by`), untuk melacak siapa yang melakukan unggahan/import Excel.
