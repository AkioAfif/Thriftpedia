# Thriftpedia

Thriftpedia adalah backend untuk toko online barang bekas (thrift). Barang thrift umumnya hanya tersedia dalam satu unit dengan ukuran dan kondisi tertentu. Sistem ini dirancang untuk memastikan setiap barang hanya dapat dibeli oleh satu pembeli.

Mekanisme single-stock digunakan untuk mencegah satu barang terbeli oleh dua pembeli secara bersamaan, termasuk ketika keduanya melakukan pembelian pada waktu yang sama.

Repository ini merupakan hasil Milestone 1 yang berfokus pada pengembangan backend berbasis REST API. Folder `client/` masih berupa placeholder dan akan dikembangkan pada milestone berikutnya.

## Apa yang Bisa Dilakukan?

Ada dua jenis pengguna, yaitu **admin** dan **buyer**.

- Semua pengguna dapat melihat daftar produk dan review tanpa perlu login.
- Buyer dapat mendaftar, login, membeli produk, melihat riwayat pesanan, menyimpan produk ke wishlist, dan memberikan review setelah pesanan selesai.
- Admin dapat menambah, mengubah, dan menghapus produk, melihat seluruh pesanan, serta mengubah status pesanan menjadi selesai atau dibatalkan.

## Tim

Kelompok **Thriftpedia** <!-- TODO: nomor kelompok -->

| Nama | NIM | Peran | Bagian yang Dikerjakan | Branch |
|---|---|---|---|---|
| Nayla Thalita | 24/535820/TK/59467 | Ketua | Wishlist, review, dan keamanan API | `535820` |
| Akio Afifian Ahsan | 24/542230/TK/60198 | Anggota | Pesanan dan pembelian single-stock | `542230` |
| Zahra Elfatima | 24/535709/TK/59448 | Anggota | Manajemen produk | `535709` |
| Rida Larasati | 24/539400/TK/59821 | Anggota | Register dan login | `539400` |

## Teknologi

- **Node.js** (minimal versi 20.19) dan **Express 5** untuk server API
- **MongoDB** dengan **Mongoose 9** untuk database
- **bcrypt** untuk menyimpan password dalam bentuk hash, dan **JSON Web Token (JWT)** untuk login
- **dotenv** untuk membaca konfigurasi dari file `.env`
- **node:test**, **supertest**, dan **mongodb-memory-server** untuk testing
- **Postman** untuk mencoba API
- **Git dan GitHub** untuk kolaborasi, serta **GitHub Actions** untuk menjalankan test secara otomatis

## Struktur Folder

Semua kode backend ada di folder `server/`:

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

Setiap request masuk melalui route, kemudian diperiksa oleh middleware untuk memastikan pengguna sudah login, memiliki role yang sesuai, dan mengirimkan data yang valid. Setelah itu, request diteruskan ke controller yang memanggil service. Aturan bisnis dikelola di dalam service, sedangkan akses ke database dilakukan melalui model Mongoose.

## Laporan

📄 Laporan PDF Milestone 1: <!-- TODO: ganti dengan URL GDrive (akses: Anyone with the link — Viewer) -->

## Menjalankan di Komputer Sendiri

Yang perlu disiapkan: Node.js versi 20.19 atau lebih baru, dan MongoDB (bisa di komputer sendiri atau memakai MongoDB Atlas).

1. Masuk ke folder `server` lalu install dependency:

   ```bash
   cd server
   npm install
   ```

2. Salin file contoh konfigurasi:

   ```bash
   cp .env.example .env
   ```

   Lalu sesuaikan isinya:

   - `MONGO_URI`: alamat database, misalnya `mongodb://localhost:27017/thriftpedia`
   - `PORT`: port server, bawaannya `5000`
   - `JWT_SECRET`: kunci rahasia untuk token login. Wajib diisi, karena tanpa ini server tidak mau berjalan.

3. Jalankan server:

   ```bash
   npm start
   ```

   Buka `http://localhost:5000/api/health`. Kalau muncul `{ "status": "ok" }`, server sudah berjalan.

### Menjalankan Test

```bash
npm test
```

Test memakai database sementara di memori, jadi tidak perlu menyalakan MongoDB. Saat pertama kali dijalankan, test akan mengunduh MongoDB terlebih dahulu, sehingga butuh waktu sedikit lebih lama.

### Membuat Akun Admin

