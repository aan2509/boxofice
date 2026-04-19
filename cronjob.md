# Cron Job BoxOffice

Panduan ini dipakai untuk menjalankan sync dan audit katalog BoxOffice secara otomatis memakai layanan seperti `cron-job.org`.

Tujuannya:

- setiap **jam 00:00 WIB** menjalankan sync katalog
- setiap **jam 12:00 WIB** menjalankan audit katalog
- tetap memakai jalur backend yang sama seperti fitur sync dan audit di panel admin

Jadi pola kerjanya konsisten: cron hanya menjadi pemicu, sedangkan proses utamanya tetap dijalankan oleh route internal project ini.

## Route yang sudah tersedia

Project ini sekarang punya route cron berikut:

- `GET /api/cron/sync-nightly`
- `GET /api/cron/audit`

Keduanya wajib memakai header:

```txt
Authorization: Bearer CRON_SECRET
```

`CRON_SECRET` harus diisi di environment Vercel dan nilainya harus sama dengan yang dipakai di `cron-job.org`.

## Environment yang wajib

Tambahkan env berikut di Vercel:

```env
CRON_SECRET="isi-dengan-secret-panjang-random"
```

Contoh membuat secret:

```bash
openssl rand -hex 32
```

Setelah ditambahkan, redeploy project supaya route cron bisa membaca env terbaru.

## Cara kerja route

### 1. Sync nightly

Route:

```txt
https://layarbox.app/api/cron/sync-nightly
```

Parameter yang didukung:

- `mode=cursor|range`
- `target=home|popular|new|all`
- `slug=nama-job-unik`
- `fromPage=1`
- `toPage=50`

Contoh mode cursor:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home&fromPage=1&toPage=50
```

Contoh mode range:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=range&target=home&fromPage=1&toPage=50
```

Fungsi route ini sekarang punya 2 mode:

- `mode=cursor`
  - setiap hit hanya memproses **1 page**
  - state disimpan di database
  - hit berikutnya lanjut ke page berikutnya
  - ini adalah mode yang direkomendasikan untuk `cron-job.org`

- `mode=range`
  - memproses semua page dalam satu request
  - cocok untuk manual run kecil
  - tidak direkomendasikan untuk nightly sync besar di Vercel

Pada `mode=cursor`, parameter `slug` wajib diperlakukan sebagai identitas job.
Gunakan slug berbeda untuk tiap job agar cursor tidak saling tabrakan.

Contoh:

- `sync-home`
- `sync-popular`
- `sync-new`

Mode cursor akan:

- ambil 1 page sesuai posisi cursor
- simpan posisi berikutnya ke database
- revalidate halaman utama, search, library, browse, detail, dan admin sync

### 2. Audit katalog

Route:

```txt
https://layarbox.app/api/cron/audit
```

Parameter yang didukung:

- `target=home|popular|new|all`
- `batchSize=12`
- `autoHide=true`

Contoh:

```txt
https://layarbox.app/api/cron/audit?target=all&batchSize=12&autoHide=true
```

Fungsi route ini:

- audit film secara bertahap per batch
- cek playable/broken
- sembunyikan judul error jika `autoHide=true`
- revalidate halaman yang terkait setelah selesai

## Best practice yang disarankan

Untuk sync malam hari, pakai **cursor mode** dan **pisah job per target**:

1. job `home`
2. job `popular`
3. job `new`

Kenapa ini paling aman:

- tiap request hanya memproses 1 page
- lebih kecil risiko timeout
- beban upstream lebih rata
- satu target error tidak menghentikan target lain
- mudah dipantau dari log

Untuk audit siang hari, satu job `target=all` masih aman karena audit memang sudah dibatch dari server.

## Jadwal yang direkomendasikan

### Opsi terbaik: cursor per target

Yang paling stabil adalah membuat **3 job cursor terpisah**:

| Job | URL |
|---|---|
| Sync Home Cursor | `https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home&fromPage=1&toPage=50` |
| Sync Popular Cursor | `https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=popular&slug=sync-popular&fromPage=1&toPage=50` |
| Sync New Cursor | `https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=new&slug=sync-new&fromPage=1&toPage=50` |
| Audit All | `https://layarbox.app/api/cron/audit?target=all&batchSize=12&autoHide=true` |

Untuk sync cursor, setiap hit hanya mengerjakan:

- 1 target
- 1 page

Jadi page akan berjalan seperti ini:

- hit 1: page 1
- hit 2: page 2
- hit 3: page 3
- ...
- hit 50: page 50
- hit 51: kembali ke page 1

Kalau kamu ingin sync fokus di malam hari, cron tinggal dibuat berulang dalam interval kecil.

### Interval yang direkomendasikan

Untuk 50 page per target:

- interval **1 menit** = selesai sekitar **50 menit**
- interval **2 menit** = selesai sekitar **100 menit**
- interval **5 menit** = selesai sekitar **250 menit**

Rekomendasi paling enak:

- `home` setiap 2 menit
- `popular` setiap 2 menit
- `new` setiap 2 menit
- audit `all` tetap jam 12 siang

