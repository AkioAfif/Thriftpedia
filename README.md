# Thriftpedia

Thriftpedia adalah aplikasi berbasis web untuk toko online barang bekas (thrift). Barang thrift umumnya hanya tersedia dalam satu unit dengan ukuran dan kondisi tertentu. Sistem ini dirancang untuk memastikan setiap barang hanya dapat dibeli oleh satu pembeli.

Mekanisme single-stock digunakan untuk mencegah satu barang terbeli oleh dua pembeli secara bersamaan, termasuk ketika keduanya melakukan pembelian pada waktu yang sama.

Repository ini berisi backend (REST API dengan Express.js) dan frontend (Next.js) untuk Thriftpedia.

## Demo

Aplikasi bisa diakses di https://thriftpedia.vercel.app/
[▶ Watch Website Demo](https://drive.google.com/drive/folders/1DVEe4T3WsVoTiHRRLwQ3hZCrjeHDQONx?usp=sharing)

## Apa yang Bisa Dilakukan?

Ada dua jenis pengguna, yaitu **admin** dan **buyer**.

- Semua pengguna dapat melihat daftar produk dan review tanpa perlu login.
- Buyer dapat mendaftar, login, membeli produk, membayar online lewat Midtrans, menambah alamat pengiriman, membatalkan pesanan saat masih Pending, melihat riwayat pesanan, menyimpan produk ke wishlist, dan memberikan review setelah pesanan selesai.
- Admin dapat menambah, mengubah, dan menghapus produk, melihat dashboard pesanan dan inventaris, melihat seluruh pesanan, serta mengubah status pesanan (Processing, Shipped, Completed, atau Cancelled).

## Tim

Kelompok **Thriftpedia**

| Nama | NIM | Peran | Bagian yang Dikerjakan |
|---|---|---|---|
| Nayla Thalita | 24/535820/TK/59467 | Ketua | Wishlist, review, dan keamanan API |
| Akio Afifian Ahsan | 24/542230/TK/60198 | Anggota | Pesanan, pembelian single-stock, dan pembayaran Midtrans |
| Zahra Elfatima | 24/535709/TK/59448 | Anggota | Manajemen produk dan frontend |
| Rida Larasati | 24/539400/TK/59821 | Anggota | Register, login, dan reset password |

## Teknologi

### Backend

- **Node.js** (minimal versi 20.19) dan **Express 5** untuk server API
- **MongoDB** dengan **Mongoose 9** untuk database
- **bcrypt** untuk menyimpan password dalam bentuk hash, dan **JSON Web Token (JWT)** untuk login
- **Cloudinary** untuk penyimpanan foto produk
- **Midtrans** untuk pembayaran online (Snap Sandbox)
- **Brevo** untuk pengiriman email reset password
- **dotenv** untuk membaca konfigurasi dari file `.env`
- **node:test**, **supertest**, dan **mongodb-memory-server** untuk testing
- **Git dan GitHub** untuk kolaborasi, serta **GitHub Actions** untuk menjalankan test secara otomatis

### Frontend

- **Next.js 16** (App Router) dan **React** untuk antarmuka
- **Tailwind CSS v4** untuk styling
- **Zod** untuk validasi form di sisi klien
- **Midtrans Snap** untuk popup pembayaran online
- **Vercel** untuk hosting frontend

## Struktur Folder

```text
Thriftpedia/
├── .github/workflows/    ci github actions (client & server)
├── client/               frontend (next.js)
│   ├── src/
│   │   ├── app/              rute halaman (App Router)
│   │   │   ├── catalog/      katalog dan detail produk
│   │   │   ├── checkout/     halaman checkout
│   │   │   ├── orders/       riwayat dan detail pesanan buyer
│   │   │   ├── admin/        dashboard, produk, dan pesanan admin
│   │   │   ├── wishlist/     halaman wishlist
│   │   │   ├── login/        halaman login
│   │   │   └── ...           landing, contact, terms, privacy
│   │   ├── components/       komponen per fitur
│   │   │   ├── ui/           komponen bersama (Button, LoadingDots, FilterSelect, dll.)
│   │   │   ├── catalog/      ProductCard, ProductDetail, filter, pencarian
│   │   │   ├── orders/       OrderCard, OrderStatusRibbon, PaymentBadge, AddressDialog
│   │   │   ├── admin/        dashboard, form produk, tabel pesanan
│   │   │   ├── auth/         AuthDialog, AuthForm
│   │   │   └── reviews/      ReviewForm
│   │   ├── lib/
│   │   │   ├── services/     pemanggilan API (orderService, paymentService, dll.)
│   │   │   ├── payment.js    utilitas status pembayaran dan Snap
│   │   │   ├── shippingAddress.js  validasi alamat (Zod)
│   │   │   └── utils.js      utilitas umum
│   │   ├── hooks/            custom hook (usePersistedForm, useCatalogFilters)
│   │   └── context/          AuthContext, WishlistContext, BuyerContext
│   ├── public/               aset statis
│   ├── .env.example          template environment variable frontend
│   └── package.json
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
│   │   ├── services/     business logic (single-stock, payment, eligibility)
│   │   └── utils/        AppError
│   ├── test/             unit test validasi & index model
│   ├── tests/            integration test (order, payment, auth, dll.) + helper
│   ├── scripts/          demo pembelian bersamaan (concurrency)
│   ├── docs/             dokumentasi api (order, payment, wishlist & review)
│   ├── postman/          koleksi postman
│   ├── .env.example      template environment variable
│   └── package.json
├── .gitignore
└── README.md
```

Setiap request masuk melalui route, kemudian diperiksa oleh middleware untuk memastikan pengguna sudah login, memiliki role yang sesuai, dan mengirimkan data yang valid. Setelah itu, request diteruskan ke controller yang memanggil service. Aturan bisnis dikelola di dalam service, sedangkan akses ke database dilakukan melalui model Mongoose.

## Fitur Frontend

- Katalog dengan filter (kategori, ukuran, kondisi, harga), pencarian, dan pengurutan. Semua filter tersimpan di URL sehingga bisa dibagikan atau dipertahankan saat halaman dimuat ulang.
- Checkout dengan pilihan metode pembayaran: bayar online (Midtrans, alamat wajib) atau atur dengan penjual (alamat opsional).
- Pembayaran online lewat Midtrans Snap (kartu, virtual account, QRIS). Status pembayaran diperbarui lewat webhook.
- Riwayat pesanan buyer dengan badge status dan pembayaran, tombol bayar dan tombol batalkan.
- Tambah atau ubah alamat pengiriman di detail pesanan selama order masih Pending dan belum dibayar.
- Wishlist untuk menyimpan produk favorit.
- Ulasan produk yang hanya bisa ditulis setelah pesanan berstatus Completed.
- Dashboard admin dengan pipeline pesanan dan ringkasan inventaris.
- Manajemen produk admin dengan unggah foto ke Cloudinary.
- Manajemen pesanan admin dengan perubahan status (Processing, Shipped, Completed, Cancelled).
- Draf form tahan refresh: alamat checkout, ulasan, dan form produk admin tersimpan di sessionStorage dan dihapus saat logout.
- Responsif dari 375px hingga 1280px. Admin memakai drawer dan hamburger di mobile, katalog memakai bottom sheet filter.
- Umpan balik visual: skeleton loading, toast, pesan galat per field, dan indikator loading di tombol.

## Menjalankan di Komputer Sendiri

Yang perlu disiapkan: Node.js versi 20.19 atau lebih baru, dan MongoDB (bisa di komputer sendiri atau memakai MongoDB Atlas).

### Backend

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
   - `MIDTRANS_SERVER_KEY`: server key sandbox Midtrans (opsional, tanpa ini pembayaran online tidak tersedia)
   - `MIDTRANS_SIGNATURE_KEY`: signature secret key Midtrans untuk verifikasi webhook
   - `MIDTRANS_IS_PRODUCTION`: `false` untuk sandbox
   - Variabel email (Brevo) untuk fitur reset password. Lihat `.env.example` untuk daftar lengkap.

3. Jalankan server:

   ```bash
   npm start
   ```

   Atau untuk pengembangan dengan auto-restart:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:5000/api/health`. Kalau muncul `{ "status": "ok" }`, server sudah berjalan.

### Frontend

1. Masuk ke folder `client` lalu install dependency:

   ```bash
   cd client
   npm install
   ```

2. Salin file contoh konfigurasi:

   ```bash
   cp .env.example .env.local
   ```

   Lalu sesuaikan isinya:

   - `NEXT_PUBLIC_API_URL`: alamat backend, misalnya `http://localhost:5000/api`
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: client key sandbox Midtrans (opsional, tanpa ini pembayaran memakai redirect ke halaman Midtrans)
   - Lihat `.env.example` untuk variabel lainnya.

3. Jalankan frontend:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

### Menjalankan Test

```bash
cd server
npm test
```

Test memakai database sementara di memori, jadi tidak perlu menyalakan MongoDB. Saat pertama kali dijalankan, test akan mengunduh MongoDB terlebih dahulu, sehingga butuh waktu sedikit lebih lama.

Untuk lint dan build frontend:

```bash
cd client
npm run lint
npm run build
```

### Membuat Akun Admin

Jalankan skrip seed yang tersedia:

```bash
cd server
node scripts/seed-admin.js
```

Atau secara manual: daftar seperti biasa lewat frontend atau API, lalu ubah role akun tersebut langsung di MongoDB:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "ADMIN" } })
```

Setelah itu login ulang agar token baru memuat role admin.

### Mencoba Pembelian Bersamaan

Untuk membuktikan bahwa satu barang tidak bisa terjual dua kali, jalankan skrip berikut saat server sedang berjalan. Siapkan satu produk yang masih tersedia dan token login dari beberapa buyer:

```bash
node scripts/concurrent-purchase.js <productId> <tokenBuyer1> <tokenBuyer2> ...
```

Semua buyer akan mencoba membeli produk yang sama pada waktu bersamaan. Jika benar, hanya satu yang berhasil dan skrip menampilkan `PASS: exactly one purchase succeeded`. Skrip ini menghubungi `http://localhost:5000`; alamat lain bisa diatur lewat variabel `BASE_URL`.