Pendaftaran selalu membuat akun buyer, dan saat ini belum ada cara membuat admin lewat API. Caranya: daftar seperti biasa, ubah role akun tersebut langsung di MongoDB, lalu login ulang.

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "ADMIN" } })
```

### Mencoba Pembelian Bersamaan

Untuk membuktikan bahwa satu barang tidak bisa terjual dua kali, jalankan skrip berikut saat server sedang berjalan. Siapkan satu produk yang masih tersedia dan token login dari beberapa buyer:

```bash
node scripts/concurrent-purchase.js <productId> <tokenBuyer1> <tokenBuyer2> ...
```

Semua buyer akan mencoba membeli produk yang sama pada waktu bersamaan. Jika benar, hanya satu yang berhasil dan skrip menampilkan `PASS: exactly one purchase succeeded`. Skrip ini menghubungi `http://localhost:5000`; alamat lain bisa diatur lewat variabel `BASE_URL`.

## Daftar Endpoint

Endpoint yang membutuhkan login memakai header `Authorization: Bearer <token>`, dengan token yang didapat dari login.

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| GET | `/api/health` | Semua | Cek apakah server berjalan |
| POST | `/api/auth/register` | Semua | Membuat akun baru |
| POST | `/api/auth/login` | Semua | Login dan mendapatkan token |
| GET | `/api/products` | Semua | Melihat semua produk |
| GET | `/api/products/:id` | Semua | Melihat detail produk |
| POST | `/api/products` | Admin | Menambah produk |
| PATCH | `/api/products/:id` | Admin | Mengubah data produk |
| DELETE | `/api/products/:id` | Admin | Menghapus produk |
| POST | `/api/orders` | Buyer | Membeli produk |
| GET | `/api/orders` | Buyer, Admin | Melihat pesanan (buyer hanya miliknya, admin semuanya) |
| GET | `/api/orders/:orderId` | Buyer pemilik, Admin | Melihat detail pesanan |
| PATCH | `/api/orders/:orderId` | Admin | Menandai pesanan selesai atau dibatalkan |
| POST | `/api/wishlist` | Buyer | Menyimpan produk ke wishlist |
| GET | `/api/wishlist` | Buyer | Melihat wishlist |
| DELETE | `/api/wishlist/:productId` | Buyer | Menghapus produk dari wishlist |
| GET | `/api/products/:productId/reviews` | Semua | Melihat review sebuah produk |
| POST | `/api/products/:productId/reviews` | Buyer | Memberi review (setelah pesanan selesai) |

Contoh request dan respons lengkapnya ada di koleksi Postman untuk [pesanan](server/postman/order.postman_collection.json) dan untuk [wishlist & review](server/postman/Thriftpedia-Wishlist-Review.postman_collection.json), serta di [dokumentasi API wishlist & review](server/docs/wishlist-review-api.md). Hasil uji coba dengan Postman juga dilampirkan di laporan.

## Aturan Penting

**Satu barang hanya bisa terjual sekali.** Saat pembelian, sistem memeriksa dan mengubah status produk dari `AVAILABLE` menjadi `SOLD` dalam satu langkah di database. Jika dua orang membeli bersamaan, hanya yang pertama yang berhasil. Pembeli lainnya mendapat pesan bahwa produk sudah terjual.

**Status pesanan.** Pesanan baru berstatus `PENDING`. Admin kemudian menandainya `COMPLETED` (selesai) atau `CANCELLED` (dibatalkan), dan setelah itu status tidak bisa diubah lagi. Jika pesanan dibatalkan, produknya kembali tersedia dan bisa dibeli orang lain.

**Review.** Buyer hanya bisa memberi review untuk produk yang pesanannya sudah selesai, dan hanya satu kali untuk setiap produk.

**Pembeli selalu diambil dari token login**, bukan dari data yang dikirim, sehingga tidak ada yang bisa membeli atas nama orang lain.

Kalau request gagal, API mengembalikan kode berikut:

- `400`: data yang dikirim tidak valid, termasuk email yang sudah terdaftar saat mendaftar
- `401`: belum login, token tidak valid, atau email/password salah
- `403`: tidak punya akses, misalnya buyer membuka pesanan milik orang lain
- `404`: data tidak ditemukan
- `409`: terjadi konflik, misalnya produk sudah terjual atau pesanan yang sudah selesai ingin diubah

## Cara Kerja Tim

Setiap anggota mengerjakan bagiannya di branch masing-masing, dengan nama branch sesuai NIM. Perubahan digabungkan ke `main` melalui pull request, dan GitHub Actions otomatis menjalankan test setiap ada pull request atau push ke `main`.