Kalau project kamu kuat, interval 1 menit juga boleh.

## Setting di cron-job.org

Untuk setiap job, isi seperti ini:

### Method

```txt
GET
```

### URL

Isi dengan salah satu URL sesuai jadwal di atas.

### Headers

Tambahkan header berikut:

```txt
Authorization: Bearer ISI_CRON_SECRET_KAMU
```

Contoh format:

```txt
Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Timeout

Kalau ada pengaturan timeout/request timeout, pilih yang paling longgar/tinggi yang tersedia.

### Retry

Kalau ada fitur retry otomatis:

- boleh aktif
- cukup 1 retry
- jangan terlalu agresif supaya upstream tidak dobel dihajar

## Contoh daftar job siap copy

### Job 1 - Sync home cursor

- Name: `BoxOffice Sync Home Cursor`
- Method: `GET`
- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home&fromPage=1&toPage=50
```

- Header:

```txt
Authorization: Bearer ISI_CRON_SECRET_KAMU
```

### Job 2 - Sync popular cursor

- Name: `BoxOffice Sync Popular Cursor`
- Method: `GET`
- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=popular&slug=sync-popular&fromPage=1&toPage=50
```

- Header:

```txt
Authorization: Bearer ISI_CRON_SECRET_KAMU
```

### Job 3 - Sync new cursor

- Name: `BoxOffice Sync New Cursor`
- Method: `GET`
- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=new&slug=sync-new&fromPage=1&toPage=50
```

- Header:

```txt
Authorization: Bearer ISI_CRON_SECRET_KAMU
```

### Job 4 - Audit all

- Name: `BoxOffice Audit All`
- Method: `GET`
- URL:

```txt
https://layarbox.app/api/cron/audit?target=all&batchSize=12&autoHide=true
```

- Header:

```txt
Authorization: Bearer ISI_CRON_SECRET_KAMU
```

## Cara test manual sebelum dipasang ke cron

Kamu bisa tes manual pakai browser client seperti Postman, Insomnia, atau `curl`.

Contoh `curl` paling aman untuk test awal cursor:

```bash
curl -i "https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home-test&fromPage=1&toPage=3" \
  -H "Authorization: Bearer ISI_CRON_SECRET_KAMU"
```

Hit pertama akan memproses page 1. Hit kedua dengan URL yang sama akan memproses page 2. Hit ketiga akan memproses page 3.

Contoh `curl` mode range untuk manual sekali jalan:

```bash
curl -i "https://layarbox.app/api/cron/sync-nightly?mode=range&target=home&fromPage=1&toPage=1" \
  -H "Authorization: Bearer ISI_CRON_SECRET_KAMU"
```

Contoh audit:

```bash
curl -i "https://layarbox.app/api/cron/audit?target=all&batchSize=12&autoHide=true" \
  -H "Authorization: Bearer ISI_CRON_SECRET_KAMU"
```

Kalau berhasil, response akan JSON dengan pola seperti ini:

```json
{
  "ok": true,
  "mode": "cursor",
  "target": "home",
  "processed": {
    "target": "home",
    "page": 1
  },
  "next": {
    "target": "home",
    "page": 2
  },
  "slug": "sync-home-test",
  "summary": {}
}
```

## Catatan penting sebelum test

Mulai dari request kecil dulu:

- sync cursor: `fromPage=1&toPage=3`
- sync range: `fromPage=1&toPage=1`
- audit: `batchSize=12`

Untuk cron nyata, gunakan cursor. Untuk test manual sekali jalan, gunakan range kecil.

Alasannya:

- route sync di project ini tidak hanya ambil daftar film
- route juga bisa melakukan enrichment detail dan validasi stream
- pekerjaan ini cukup berat untuk satu request serverless

Kalau `mode=cursor` berjalan normal, berarti desain cron sudah aman. Kalau `mode=range` timeout, itu wajar karena satu request memikul terlalu banyak kerja.

atau:

```json
{
  "ok": true,
  "target": "all",
  "batchSize": 12,
  "summary": {}
}
```

## Kalau cron gagal, cek bagian ini

### 1. Unauthorized

Kalau response `401 Unauthorized`, biasanya:

- header `Authorization` belum diisi
- format header salah
- `CRON_SECRET` di Vercel beda dengan yang di cron-job

Format yang benar:

```txt
Authorization: Bearer SECRET_KAMU
```

### 2. `CRON_SECRET is not configured`

Berarti env di Vercel belum ada atau belum ikut redeploy.

### 3. Status 502

Berarti route sempat jalan tapi proses internal gagal. Biasanya:

- upstream sedang error
- ada halaman/feed yang timeout
- ada error runtime saat sync atau audit

Solusi:

- cek log Vercel
- pakai `mode=cursor`
- jalankan target per feed, jangan `all`
- kecilkan beban dulu saat manual range, misalnya `fromPage=1&toPage=1`

### 4. Timeout / `FUNCTION_INVOCATION_TIMEOUT`

Kalau request terlalu lama:

