# Thriftpedia

REST API backend untuk toko barang bekas (thrift) dengan aturan satu barang, satu stok.

Thriftpedia adalah backend REST API untuk toko thrift di mana **setiap barang bersifat unik dan hanya memiliki satu stok**. Aturan intinya: ketika dua pembeli membeli barang yang sama secara bersamaan, hanya satu pembelian yang berhasil, sedangkan yang lain ditolak.

API ini menyediakan:

- **Autentikasi**: register dan login, password di-hash dengan bcrypt, token JWT.
- **Akses berbasis role**: `ADMIN` dan `BUYER`.
- **Manajemen produk**: CRUD produk oleh admin.
- **Order / pembelian**: dengan perlindungan single-stock dan alur status oleh admin.
- **Wishlist**: buyer menyimpan produk yang diminati.
- **Review**: hanya boleh diberikan setelah order berstatus `COMPLETED`.

**Cakupan: Milestone 1 — Backend.** Folder `client/` masih berupa placeholder untuk milestone berikutnya.

## Kelompok & Anggota

Nama kelompok: **Thriftpedia** <!-- TODO: nomor kelompok -->

| Nama | NIM | Peran | Modul Backend | Branch |
|---|---|---|---|---|
| Nayla Thalita | 24/535820/TK/59467 | Ketua | Wishlist, Review & API Security (error handling, role middleware, tests) | `535820` |
| Akio Afifian Ahsan | 24/542230/TK/60198 | Anggota | Order & Single-Stock (purchase, concurrency, admin status flow, order tests) | `542230` |
| Zahra Elfatima | 24/535709/TK/59448 | Anggota | Product Management (CRUD + validation) | `535709` |
| Rida Larasati | 24/539400/TK/59821 | Anggota | Authentication & User (register, login, bcrypt, JWT) | `539400` |

## Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|---|---|---|
| Node.js | 20 (CI), minimal 20.19 | Runtime JavaScript (Mongoose 9 membutuhkan Node >= 20.19) |
| Express | ^5.2.1 | Framework HTTP dan routing REST API |
| MongoDB | — | Database dokumen |
| Mongoose | ^9.10.0 | ODM: schema, model, dan query MongoDB |
| bcrypt | ^6.0.0 | Hashing password |
| jsonwebtoken (JWT) | ^9.0.3 | Pembuatan dan verifikasi token autentikasi |
| dotenv | ^18.0.4 | Memuat environment variable dari `.env` |
| `node:test` | bawaan Node.js | Test runner (`npm test`) |
| supertest | ^7.3.0 | Pengujian endpoint HTTP |
| mongodb-memory-server | ^11.3.0 | MongoDB in-memory untuk pengujian |
| Postman | — | Pengujian API |
| Git & GitHub | — | Version control, alur feature branch + Pull Request |
| GitHub Actions | — | Continuous integration |

## Struktur Folder & File

```text
Thriftpedia/
├── .github/workflows/    ci github actions (client & server)
├── client/               placeholder frontend (milestone berikutnya)
├── server/               backend rest api (express + mongodb)
│   ├── src/
│   │   ├── app.js        setup express, mount semua router
│   │   ├── server.js     entry point: load .env, koneksi db, listen
│   │   ├── config/       koneksi mongodb
│   │   ├── constants/    role, status produk, status & transisi order
│   │   ├── models/       User, Product, Order, Wishlist, Review
│   │   ├── routes/       definisi endpoint per modul
│   │   ├── middleware/   auth (jwt), role, error handler
│   │   ├── validators/   validasi input per modul
│   │   ├── controllers/  terima request, kirim response
│   │   ├── services/     business logic (single-stock, eligibility)
│   │   └── utils/        AppError
│   ├── test/             unit test validasi & index model
│   ├── tests/            integration test order + helper (db, token)
│   ├── scripts/          demo pembelian bersamaan (concurrency)
│   ├── docs/             dokumentasi api wishlist & review
│   ├── postman/          koleksi postman (order, wishlist & review)
│   ├── .env.example      template environment variable
│   └── package.json      dependency & script server
├── .gitignore
└── README.md
```

Setiap request mengikuti arsitektur berlapis:

```text
routes → middleware (auth, role, validation, error) → controller → service (business rules) → model (Mongoose) → MongoDB
```

Controller hanya menerima request dan mengirim response; seluruh aturan bisnis (ketersediaan stok, kepemilikan order, transisi status) berada di service.

## Laporan

📄 Laporan PDF Milestone 1: <!-- TODO: ganti dengan URL GDrive (akses: Anyone with the link — Viewer) -->

## Cara Menjalankan

1. **Prasyarat:** Node.js >= 20.19 dan MongoDB (lokal atau Atlas).
2. **Install dependency:**
   ```bash
   cd server
   npm install
   ```
3. **Siapkan environment variable:**
   ```bash
   cp .env.example .env
   ```
   Lalu isi nilainya:

   | Variabel | Contoh (`.env.example`) | Keterangan |
   |---|---|---|
   | `MONGO_URI` | `mongodb://localhost:27017/thriftpedia` | Connection string MongoDB |
   | `PORT` | `5000` | Port server (default 5000 jika kosong) |
   | `JWT_SECRET` | `changeme` | Secret untuk menandatangani JWT |

   Server menolak untuk start jika `JWT_SECRET` kosong.