### Mencoba Pembayaran Online

Pembayaran online memakai Midtrans Sandbox. Untuk menguji secara lengkap (termasuk perubahan status setelah bayar), diperlukan tunnel publik agar webhook Midtrans bisa mencapai server lokal:

1. Jalankan server, lalu buka tunnel: `cloudflared tunnel --url http://localhost:5000` atau `ngrok http 5000`.
2. Di dashboard Midtrans Sandbox, atur Notification URL ke `https://<url-tunnel>/api/payments/notification`.
3. Buat pesanan lewat frontend, pilih bayar online, dan bayar menggunakan data uji:
   - Kartu: `4811 1111 1111 1114`, CVV `123`, expiry di masa depan, OTP `112233`
   - VA atau QRIS: bayar lewat simulator di `https://simulator.sandbox.midtrans.com`

Tanpa tunnel, pembayaran tetap bisa dibuka di popup Midtrans, tetapi status pesanan tidak akan berubah ke Paid karena webhook tidak sampai.

## Daftar Endpoint

Endpoint yang membutuhkan login memakai header `Authorization: Bearer <token>`, dengan token yang didapat dari login.

### Auth

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| GET | `/api/health` | Semua | Cek apakah server berjalan |
| POST | `/api/auth/register` | Semua | Membuat akun baru |
| POST | `/api/auth/login` | Semua | Login dan mendapatkan token |
| GET | `/api/auth/me` | Buyer, Admin | Melihat data user yang sedang login |
| POST | `/api/auth/forgot-password` | Semua | Meminta email reset password |
| POST | `/api/auth/reset-password` | Semua | Reset password dengan token dari email |