- test dulu dengan cursor:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home-test&fromPage=1&toPage=3
```

- pecah sync jadi 3 job cursor: `home`, `popular`, `new`
- jangan jalankan semuanya pada menit yang sama
- bila masih timeout, kecilkan lagi beban per request
- untuk audit, pertahankan `batchSize=12` dulu

Kalau `mode=cursor` masih timeout, berarti bahkan 1 page pun terlalu berat untuk runtime saat ini. Dalam kondisi itu ada 2 opsi:

1. kecilkan lagi kerja sync internal
2. pindahkan sync penuh ke worker/VPS

## Rekomendasi final

Pola yang paling stabil untuk project ini saat ini:

- `sync-home` jalan dengan `mode=cursor`
- `sync-popular` jalan dengan `mode=cursor`
- `sync-new` jalan dengan `mode=cursor`
- `12:00 WIB` audit `all` dengan `batchSize=12`

Dengan pola ini:

- cara kerja tetap sama seperti halaman admin
- lebih aman untuk upstream
- hasil lebih mudah dipantau dari log
- risiko timeout jauh lebih kecil daripada satu job besar

## Catatan penting

- Cron tidak membuat upstream lebih kuat. Cron hanya mengotomatiskan pemicu.
- Kalau upstream sedang down, cron tetap bisa gagal.
- Karena itu pendekatan terbaik untuk BoxOffice sekarang adalah **cursor per target**, bukan satu request besar 1-50 page.

## Template cron-job.org siap copy

Bagian ini dibuat supaya kamu tinggal salin ke `cron-job.org`.

Asumsi:

- domain app kamu: `https://layarbox.app`
- `CRON_SECRET`: `Rahasia25`
- sync dijalankan dengan mode cursor
- audit dijalankan sekali sehari

### Header yang dipakai semua job

```txt
Authorization: Bearer Rahasia25
```

## Opsi paling aman

Pola ini membagi 3 target ke interval berbeda supaya tidak nabrak bersamaan:

- `home` setiap 3 menit
- `popular` setiap 3 menit, offset 1 menit
- `new` setiap 3 menit, offset 2 menit

Dengan pola ini:

- page akan jalan terus per cursor
- beban lebih rata
- tidak perlu bikin 50 job manual

Kalau tujuanmu memang hanya sync malam, kamu bisa aktifkan job ini hanya di jam malam. Kalau mau lebih sederhana, biarkan aktif terus, karena cursor akan tetap melingkar dari page 1 ke 50 lalu kembali lagi.

## Job 1 - Sync Home Cursor

- Title:

```txt
BoxOffice Sync Home Cursor
```

- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=home&slug=sync-home&fromPage=1&toPage=50
```

- Method:

```txt
GET
```

- Header:

```txt
Authorization: Bearer Rahasia25
```

- Schedule:

Kalau timezone `cron-job.org` kamu diatur ke `Asia/Jakarta`:

```txt
Setiap 3 menit
```

Kalau kamu pakai mode cron expression:

```txt
*/3 * * * *
```

## Job 2 - Sync Popular Cursor

- Title:

```txt
BoxOffice Sync Popular Cursor
```

- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=popular&slug=sync-popular&fromPage=1&toPage=50
```

- Method:

```txt
GET
```

- Header:

```txt
Authorization: Bearer Rahasia25
```

- Schedule:

Kalau bisa pilih menit tertentu, offset 1 menit dari Home:

```txt
1-59/3 * * * *
```

## Job 3 - Sync New Cursor

- Title:

```txt
BoxOffice Sync New Cursor
```

- URL:

```txt
https://layarbox.app/api/cron/sync-nightly?mode=cursor&target=new&slug=sync-new&fromPage=1&toPage=50
```

- Method:

```txt
GET
```

- Header:

```txt
Authorization: Bearer Rahasia25
```

- Schedule:

Offset 2 menit dari Home:

```txt
2-59/3 * * * *
```

## Job 4 - Audit All

- Title:

```txt
BoxOffice Audit All
```

- URL:

```txt
https://layarbox.app/api/cron/audit?target=all&batchSize=12&autoHide=true
```

- Method:

```txt
GET
```

- Header:

```txt
Authorization: Bearer Rahasia25
```

- Schedule:

Kalau timezone di `Asia/Jakarta`, jam 12 siang:

```txt
0 12 * * *
```

Kalau timezone masih UTC:

```txt
0 5 * * *
```

## Kalau kamu ingin sync hanya malam hari

Kalau kamu benar-benar ingin sync hanya sekitar tengah malam sampai dini hari, pakai pendekatan ini:

- `home`: aktif sekitar 00:00 - 02:30 WIB
- `popular`: aktif sekitar 00:01 - 02:31 WIB
- `new`: aktif sekitar 00:02 - 02:32 WIB

Tetapi karena pengaturan window waktu di `cron-job.org` lebih ribet daripada recurring biasa, praktik yang paling simpel biasanya:

- biarkan 3 job cursor tetap aktif sepanjang hari
- audit tetap jalan sekali di jam 12 siang

Dengan begitu katalog akan selalu berputar dan tetap fresh, tanpa harus mengurus window malam manual.