4. **Jalankan server:**
   ```bash
   npm start
   ```
   Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
5. **Jalankan test:**
   ```bash
   npm test
   ```
   Run pertama mengunduh binary MongoDB untuk database test in-memory, sehingga sedikit lebih lama.
6. **Demo pembelian bersamaan** (server harus sedang berjalan; butuh satu `productId` berstatus `AVAILABLE` dan token beberapa buyer):
   ```bash
   node scripts/concurrent-purchase.js <productId> <buyerToken1> <buyerToken2> [...]
   ```
   Alamat server dibaca dari `BASE_URL` (default `http://localhost:5000`). Output yang diharapkan: `PASS: exactly one purchase succeeded`.
7. **Akun admin:** `POST /api/auth/register` selalu membuat user dengan role `BUYER`, dan belum ada endpoint maupun seed script untuk membuat admin. Register user seperti biasa, ubah role-nya langsung di MongoDB, lalu login ulang untuk mendapatkan token dengan role `ADMIN`:
   ```js
   db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "ADMIN" } })
   ```

## Daftar API

Endpoint yang membutuhkan login memakai header `Authorization: Bearer <token>`.

### Health

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/health` | Public | Cek server berjalan |

### Auth

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Registrasi user baru (role `BUYER`) |
| POST | `/api/auth/login` | Public | Login, mengembalikan token JWT |

### Product

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/products` | Public | Daftar semua produk |
| GET | `/api/products/:id` | Public | Detail produk |
| POST | `/api/products` | ADMIN | Tambah produk (status otomatis `AVAILABLE`) |
| PATCH | `/api/products/:id` | ADMIN | Ubah data produk (`status` tidak bisa diubah) |
| DELETE | `/api/products/:id` | ADMIN | Hapus produk |

### Order

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/orders` | BUYER | Beli produk (`{ "productId": "..." }`) |
| GET | `/api/orders` | BUYER (milik sendiri) / ADMIN (semua) | Daftar order, filter opsional `?status=` |
| GET | `/api/orders/:orderId` | Pemilik order atau ADMIN | Detail order |
| PATCH | `/api/orders/:orderId` | ADMIN | Ubah status (`{ "status": "COMPLETED" \| "CANCELLED" }`) |

### Wishlist

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/wishlist` | BUYER | Tambah produk ke wishlist |
| GET | `/api/wishlist` | BUYER | Daftar wishlist milik sendiri |
| DELETE | `/api/wishlist/:productId` | BUYER | Hapus produk dari wishlist |

### Review

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/products/:productId/reviews` | Public | Daftar review sebuah produk |
| POST | `/api/products/:productId/reviews` | BUYER dengan order `COMPLETED` | Beri review (rating 1–5) |

### Aturan Bisnis Utama

- **Single-stock:** pembelian memakai satu update atomik bersyarat pada `status: AVAILABLE` (produk langsung menjadi `SOLD`). Pembeli kedua yang datang bersamaan tidak lolos kondisi tersebut dan menerima `409`.
- **Alur status order:** `PENDING → COMPLETED` atau `PENDING → CANCELLED`, hanya oleh admin. `COMPLETED` dan `CANCELLED` bersifat final dan tidak bisa diubah lagi (`409`). Membatalkan order mengembalikan produk ke `AVAILABLE`.
- **Review:** hanya bisa diberikan untuk produk dari order milik sendiri yang berstatus `COMPLETED`, dan satu buyer hanya bisa mereview satu produk satu kali.
- **Identitas buyer** selalu diambil dari JWT, tidak pernah dari body request. Field `buyer` dan `status` yang dikirim client diabaikan.

### Kode Status HTTP

| Kode | Arti di Thriftpedia |
|---|---|
| 200 | Request berhasil |
| 201 | Data berhasil dibuat (register, produk, order, wishlist, review) |
| 400 | Input tidak valid, JSON rusak, field tidak diizinkan, atau email sudah terdaftar saat register |
| 401 | Token tidak ada / tidak valid, atau email/password login salah |
| 403 | Role tidak sesuai, mengakses order milik orang lain, atau review tanpa order `COMPLETED` |
| 404 | Produk, order, item wishlist, atau route tidak ditemukan |
| 409 | Produk sudah terjual, transisi status tidak valid / order diubah bersamaan, wishlist atau review duplikat |
| 500 | Kesalahan server (detail error tidak dikirim ke client) |

### Dokumentasi & Koleksi Postman

- Dokumentasi API wishlist & review: [server/docs/wishlist-review-api.md](server/docs/wishlist-review-api.md)
- Koleksi Postman order: [server/postman/order.postman_collection.json](server/postman/order.postman_collection.json)
- Koleksi Postman wishlist & review: [server/postman/Thriftpedia-Wishlist-Review.postman_collection.json](server/postman/Thriftpedia-Wishlist-Review.postman_collection.json)
- Hasil lengkap pemanggilan API via Postman terdapat di laporan PDF (lihat bagian [Laporan](#laporan)).

## Alur Kerja Git

- Branch `main` ditambah satu feature branch per anggota (nama branch = NIM).
- Setiap branch digabung ke `main` melalui Pull Request; CI (GitHub Actions) berjalan pada setiap PR dan push ke `main`.