### Produk

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| GET | `/api/products` | Semua | Melihat semua produk |
| GET | `/api/products/:id` | Semua | Melihat detail produk |
| POST | `/api/products` | Admin | Menambah produk |
| PATCH | `/api/products/:id` | Admin | Mengubah data produk |
| DELETE | `/api/products/:id` | Admin | Menghapus produk |

### Pesanan

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| POST | `/api/orders` | Buyer | Membeli produk (checkout) |
| GET | `/api/orders` | Buyer, Admin | Melihat pesanan (buyer hanya miliknya, admin semuanya) |
| GET | `/api/orders/:orderId` | Buyer pemilik, Admin | Melihat detail pesanan |
| PATCH | `/api/orders/:orderId/status` | Admin | Mengubah status pesanan |
| PATCH | `/api/orders/:orderId/cancel` | Buyer pemilik | Membatalkan pesanan (hanya saat Pending) |
| PATCH | `/api/orders/:orderId/address` | Buyer pemilik | Menambah atau mengubah alamat pengiriman |

### Pembayaran

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| POST | `/api/payments/:orderId` | Buyer pemilik | Membuat token pembayaran Midtrans |
| POST | `/api/payments/notification` | Midtrans (webhook) | Menerima notifikasi status pembayaran |

### Wishlist

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| POST | `/api/wishlist` | Buyer | Menyimpan produk ke wishlist |
| GET | `/api/wishlist` | Buyer | Melihat wishlist |
| DELETE | `/api/wishlist/:productId` | Buyer | Menghapus produk dari wishlist |

