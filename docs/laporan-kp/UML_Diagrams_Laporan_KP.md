# DOKUMENTASI LENGKAP UML (UNIFIED MODELING LANGUAGE)
**SISTEM INFORMASI KATALOG SUKU CADANG & RESERVASI SERVIS MOTOR HONDA**  
**AHASS 10870 AS PUTRA RAHMAT KUNINGAN**  
*Materi Bab IV Laporan Kerja Praktik — FKOM Universitas Kuningan*

---

## 1. USE CASE DIAGRAM

### 1.1 Diagram Use Case Sistem
Diagram use case memodelkan interaksi antara dua aktor utama: **Pelanggan (Customer)** dan **Staf / Admin AHASS**.

```mermaid
flowchart LR
    Customer["Pelanggan (Customer)"]
    Admin["Staf / Admin AHASS"]

    subgraph "Sistem Web Bengkel AS Putra Rahmat"
        UC1["1.0 Lihat Beranda & Profil Bengkel"]
        UC2["2.0 Cari & Filter Katalog Spare Part"]
        UC3["3.0 Kelola Daftar Part (Multi-Part List)"]
        UC4["4.0 Kirim Inquiry Part ke WhatsApp"]
        UC5["5.0 Reservasi Servis (Reguler / KPB)"]
        UC6["6.0 Terima Tiket Booking (ASP-Kode)"]
        UC7["7.0 Login Staf AHASS"]
        UC8["8.0 Kelola Reservasi & Ubah Status"]
        UC9["9.0 Kelola Stok & Impor Excel Part"]
        UC10["10.0 Pantau Riwayat Mutasi Stok (Stock Logs)"]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6

    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
```

---

### 1.2 Deskripsi & Skenario Use Case Utama

#### Skenario 1: Reservasi Servis Online (UC 5.0)
* **Aktor Utama:** Pelanggan
* **Kondisi Awal (Pre-condition):** Pelanggan membuka halaman `/booking`.
* **Kondisi Akhir (Post-condition):** Tiket booking tersimpan di database dan kode tiket unik (`ASP-YYYYMMDD-XXXX`) berhasil diterbitkan.
* **Alur Utama (Main Flow):**
  1. Pelanggan memilih jenis servis: Servis Reguler (Ganti Oli, CVT, Servis Lengkap) atau KPB (Kupon Perawatan Berkala).
  2. Pelanggan memilih tanggal rencana kedatangan.
  3. Sistem memeriksa hari: jika hari Minggu, sistem menonaktifkan slot di atas jam 14:00; jika hari yang sama (*today*), sistem mematikan jam yang telah terlewat.
  4. Pelanggan memilih slot jam yang tersedia.
  5. Pelanggan memasukkan data kendaraan (tipe motor, nopol, no mesin).
  6. Pelanggan mengisi data pemilik (nama lengkap, nomor WhatsApp, email).
  7. Pelanggan mengklik tombol "Konfirmasi Booking".
  8. Sistem memvalidasi input, membuat tiket unik, dan menampilkan voucher tiket di layar serta opsi kirim tiket langsung ke WhatsApp Admin.
* **Alur Alternatif (Alternative Flow):**
  * *4a. Slot penuh atau jam tidak valid:* Sistem menampilkan peringatan dan meminta pelanggan memilih jam lain.
  * *7a. Format email atau nopol keliru:* Sistem menampilkan pesan validasi *inline* berwarna merah.

---

#### Skenario 2: Cari & Konsultasi Multi-Part WA (UC 3.0 & UC 4.0)
* **Aktor Utama:** Pelanggan
* **Kondisi Awal:** Pelanggan membuka halaman `/katalog`.
* **Kondisi Akhir:** Pesan daftar suku cadang tersusun rapi dan terkirim ke WhatsApp AHASS.
* **Alur Utama:**
  1. Pelanggan mencari suku cadang via *search bar* atau filter kategori.
  2. Pelanggan mengklik tombol "+ List" pada suku cadang yang diinginkan.
  3. Sistem menyimpan item ke *local state* dan menampilkan *Floating Bar* di pojok kanan bawah.
  4. Pelanggan membuka laci (*Drawer*) daftar part, lalu mengatur jumlah (*quantity*) kebutuhan.
  5. Pelanggan mengklik "Kirim Daftar Part ke WhatsApp AHASS".
  6. Sistem menyusun teks pesan terformat otomatis berisi nama part, kode part, kuantitas, dan total estimasi HET, lalu membuka aplikasi WhatsApp.

