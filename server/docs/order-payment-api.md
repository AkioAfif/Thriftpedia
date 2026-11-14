# Kontrak API Order, Pembayaran (Midtrans), dan Pembatalan

Kontrak ini dipakai FE (riwayat pesanan, checkout, konfirmasi) dan BE. Setiap perubahan
path, body, atau respons **wajib** memperbarui dokumen ini (lihat [Changelog](#changelog))
dan dikabarkan ke tim terlebih dahulu.

## Aturan umum

- Semua respons berbentuk `{ message, data }`. Error berbentuk `{ message }`, kadang
  ditambah `details` (array string) untuk error validasi.
- Id adalah string ObjectId 24 karakter hex. Id yang formatnya salah → `400`.
- `buyer` tidak pernah dikirim dari client, selalu diambil dari JWT.
- Satu order = satu produk = satu stok (single stock).

## Field Order

Field lama tetap ada (`orderNumber`, `buyer`, `product`, `buyerSnapshot`, `productSnapshot`,
`total`, `status`, `trackingNumber`, `courier`, `statusHistory`). Field baru:

| Field | Tipe | Keterangan |
|---|---|---|
| `paymentStatus` | `UNPAID` \| `PAID` \| `EXPIRED` \| `FAILED` | Default `UNPAID`. Hanya diubah oleh notifikasi Midtrans. |
| `shippingAddress` | object atau tidak ada | `{ recipientName, phone, address, city, postalCode }`. Opsional saat checkout, wajib sebelum bayar. |
| `paymentToken` | string \| null | Token Snap Midtrans. |
| `paymentRedirectUrl` | string \| null | URL halaman pembayaran Snap. |

Catatan untuk FE: order yang dibuat sebelum fitur ini bisa **tidak punya** `paymentStatus`
di `GET /api/orders` (list). Anggap tidak ada = `UNPAID`.

`total` adalah jumlah yang dibayar (harga produk). Tidak ada ongkos kirim.

## Endpoint

### Checkout

`POST /api/orders`. Hanya BUYER.

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "shippingAddress": {
    "recipientName": "Budi Santoso",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 1",
    "city": "Bandung",
    "postalCode": "40111"
  }
}
```

`shippingAddress` boleh tidak dikirim. Bila dikirim:

| Field | Aturan |
|---|---|
| `recipientName` | wajib, maks 100 karakter |
| `phone` | wajib, 8–15 digit, boleh diawali `+` |
| `address` | wajib, maks 500 karakter |
| `city` | wajib, maks 100 karakter |
| `postalCode` | wajib, tepat 5 digit |

Field lain di dalam `shippingAddress` ditolak. Nilai di-trim sebelum disimpan.

Respons:
- `201` order dibuat (`status: PENDING`, `paymentStatus: UNPAID`), produk menjadi `SOLD`
- `400` body tidak valid
- `401` token tidak ada / tidak valid
- `403` bukan BUYER
- `404` produk tidak ada
- `409` produk sudah terjual

### Batalkan pesanan (oleh pembeli)

`PATCH /api/orders/:orderId/cancel`. Hanya BUYER pemilik order. Tanpa body.

- Hanya bisa saat `status === 'PENDING'`.
- Dalam satu transaksi: order → `CANCELLED`, entri `statusHistory` dengan
  `note: "Cancelled by buyer"`, produk → `AVAILABLE`.
- Bila pembeli sudah membuka Snap, transaksi Midtrans ikut dibatalkan. Jika pembatalan di
  Midtrans gagal, pembatalan order **tetap berhasil**.
- `paymentStatus` tetap `UNPAID`.

Respons:
- `200` `{ message: "Order cancelled", data }`. `data` berbentuk sama dengan
  `GET /api/orders/:orderId`.
- `400` id tidak valid
- `401` token tidak ada / tidak valid
- `403` bukan pemilik, atau login sebagai ADMIN. Admin memakai
  `PATCH /api/orders/:orderId/status`.
- `404` order tidak ada
- `409` status bukan `PENDING` (sudah diproses, dikirim, selesai, atau sudah dibatalkan)

### Buat token pembayaran

`POST /api/payments/:orderId`. Hanya BUYER pemilik order. Tanpa body.

```json
{
  "message": "Payment token created",
  "data": {
    "token": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v4/redirection/66e4fa55-..."
  }
}
```

- Bila order sudah punya token, token yang sama dikembalikan (`200`, message
  `"Payment token retrieved"`), dan tidak ada transaksi baru di Midtrans.
- Token berlaku 24 jam.

Respons:
- `201` token baru
- `200` token lama
- `400` id tidak valid, atau order belum punya `shippingAddress`
- `401` token tidak ada / tidak valid
- `403` bukan pemilik / bukan BUYER
- `404` order tidak ada
- `409` order bukan `PENDING` + `UNPAID`
- `502` Midtrans error
- `503` server belum diisi `MIDTRANS_SERVER_KEY`

Di FE, pakai `token` dengan Snap.js (`window.snap.pay(token)`), atau arahkan ke `redirectUrl`.

### Notifikasi Midtrans (webhook)

`POST /api/payments/notification`. **Dipanggil Midtrans, bukan FE.**

Tanpa JWT. Keaslian dicek lewat `signature_key = SHA512(order_id + status_code + gross_amount + SignatureKey)`.
`SignatureKey` = `MIDTRANS_SIGNATURE_KEY` (akun Midtrans baru, "Signature Secret Key" di Access Keys),
atau `MIDTRANS_SERVER_KEY` bila variabel itu kosong (akun lama).
`order_id` di Midtrans = `_id` order.

Respons:
- `200` diterima (termasuk notifikasi berulang)
- `400` payload tidak lengkap / jumlah tidak cocok dengan `total`
- `403` signature salah
- `404` order tidak ada

## Alur status

| Kejadian | `paymentStatus` | `status` | Produk |
|---|---|---|---|
| Checkout | `UNPAID` | `PENDING` | `SOLD` |
| Midtrans `settlement` / `capture`+`accept` | `PAID` | `PROCESSING` (otomatis, `by: null`) | `SOLD` |
| Midtrans `expire` | `EXPIRED` | `CANCELLED` | `AVAILABLE` |
| Midtrans `deny` / `cancel` / `failure` | `FAILED` | `CANCELLED` | `AVAILABLE` |
| Pembeli batalkan (`/cancel`) | `UNPAID` | `CANCELLED` | `AVAILABLE` |
| Admin batalkan (`/status`) | tidak berubah | `CANCELLED` | `AVAILABLE` |
| Dibayar setelah dibatalkan | `PAID` | tetap `CANCELLED` | tidak berubah (refund manual) |
| Midtrans `pending` / `capture`+`challenge` | tidak berubah | tidak berubah | tidak berubah |

`PAID`, `EXPIRED`, dan `FAILED` bersifat final. Notifikasi berikutnya diabaikan.
Setelah `PROCESSING`, alur admin tetap sama: `SHIPPED` → `COMPLETED`.

## Aturan tampilan untuk FE

| Elemen | Tampil bila |
|---|---|
| Tombol **Pay now** | `status === 'PENDING' && (paymentStatus ?? 'UNPAID') === 'UNPAID'` |
| Tombol **Batalkan** | `status === 'PENDING'` |
| Badge pembayaran | selalu, dari `paymentStatus ?? 'UNPAID'` |
| Form alamat di checkout | opsional, tapi tanpa alamat order tidak bisa dibayar |

Setelah bayar, jangan anggap order lunas hanya dari callback Snap di browser. Ambil ulang
`GET /api/orders/:orderId`, karena status resmi datang dari webhook.

## Tes di sandbox

1. Daftar di <https://dashboard.midtrans.com>, pilih environment **Sandbox**, buka
   **Settings → Access Keys**.
2. Klik **Generate server key** dengan izin **Snap Checkout: Write** dan
   **Cancel transaction: Write** (yang lain None).
3. Isi `server/.env` (jangan di-commit):
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx      # server key yang di-generate
   MIDTRANS_SIGNATURE_KEY=Mid-server-xxxx      # "Signature Secret Key" di Access Keys
   MIDTRANS_CLIENT_KEY=Mid-client-xxxx         # "Client Key", untuk Snap.js di FE
   MIDTRANS_IS_PRODUCTION=false
   ```
   Tanpa `MIDTRANS_SIGNATURE_KEY` yang benar, semua webhook ditolak `403` dan di riwayat
   notifikasi Midtrans terlihat "In progress / Resending".
4. Jalankan server (`npm run dev`, port 5000), lalu buka tunnel publik:
   `cloudflared tunnel --url http://localhost:5000` (tanpa akun) atau `ngrok http 5000`.
5. Di dashboard: **Settings → Payment → Notification URL** =
   `https://<url-tunnel>/api/payments/notification`.
   URL tunnel gratis berubah setiap restart, jadi perbarui setiap kali.
6. FE memuat `https://app.sandbox.midtrans.com/snap/snap.js` dengan atribut
   `data-client-key` = client key.
7. Bayar dengan data uji sandbox Midtrans:
   - Kartu sukses: `4811 1111 1111 1114`, CVV `123`, expiry format **MM/YY** di masa depan
     (mis. `12/30`), OTP `112233`
   - VA / QRIS: bayar lewat simulator di <https://simulator.sandbox.midtrans.com>
8. Cek status pengiriman webhook di **Settings → Payment → Notification URL → View
   notification history** (harus "Completed"), lalu cek order lewat `GET /api/orders/:orderId`.

Catatan status: pembayaran kartu tampil **Success** (`capture`), VA/QRIS tampil
**Settlement**. Keduanya dianggap lunas oleh server.

Untuk menguji expire tanpa menunggu 24 jam: pilih VA, jangan dibayar, lalu dari
**Transactions** di dashboard lakukan **Expire** pada transaksi tersebut.

## Changelog

| Tanggal | Perubahan |
|---|---|
| 2026-11-14 | Versi pertama: field pembayaran + alamat, `POST /api/payments/:orderId`, webhook, `PATCH /api/orders/:orderId/cancel`. |
| 2026-11-14 | Webhook diverifikasi dengan `MIDTRANS_SIGNATURE_KEY` (Signature Secret Key). Tidak ada perubahan untuk FE. |