### Review

| Method | Endpoint | Bisa Diakses Oleh | Fungsi |
|---|---|---|---|
| GET | `/api/products/:productId/reviews` | Semua | Melihat review sebuah produk |
| POST | `/api/products/:productId/reviews` | Buyer | Memberi review (setelah pesanan selesai) |

Dokumentasi API yang lebih lengkap tersedia di:
- [Kontrak order dan pembayaran](server/docs/order-payment-api.md)
- [Dokumentasi wishlist dan review](server/docs/wishlist-review-api.md)

## Aturan Penting

**Satu barang hanya bisa terjual sekali.** Saat pembelian, sistem memeriksa dan mengubah status produk dari `AVAILABLE` menjadi `SOLD` dalam satu langkah di database. Jika dua orang membeli bersamaan, hanya yang pertama yang berhasil. Pembeli lainnya mendapat pesan bahwa produk sudah terjual.

**Status pesanan.** Pesanan baru berstatus `PENDING`. Buyer bisa membatalkan selama masih Pending, dan produk kembali tersedia. Admin mengubah status menjadi `PROCESSING` (sedang diproses), `SHIPPED` (dikirim dengan nomor resi), atau `COMPLETED` (selesai). Pesanan yang sudah Completed atau Cancelled tidak bisa diubah lagi.

**Pembayaran online.** Buyer bisa memilih bayar online lewat Midtrans atau mengatur pembayaran langsung dengan penjual. Pembayaran online membutuhkan alamat pengiriman. Status pembayaran (Paid, Expired, Failed) hanya berubah lewat webhook Midtrans yang diverifikasi signature, bukan dari sisi browser.

**Alamat pengiriman.** Alamat bisa diisi saat checkout atau ditambahkan setelah pesanan dibuat, selama pesanan masih Pending, belum dibayar, dan belum ada token pembayaran.

**Review.** Buyer hanya bisa memberi review untuk produk yang pesanannya sudah selesai, dan hanya satu kali untuk setiap produk.

**Pembeli selalu diambil dari token login**, bukan dari data yang dikirim, sehingga tidak ada yang bisa membeli atas nama orang lain.

Kalau request gagal, API mengembalikan kode berikut:

- `400`: data yang dikirim tidak valid, termasuk email yang sudah terdaftar saat mendaftar
- `401`: belum login, token tidak valid, atau email/password salah
- `403`: tidak punya akses, misalnya buyer membuka pesanan milik orang lain
- `404`: data tidak ditemukan
- `409`: terjadi konflik, misalnya produk sudah terjual atau pesanan yang sudah selesai ingin diubah

## Cara Kerja Tim

Setiap anggota mengerjakan bagiannya di branch masing-masing. Perubahan digabungkan ke `main` melalui pull request, dan GitHub Actions otomatis menjalankan test setiap ada pull request atau push ke `main`.