---

## 2. ACTIVITY DIAGRAM

### 2.1 Activity Diagram: Alur Reservasi Servis Online
Menjelaskan langkah kerja sistem dari pemilihan tanggal dan slot hingga tiket berhasil terbit.

```mermaid
flowchart TD
    Start([Mulai]) --> BukaForm[Pelanggan Buka Halaman Booking]
    BukaForm --> PilihPaket[Pilih Paket: Reguler atau KPB]
    PilihPaket --> PilihTanggal[Pilih Tanggal Booking]
    PilihTanggal --> CekHari{Apakah Hari Minggu?}
    
    CekHari -- Ya --> BatasiMinggu[Nonaktifkan Slot Jam > 14:00]
    CekHari -- Tidak --> TampilSemuaSlot[Tampilkan Slot Jam 08:00 - 15:00]
    
    BatasiMinggu --> PilihSlot[Pilih Jam Datang]
    TampilSemuaSlot --> PilihSlot
    
    PilihSlot --> InputMotor[Isi Data Motor & Plat Nomor]
    InputMotor --> InputPemilik[Isi Nama, No WA & Email]
    InputPemilik --> Submit[Klik Konfirmasi Booking]
    
    Submit --> Validasi{Validasi Data Sesuai?}
    Validasi -- Tidak --> TampilError[Tampilkan Pesan Error Validasi]
    TampilError --> InputPemilik
    
    Validasi -- Ya --> SimpanDB[Simpan Data ke Database Supabase]
    SimpanDB --> GenerateTiket[Generate Kode Tiket ASP-YYYYMMDD-XXXX]
    GenerateTiket --> TampilTiket[Tampilkan Voucher Tiket di Layar]
    TampilTiket --> KirimWA[Pelanggan Klik Kirim Tiket ke WA Admin]
    KirimWA --> Selesai([Selesai])
```

---

### 2.2 Activity Diagram: Alur Pencarian & Multi-Part WhatsApp
Menjelaskan cara kerja keranjang sementara suku cadang hingga menghasilkan pesan WhatsApp rekapitulasi.

```mermaid
flowchart TD
    Start([Mulai]) --> BukaKatalog[Pelanggan Buka Halaman /katalog]
    BukaKatalog --> InputCari[Input Kata Kunci / Pilih Kategori]
    InputCari --> QueryPart[Sistem Memfilter Data dari Database]
    QueryPart --> TampilHasil[Tampilkan Daftar Suku Cadang]
    
    TampilHasil --> KlikList[Pelanggan Klik Tombol '+ List']
    KlikList --> SimpanLocal[Simpan ke Storage Keranjang Part]
    SimpanLocal --> UpdateFloating[Update Angka Badge di Floating Bar & Navbar]
    
    UpdateFloating --> MauTambahLagi{Tambah Part Lain?}
    MauTambahLagi -- Ya --> InputCari
    MauTambahLagi -- Tidak --> BukaDrawer[Klik Buka Drawer Kebutuhan Part]
    
    BukaDrawer --> AturQty[Atur Jumlah Barang / Hapus Item]
    AturQty --> HitungTotal[Sistem Hitung Otomatis Total Estimasi HET]
    HitungTotal --> KlikKirimWA[Klik 'Kirim Daftar Part ke WhatsApp AHASS']
    KlikKirimWA --> FormatPesan[Sistem Susun Pesan Teks Terstruktur]
    FormatPesan --> RedirectWA[Buka WhatsApp Web / Aplikasi WA]
    RedirectWA --> Selesai([Selesai])
```

---

### 2.3 Activity Diagram: Alur Pengelolaan Booking oleh Staf Admin
Menjelaskan aktivitas petugas servis di bengkel saat mengonfirmasi kedatangan pelanggan.

```mermaid
flowchart TD
    Start([Mulai]) --> BukaLogin[Admin Buka /admin/login]
    BukaLogin --> InputAuth[Masukkan Email & Password Staf]
    InputAuth --> CekAuth{Autentikasi Berhasil?}
    
    CekAuth -- Tidak --> AlertGagal[Tampilkan 'Email / Password Salah']
    AlertGagal --> InputAuth
    
    CekAuth -- Ya --> MasukPortal[Akses Dashboard /admin/bookings]
    MasukPortal --> LoadList[Ambil Data Booking Hari Ini]
    LoadList --> FilterStatus[Filter Berdasarkan Status / Tanggal]
    
    FilterStatus --> DatangPelanggan[Pelanggan Tiba & Menunjukkan Tiket]
    DatangPelanggan --> CocokkanTiket[Admin Cari Nomor Tiket di Sistem]
    CocokkanTiket --> UbahStatus[Ubah Status: PENDING -> CONFIRMED -> COMPLETED]
    UbahStatus --> CatatLog[Sistem Update Status di Database]
    CatatLog --> Selesai([Selesai])
```

---

## 3. SEQUENCE DIAGRAM

### 3.1 Sequence Diagram: Reservasi Servis Online
Menunjukkan urutan pertukaran pesan antar-objek (*Browser UI*, *Next.js Server / API*, dan *Supabase DB*).

```mermaid
sequenceDiagram
    autonumber
    actor Pelanggan
    participant UI as Browser (Booking Page)
    participant API as Backend API (Express.js)
    participant DB as Supabase PostgreSQL

    Pelanggan->>UI: Buka form booking, pilih jadwal & isi identitas
    Pelanggan->>UI: Klik "Konfirmasi Booking"
    UI->>API: POST /api/v1/bookings (Payload data reservasi)
    API->>API: Validasi format email, nomor HP, tanggal & slot jam
    
    alt Data Tidak Valid
        API-->>UI: 400 Bad Request (Pesan error validasi)
        UI-->>Pelanggan: Tampilkan pesan kesalahan di form
    else Data Valid
        API->>DB: INSERT INTO bookings (ticket_no, nama, motor, slot, status)
        DB-->>API: 201 Created (Data booking tersimpan)
        API-->>UI: 200 OK (ticket_no: ASP-20261025-XXXX)
        UI-->>Pelanggan: Tampilkan Voucher Tiket & Tombol WhatsApp
        Pelanggan->>UI: Klik "Kirim Tiket ke WhatsApp Admin"
        UI-->>Pelanggan: Redirect ke WhatsApp dengan teks tiket siap kirim
    end
```

---

### 3.2 Sequence Diagram: Pencarian Part & Multi-Part WhatsApp
Menunjukkan siklus pengelolaan keranjang konsultasi part tanpa melibatkan pembayaran rumit.

```mermaid
sequenceDiagram
    autonumber
    actor Pelanggan
    participant UI as Katalog UI (Client)
    participant Storage as LocalStorage Browser
    participant WA as WhatsApp Application

    Pelanggan->>UI: Ketik nama part / pilih filter kategori
    UI->>UI: Tampilkan kartu barang dengan harga HET & stok
    Pelanggan->>UI: Klik tombol "+ List" pada barang A dan barang B
    UI->>Storage: Simpan array item [{part_no, het, qty}]
    Storage-->>UI: Data tersimpan
    UI->>UI: Update counter badge di Navbar & Floating Bar
    Pelanggan->>UI: Buka Drawer Kebutuhan Part
    UI->>Storage: Baca data keranjang saat ini
    Storage-->>UI: Return list part & quantity
    UI->>UI: Hitung total estimasi harga HET
    Pelanggan->>UI: Klik "Kirim Daftar Part ke WhatsApp AHASS"
    UI->>UI: Generate prefilled URL wa.me dengan format teks rapi
    UI->>WA: Buka obrolan WA ke CS AHASS AS Putra
    WA-->>Pelanggan: Tampil pesan daftar part terkirim
```

---

## 4. CLASS DIAGRAM

Class diagram memodelkan struktur data dan operasi objek pada sistem:

```mermaid
classDiagram
    class SparePart {
        +UUID id
        +String part_no
        +String part_name
        +String nama_umum
        +String category_detail
        +Integer het
        +Integer stok
        +String gambar_path
        +String status
        +DateTime created_at
        +checkAvailability() Boolean
        +formatPriceIDR() String
    }

    class Booking {
        +UUID id
        +String ticket_no
        +String nama_customer
        +String no_hp
        +String email
        +String tipe_motor
        +String plat_kendaraan
        +String no_mesin
        +String jenis_servis
        +Date tanggal_booking
        +String jam_booking
        +String detail_lainnya
        +String status
        +DateTime created_at
        +generateTicketNo() String
        +updateStatus(newStatus) Void
    }

    class InquiryItem {
        +String part_no
        +String part_name
        +Integer het
        +Integer quantity
        +String gambar_url
        +incrementQty() Void
        +decrementQty() Void
    }

    class User {
        +UUID id
        +String email
        +String role
        +DateTime created_at
        +login(password) Boolean
        +logout() Void
    }

    class StockLog {
        +UUID id
        +UUID part_id
        +Integer delta_stok
        +String tipe_perubahan
        +String keterangan
        +DateTime created_at
        +recordLog() Void
    }

    SparePart "1" <-- "0..*" InquiryItem : "dipilih ke dalam"
    SparePart "1" <-- "0..*" StockLog : "dicatat riwayatnya"
    User "1" --> "0..*" Booking : "mengelola status"
```

---

## 5. DEPLOYMENT DIAGRAM

Diagram deployment menggambarkan arsitektur fisik tempat sistem berjalan:

```mermaid
flowchart TD
    subgraph ClientDevice ["Perangkat Klien (Pengguna & Petugas)"]
        Browser["Web Browser (Chrome / Safari / Edge)<br/>HTML5, Tailwind CSS, React Client UI"]
    end

    subgraph VercelCloud ["Vercel Edge Network (Frontend Server)"]
        NextServer["Next.js 16 (App Router)<br/>Node.js Runtime & Server-Side Rendering"]
    end

    subgraph BackendServer ["API Server (Express.js)"]
        ExpressApp["Express.js RESTful API<br/>Rate Limiting, Validator, Controllers"]
    end

    subgraph SupabaseCloud ["Supabase Managed Cloud"]
        PostgresDB[("PostgreSQL Database<br/>Tables: spare_parts, bookings, stock_logs")]
        StorageBucket["Supabase Storage<br/>Bucket: gambar spare-parts"]
        AuthService["Supabase Auth Engine<br/>JWT Token Verification"]
    end

    subgraph ExternalService ["Layanan Pihak Ketiga"]
        WhatsAppAPI["WhatsApp Web / Deep-link API<br/>(+62 811-1111-6408)"]
        GoogleMaps["Google Maps Embed API"]
    end

    Browser -- "HTTPS / TLS" --> NextServer
    Browser -- "HTTPS / REST" --> ExpressApp
    NextServer -- "Internal Fetch" --> ExpressApp
    ExpressApp -- "pg connection / SSL" --> PostgresDB
    ExpressApp -- "Storage SDK" --> StorageBucket
    ExpressApp -- "Auth SDK" --> AuthService
    Browser -. "Deep-link wa.me" .-> WhatsAppAPI
    Browser -. "Iframe Maps" .-> GoogleMaps
```

---

> [!TIP]
> **Petunjuk Memasukkan ke Microsoft Word:**
> 1. Salin kode Mermaid di atas ke visualizer seperti [Mermaid Live Editor](https://mermaid.live) atau gunakan extension VS Code/Antigravity untuk mengekspornya menjadi format gambar **PNG/SVG**.
> 2. Tempelkan gambar ke dokumen laporan Bab IV dengan penomoran standar, misalnya:  
>    * *Gambar 4.1 Use Case Diagram Sistem Web AHASS AS Putra*  
>    * *Gambar 4.2 Activity Diagram Alur Booking Servis*  
>    * *Gambar 4.3 Sequence Diagram Reservasi Servis*  
>    * *Gambar 4.4 Class Diagram Sistem*  
>    * *Gambar 4.5 Deployment Diagram Sistem Informasi*
