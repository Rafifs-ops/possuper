# POSSuper

Aplikasi **Point of Sale (POS) offline-first** untuk UMKM: kasir dengan pemindaian barcode, manajemen produk & stok, kalkulator HPP, pencatatan biaya operasional, laporan laba rugi yang dapat diekspor ke PDF/Excel, serta **backup & restore data antar perangkat** lewat satu file JSON. Tersedia sebagai web app (Vite), **PWA yang dapat di-install dari browser**, dan aplikasi Android (Capacitor), dengan seluruh data bisnis disimpan lokal di perangkat pengguna.

> **Tidak ada backend/API server.** Aplikasi ini 100% client-side: tidak ada request HTTP ke server aplikasi, tidak ada autentikasi, dan tidak ada sinkronisasi cloud. Bagian [API dan Lapisan Data](#api-dan-lapisan-data) menjelaskan operasi data lokal (Dexie/IndexedDB) beserta parameter dan contoh payload-nya, karena itulah "API" yang tersedia di project ini.

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Tech Stack](#tech-stack)
3. [Arsitektur](#arsitektur)
4. [Model Data](#model-data)
5. [API dan Lapisan Data](#api-dan-lapisan-data)
6. [Cara Menjalankan Project](#cara-menjalankan-project)
7. [Struktur Halaman Frontend](#struktur-halaman-frontend)
8. [Sistem Desain](#sistem-desain)
9. [Responsive dan Aksesibilitas](#responsive-dan-aksesibilitas)
10. [PWA (Progressive Web App)](#pwa-progressive-web-app)
11. [Distribusi Android (APK)](#distribusi-android-apk)
12. [Batasan dan Catatan](#batasan-dan-catatan)

---

## Fitur Utama

### Kasir & transaksi
- Pemindaian barcode produk (kamera perangkat, `@capacitor/barcode-scanner`).
- Penambahan produk ke keranjang lewat ID manual atau pencarian nama.
- Validasi stok saat menambah/menambah kuantitas; qty di keranjang tidak bisa melebihi stok sistem.
- Perhitungan otomatis total penjualan, total HPP, dan estimasi keuntungan per transaksi.
- Checkout menyimpan transaksi, mengurangi stok produk, membuat token nota (JWT), lalu membuka halaman struk.
- Peringatan konfirmasi jika meninggalkan halaman kasir dengan keranjang belum selesai.

### Produk & inventori
- Tambah produk baru dengan ID barcode/SKU, nama, harga jual, HPP, dan stok awal.
- **Nilai stok awal (quantity × HPP) otomatis dicatat sebagai kas keluar** kategori pembelian persediaan saat produk baru disimpan (lihat [Integrasi kas produk baru](#integrasi-kas-produk-baru)).
- **Penambahan stok produk lama juga otomatis dicatat sebagai kas keluar** sebesar jumlah tambahan × HPP saat itu; pengurangan/koreksi stok tidak membuat kas keluar.
- Scan barcode langsung ke kolom ID saat mencatat produk.
- Daftar produk dengan pencarian (nama, ID, harga) dan pagination 10 item/halaman.
- Edit nama/harga/HPP lewat modal; tambah/kurangi stok langsung dari daftar.
- Hapus produk dengan pengamanan: produk yang stoknya masih > 0 tidak bisa dihapus.

### Biaya & laporan
- Input pengeluaran per kategori dan per bulan, dengan rincian keterangan yang bisa diedit/dihapus inline.
- Dashboard periode: 1 bulan tertentu, 1 semester terakhir, atau seluruh waktu.
- Ringkasan penjualan, HPP, laba bersih, dan nilai persediaan.
- Ranking produk paling laku & paling sepi pada periode terpilih.
- Ekspor laporan laba rugi ke PDF (jsPDF + autoTable) dan Excel (SheetJS).
- Riwayat penjualan dengan filter tanggal, pencarian, grouping per bulan, pagination, unduh nota, dan hapus riwayat.

### Backup & restore (migrasi perangkat)
- Ekspor seluruh data bisnis (produk, penjualan, pengeluaran, snapshot persediaan, profil toko) ke satu file JSON ber-`metadata` dan `schemaVersion`.
- Unduh file di web (Blob) atau tulis ke penyimpanan + native share sheet di Android (WhatsApp, Bluetooth, Google Drive, dll.).
- Impor file JSON dari perangkat lain lewat file picker; isi file divalidasi menyeluruh sebelum database disentuh.
- Preview ringkasan backup (nama toko, tanggal, jumlah record) + konfirmasi sebelum restore.
- **Full restore / replace** dalam satu transaksi Dexie: gagal di tengah = rollback penuh, tidak ada data setengah jalan.
- **Restore selektif**: pengguna dapat mencentang tabel mana yang dipulihkan (produk, penjualan, pengeluaran, snapshot persediaan, profil toko); tabel yang tidak dipilih tidak disentuh.
- Profil toko disinkronkan ke state + cache `smartpos_store_profile` setelah restore; hook snapshot persediaan dijeda agar nilai tidak terhitung ganda.
- Tidak ada backend/cloud: file backup hanya berpindah lewat media pilihan pengguna.

### Identitas & pendukung
- Identitas toko (nama, alamat, no. HP) dipakai pada struk, PDF, dan Excel; wajib diisi sebelum membuka kasir.
- Struk digital dengan QR code yang menautkan ke halaman verifikasi nota eksternal.
- Panduan istilah keuangan (akordeon), halaman Tentang, kebijakan privasi, dan syarat & ketentuan.
- Notifikasi toast untuk success/warning/error/info.
- Tombol back Android ditangani agar konsisten dengan navigasi aplikasi.
- UI responsif 320px–1920px, tema POSSuper (background `#F4F9F6`, primary `#2A9D8F`, accent `#264653`, text `#1D2D2A`).

### PWA & distribusi aplikasi
- **Installable PWA**: manifest + service worker membuat POSSuper dapat di-install dari browser (desktop/Android) dan dibuka dalam mode standalone.
- Kartu **Install POSSuper** di homepage dengan deferred `beforeinstallprompt`; browser tanpa dukungan prompt mendapat petunjuk manual sesuai perangkat (Chrome desktop, Android, iOS Safari).
- **Offline app shell**: setelah kunjungan online pertama berhasil, app shell dan route SPA dapat dibuka kembali tanpa koneksi. IndexedDB tetap menjadi sumber data utama.
- Banner **Download Android APK** di homepage untuk pengunjung web, dengan tautan ke folder Google Drive resmi. Banner disembunyikan di aplikasi Android native dan saat PWA standalone.

### Thermal Printer Bluetooth
- Cetak struk langsung ke printer thermal Bluetooth (SPP / BLE / Wi-Fi) tanpa unduh PDF.
- Plugin: `@delicity/capacitor-thermal-printer` v8.5.5 (Capacitor 8).
- Protokol: ESC/POS (generik), plus dukungan SDK Epson, Star, Brother, Zebra (opsional).
- Cari & pilih printer Bluetooth, hubungkan, putuskan koneksi dari halaman Pengaturan Printer.
- Set printer default tersimpan native oleh plugin (auto-reconnect saat cetak berikutnya).
- Ukuran kertas 58mm (32 kolom) atau 80mm (48 kolom).
- Test print untuk memverifikasi printer berfungsi.
- Cetak struk dari ReceiptView (setelah transaksi) dan cetak ulang dari Riwayat Penjualan.
- QR verifikasi nota ikut tercetak pada struk thermal.
- Permission Android ditangani otomatis oleh plugin (BLUETOOTH_SCAN, BLUETOOTH_CONNECT untuk Android 12+; BLUETOOTH, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION untuk Android ≤ 11).
- Hanya tersedia di aplikasi Android; di web browser, tombol cetak dinonaktifkan dan pengguna diarahkan ke unduh PDF.

---

## Tech Stack

| Kategori | Teknologi | Versi (package.json) | Dipakai untuk |
|---|---|---|---|
| Framework UI | Vue 3 (`<script setup>`) | `^3.5.42` | Seluruh halaman & komponen |
| Build tool | Vite | `^8.2.2` | Dev server, build produksi |
| Plugin Vue | `@vitejs/plugin-vue` | `^6.0.8` | Kompilasi SFC |
| Styling | Tailwind CSS 4 + `@tailwindcss/vite` | `^4.3.3` | Design token & utility class |
| Routing | Vue Router (history mode) | `^5.3.1` | 15 route halaman + guard |
| Database lokal | Dexie (IndexedDB) | `^4.4.7` | Penyimpanan produk, penjualan, biaya, profil |
| Tanggal | dayjs | `^1.11.23` | Format tanggal/bulan laporan |
| JWT | jose | `^6.2.13` | Token nota (`tokenNota`) |
| PDF | jsPDF + jspdf-autotable | `^4.2.1` / `^5.0.9` | Nota & laporan laba rugi |
| Excel | SheetJS (`xlsx`) | `^0.18.5` | Ekspor laporan laba rugi |
| QR code | `qrcode` | `^1.5.4` | QR verifikasi nota |
| Mobile runtime | Capacitor | `^8.6.0` | Android shell, kamera, filesystem, share |
| Barcode | `@capacitor/barcode-scanner` | `^3.1.3` | Scan barcode via kamera |
| File & share | `@capacitor/filesystem`, `@capacitor/share` | `^8.1.5` / `^8.0.3` | Simpan & bagikan PDF/Excel dan file backup JSON |
| Thermal printer | `@delicity/capacitor-thermal-printer` | `^8.5.5` | Cetak struk via Bluetooth SPP/BLE/Wi-Fi (ESC/POS) |
| App lifecycle | `@capacitor/app` | `^8.1.2` | Listener tombol back Android |
| Dev tools | `vite-plugin-vue-devtools` | `^8.2.1` | Debug Vue saat development |
| PWA | `vite-plugin-pwa` (Workbox) | `^2.0.0` | Manifest, service worker, precache app shell (web/PWA saja) |

Catatan:
- **Pinia** terpasang di dependency (`^4.0.3`) tetapi **tidak digunakan** di kode; state global memakai module-scoped `ref` pada composable.
- Tidak ada library HTTP (axios/fetch wrapper) karena tidak ada backend.
- Splash screen Android ditangani oleh theme + drawable native, bukan plugin JS.

---

## Arsitektur

### Gambaran

POSSuper adalah **Single Page Application (SPA)** dengan arsitektur berlapis:

```
┌─────────────────────────────────────────────────────────────┐
│  Views (src/pages/*.vue)                                    │
│  Halaman: Home, Kasir, Dashboard, Produk, Biaya, Riwayat…    │
└───────────────┬─────────────────────────────────────────────┘
                │ props / events
┌───────────────▼─────────────────────────────────────────────┐
│  Components (src/components/*.vue)                          │
│  CartItem, ScanInput, ScanSummary, RincianBiaya,            │
│  RankingProduk, ProductSearchModal, ToastNotification       │
└───────────────┬─────────────────────────────────────────────┘
                │ function calls
┌───────────────▼─────────────────────────────────────────────┐
│  Composables / service layer (src/composables)              │
│  useProducts · useScanCart · useStoreProfile · useToast     │
│  useBackup · useProduct · useThermalPrinter                 │
│  Utils: pdfHandler · excelHandler · backupHandler           │
│          thermalPrinter (escposCommands, receiptFormatter,   │
│          printerService)                                    │
└───────────────┬─────────────────────────────────────────────┘
                │ Dexie queries + hooks
┌───────────────▼─────────────────────────────────────────────┐
│  Data layer (src/database/db.js)                            │
│  Dexie schema v1 + v2, helper biaya, helper profil,          │
│  hook snapshot persediaan                                   │
└───────────────┬─────────────────────────────────────────────┘
                │ IndexedDB / localStorage
┌───────────────▼─────────────────────────────────────────────┐
│  Perangkat pengguna (browser / WebView Android)             │
└─────────────────────────────────────────────────────────────┘

Platform adapters (Capacitor): barcode scanner, filesystem,
share, thermal printer, app back button.
```

### Prinsip yang dipakai

- **Offline-first**: semua data bisnis berada di IndexedDB; aplikasi tidak membutuhkan koneksi internet untuk operasional.
- **Single source of truth**: warna & primitive UI ada di `src/assets/main.css`; schema data ada di `src/database/db.js`.
- **Service layer tipis**: komponen tidak menulis langsung ke Dexie, kecuali query laporan lanjutan (riwayat, dashboard) yang memakai `db` langsung.
- **Tanpa state management eksternal**: `useProducts`, `useStoreProfile`, dan `useToast` menyimpan state pada level modul (module-scoped `ref`) sehingga otomatis shared antar halaman tanpa Pinia.
- **Progressive enhancement mobile**: fitur native (scan, share, thermal printer) dipakai saat berjalan di Capacitor; di web, aplikasi tetap berfungsi untuk input manual dan unduh file.

### Struktur folder

```
possuper/
├── android/                      # Project Android (Capacitor)
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── assets/               # Build web yang disalin (hasil cap copy)
│       └── res/                  # Ikon launcher, splash, strings, theme
├── assets/
│   └── icon.png                  # Source icon untuk @capacitor/assets
├── public/
│   ├── possuper_logo.png         # Logo mark (dipakai Home & About & favicon)
│   ├── possuper_logo_wordmark.png
│   ├── favicon.ico
│   ├── manifest.webmanifest      # Manifest PWA (nama, icon, theme, scope)
│   └── icons/                    # Icon PWA 192/512, maskable 512, apple-touch 180
├── src/
│   ├── App.vue                   # RouterView + Toast + listener back button
│   ├── main.js                   # Bootstrap Vue + router + CSS
│   ├── assets/main.css           # Design token & primitive UI
│   ├── router/index.js           # 15 route + guard /scan
│   ├── pages/                    # 15 halaman
│   │   ├── HomeView.vue
│   │   ├── ScanView.vue
│   │   ├── InputView.vue
│   │   ├── ListView.vue
│   │   ├── HppView.vue
│   │   ├── BiayaView.vue
│   │   ├── DashboardView.vue
│   │   ├── CashFlowView.vue
│   │   ├── ReceiptView.vue
│   │   ├── SalesHistoryView.vue
│   │   ├── StoreProfileView.vue
│   │   ├── BackupView.vue
│   │   ├── PrinterSettingsView.vue
│   │   ├── AboutView.vue
│   │   └── GuideView.vue
│   ├── components/               # 7 komponen reusable
│   ├── composables/              # State & service layer (useBackup, useThermalPrinter, usePwaInstall)
│   ├── services/                 # Profit report & cash flow service (pure logic)
│   ├── database/db.js            # Schema Dexie + helper domain + hook snapshot
│   └── utils/                    # PDF, Excel, backup & thermal printer handler
├── capacitor.config.json
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

### Alur data contoh: checkout kasir

1. `ScanView` memakai `useScanCart()` untuk mengelola keranjang (`barangDitemukan`, `totalPenjualan`, `totalKeuntungan`, `totalHppKasir`).
2. Setiap penambahan produk memanggil `useProducts().getProduct(id)` → validasi stok → update total.
3. Saat **Selesai Transaksi**:
   - `loadStoreProfileFromDb()` memastikan identitas toko tersedia.
   - Token nota dibuat dengan `jose` (`HS256`) berisi tanggal, total, items, dan identitas toko.
   - `db.penjualan.add(...)` menyimpan transaksi.
   - `decreaseProductStock(id, qty)` mengurangi stok; hook Dexie memperbarui snapshot `persediaan`.
   - Keranjang direset, lalu router menuju `/receipt?id=<idPenjualan>`.
4. `ReceiptView` membaca transaksi dari Dexie, membuat QR (`qrcode`) menuju viewer nota eksternal, dan menyediakan unduh PDF.

### Penyimpanan lokal & kompatibilitas

- Database Dexie bernama **`SmartPosUmkmDb`** (nama legacy) — **sengaja tidak diubah** agar data pengguna yang sudah ada tidak hilang.
- Cache profil toko di localStorage memakai key **`smartpos_store_profile`** (legacy) — juga dipertahankan untuk kompatibilitas.
- Profil toko disimpan ganda: Dexie `profilToko` (persisten) + localStorage (cache sinkron untuk kebutuhan ekspor PDF/Excel).
- Preferensi thermal printer di localStorage: **`possuper_default_printer_id`** (ID printer default) dan **`possuper_paper_width`** (58 atau 80). Profil detail printer disimpan native oleh plugin `@delicity/capacitor-thermal-printer`.
- Semua tanggal transaksi disimpan sebagai string `YYYY-MM-DD HH:mm:ss`; periode biaya memakai `YYYY-MM`.

---

## Model Data

Skema Dexie (`src/database/db.js`):

```js
// Versi 1
produk:      'id, nama, harga, hpp, quantity, createdAt'
penjualan:   '++id, tanggal, totalPenjualan, totalHpp, *items'
pengeluaran: '++id, &[bulanTahun+jenis], bulanTahun, jenis, nominal'
persediaan:  'bulanTahun, totalNilai'

// Versi 2 (menambah tabel profil)
profilToko:  'id'

// Versi 3 (menambah tabel arus kas)
kasManual:   '++id, tanggal, tipe, aktivitas, kategori'
saldoAwalKas: 'id'
```

| Tabel | Primary key | Field | Keterangan |
|---|---|---|---|
| `produk` | `id` (string, barcode/SKU) | `nama`, `harga`, `hpp`, `quantity`, `createdAt` | `harga` & `hpp` dalam rupiah; `quantity` stok saat ini |
| `penjualan` | `id` (auto increment) | `tanggal`, `totalPenjualan`, `totalHpp`, `items[]`, `tokenNota` | `items[]` berisi produk terjual; `tokenNota` JWT |
| `pengeluaran` | `id` (auto increment) + unique `[bulanTahun+jenis]` | `bulanTahun`, `jenis`, `nominal`, `keterangan[]` | Satu record per kategori per bulan; `nominal` = total rincian |
| `persediaan` | `bulanTahun` | `totalNilai` | Snapshot nilai stok (`Σ qty × hpp`) per bulan |
| `profilToko` | `id` (selalu `1`) | `namaToko`, `alamatToko`, `noHp`, `updatedAt` | Satu profil toko aktif |
| `kasManual` | `id` (auto increment) | `tanggal`, `tipe`, `aktivitas`, `kategori`, `keterangan`, `nominal`, `metodePembayaran`, `catatan`, `createdAt`, `sumber?`, `sumberId?` | Transaksi kas manual (modal, beli stok/aset, pinjaman, dll). Record otomatis produk baru memakai `sumber: 'produk_baru'` + `sumberId` = ID/SKU produk |
| `saldoAwalKas` | `id` (selalu `1`) | `saldoAwal`, `berlakuSejak`, `updatedAt` | Satu konfigurasi saldo awal kas |

Nilai `jenis` pengeluaran: `pemasaran`, `listrik_air_internet`, `perlengkapan`, `admin`, `pajak`, `sewa`, `lain_lain`.

Item di dalam `penjualan.items[]` dan `pengeluaran.keterangan[]`:

```json
// penjualan.items[]
{ "id": "8990001", "nama": "Kopi Sachet", "harga": 5000, "hpp": 3000, "quantity": 2 }

// pengeluaran.keterangan[]
{ "id": 1761811200123, "text": "Cetak brosur", "nominal": 150000, "tanggal": "2026-10-30 15:20" }
```

> `quantity` pada `penjualan.items[]` adalah **jumlah terjual**, bukan stok tersisa.

---

## API dan Lapisan Data

### Penting: tidak ada endpoint HTTP

- Tidak ada `fetch`, `axios`, atau server API di project ini.
- Semua operasi baca/tulis dilakukan langsung ke IndexedDB melalui Dexie.
- Karena itu, tabel di bawah memakai kolom **Metode HTTP = — (lokal)**. Istilah "endpoint" di sini merujuk pada **operasi lapisan data** dan **route halaman**.
- Ketika di-deploy sebagai web, semua path SPA (mis. `GET /dashboard`) akan mengembalikan `index.html`; navigasi berikutnya ditangani Vue Router di browser.
- Tidak ada autentikasi/otorisasi. `tokenNota` (JWT) **bukan** token login; fungsinya hanya sebagai penanda nota yang ditanam di QR.

### Routing halaman (client-side)

| Path | Name | Komponen | Parameter / query | Guard |
|---|---|---|---|---|
| `/` | `home` | `HomeView` | — | — |
| `/scan` | `scan` | `ScanView` | — | Wajib profil toko lengkap; jika belum → redirect `/store-profile` + toast warning |
| `/input` | `input` | `InputView` | Query opsional `newId` → mengisi otomatis kolom ID (untuk deep-link; belum ada tautan internal yang memakainya) | — |
| `/list` | `list` | `ListView` | — | — |
| `/hpp` | `hpp` | `HppView` | — | — |
| `/biaya` | `biaya` | `BiayaView` | — | — |
| `/dashboard` | `dashboard` | `DashboardView` | — | — |
| `/receipt` | `receipt` | `ReceiptView` (lazy) | Query `id` (number) = ID penjualan | — |
| `/history` | `history` | `SalesHistoryView` (lazy) | — | — |
| `/store-profile` | `store-profile` | `StoreProfileView` (lazy) | — | — |
| `/backup` | `backup` | `BackupView` (lazy) | — | — |
| `/printer-settings` | `printer-settings` | `PrinterSettingsView` (lazy) | — | — |
| `/cash-flow` | `cash-flow` | `CashFlowView` (lazy) | — | — |
| `/about` | `about` | `AboutView` (lazy) | — | — |
| `/guide` | `guide` | `GuideView` (lazy) | — | — |

### Produk

Modul: `src/composables/useProduct.js` — state `productList` dibagi antar halaman.

| Operasi | Fungsi | Parameter | Return |
|---|---|---|---|
| Ambil semua produk | `loadProducts()` | — | `Promise<void>` (mengisi `productList`, urut `createdAt` terbaru) |
| Ambil satu produk | `getProduct(id)` | `id: string` | `Promise<Produk atau undefined>` |
| Tambah / upsert produk | `addProduct(product)` | `product: Produk` | `Promise<void>` (tanpa pencatatan kas) |
| Tambah produk baru + kas stok awal | `addProductWithStokAwal(product)` | `product: Produk` | `Promise<Record kas atau null>` (atomik, hanya untuk SKU baru) |
| Tambah stok + kas pembelian | `tambahStokDenganKas(id, jumlah)` | `id: string`, `jumlah: number` (> 0) | `Promise<Record kas atau null>` (atomik; jumlah tambahan × HPP) |
| Hapus produk | `deleteProduct(id)` | `id: string` | `Promise<void>` |
| Kurangi stok (penjualan) | `decreaseProductStock(id, qtySold)` | `id: string`, `qtySold: number` | `Promise<void>` (stok minimum 0) |
| Ubah stok manual | `ubahStokAman(id, penambahan)` | `id: string`, `penambahan: number` (+/-) | `Promise<void>` (stok minimum 0, refresh list) |
| Ubah detail produk | `updateProductDetails(id, data)` | `id: string`, `data: { nama?, harga?, hpp? }` | `Promise<void>` (refresh list) |

Contoh body `addProduct(product)`:

```json
{
  "id": "8990001",
  "nama": "Kopi Sachet Spesial",
  "harga": 5000,
  "hpp": 3000,
  "quantity": 20,
  "createdAt": 1761811200000
}
```

Contoh `updateProductDetails`:

```js
await updateProductDetails('8990001', { nama: 'Kopi Sachet', harga: 5500, hpp: 3000 });
// body: { "nama": "Kopi Sachet", "harga": 5500, "hpp": 3000 }
```

Perilaku:
- `addProduct` memakai `put()` (upsert), sehingga ID yang sudah ada akan diperbarui. UI `InputView` sudah mencegah duplikasi lebih dulu.
- `addProductWithStokAwal` dipakai oleh **Catat Produk** (`InputView`): produk dan kas keluar pembelian stok awal ditulis dalam satu transaksi Dexie (`produk` + `kasManual`). Jika SKU sudah ada, produk diperbarui tanpa kas keluar baru.
- `tambahStokDenganKas` dipakai oleh tombol **+ (Tambah Stok)** di **Daftar Inventaris** (`ListView`): stok bertambah dan kas keluar `jumlah × HPP` ditulis dalam satu transaksi Dexie. Pengurangan stok tetap memakai `ubahStokAman` tanpa kas keluar.
- Perubahan `quantity`/`hpp`/penghapusan produk otomatis memicu hook Dexie untuk memperbarui `persediaan` bulan berjalan.

### Transaksi penjualan

Checkout dilakukan di `ScanView.prosesPenjualan()` (bukan fungsi composable terpisah).

**Tulis transaksi — `db.penjualan.add(payload)`**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `tanggal` | `string` | ya | Format `YYYY-MM-DD HH:mm:ss` |
| `totalPenjualan` | `number` | ya | Total harga jual |
| `totalHpp` | `number` | ya | Total modal/HPP |
| `items` | `array` | ya | Produk terjual (lihat contoh) |
| `tokenNota` | `string` | ya | JWT HS256 hasil `jose` |

Contoh payload:

```json
{
  "tanggal": "2026-10-30 15:20:11",
  "totalPenjualan": 10000,
  "totalHpp": 6000,
  "items": [
    { "id": "8990001", "nama": "Kopi Sachet", "harga": 5000, "hpp": 3000, "quantity": 2 }
  ],
  "tokenNota": "<JWT_HS256>"
}
```

Isi payload JWT (`tokenNota`):

```json
{
  "tanggal": "2026-10-30 15:20:11",
  "totalPenjualan": 10000,
  "totalHpp": 6000,
  "items": [{ "id": "8990001", "nama": "Kopi Sachet", "harga": 5000, "hpp": 3000, "quantity": 2 }],
  "namaToko": "Warung POSSuper",
  "alamatToko": "Jl. Melati No. 10, Bandung",
  "noHp": "081234567890",
  "iat": 1761811211
}
```

**Baca & hapus riwayat** (`SalesHistoryView`, `ReceiptView`):

```js
// Semua riwayat, terbaru lebih dulu
const riwayat = await db.penjualan.orderBy('id').reverse().toArray();

// Satu transaksi untuk struk (/receipt?id=)
const transaksi = await db.penjualan.get(Number(route.query.id));

// Hapus riwayat
await db.penjualan.delete(id);
```

Filter riwayat dilakukan di memori: pencarian mencocokkan `id`, nama produk, atau harga; filter tanggal membandingkan 10 karakter pertama `tanggal` (`YYYY-MM-DD`).

### Pengeluaran (biaya)

Modul: `src/database/db.js`.

| Operasi | Fungsi | Parameter | Return |
|---|---|---|---|
| Ambil rincian 1 kategori/bulan | `getPengeluaranKategoriBulan(bulanTahun, jenis)` | `bulanTahun: 'YYYY-MM'`, `jenis: JenisBiaya` | `Promise<Record>` (`nominal`, `keterangan[]`) atau default kosong |
| Tambah rincian | `tambahRincianBiaya(bulanTahun, jenis, text, nominal)` | 4 argumen (lihat tabel) | `Promise<Record>` |
| Update rincian | `updateRincianBiaya(bulanTahun, jenis, itemId, textBaru, nominalBaru)` | 5 argumen | `Promise<Record atau null>` |
| Hapus rincian | `hapusRincianBiaya(bulanTahun, jenis, itemId)` | 3 argumen | `Promise<Record atau null>` |

Detail parameter:

| Parameter | Tipe | Keterangan |
|---|---|---|
| `bulanTahun` | `string` | Format `YYYY-MM`, contoh `2026-10` |
| `jenis` | `string` | Salah satu dari 7 kategori biaya |
| `text` / `textBaru` | `string` | Keterangan; default `"Pengeluaran"` jika kosong |
| `nominal` / `nominalBaru` | `number` atau `string` | Dikonversi ke number; default 0 |
| `itemId` | `number` | ID rincian (`Date.now() + random`) |

Contoh pemanggilan:

```js
await tambahRincianBiaya('2026-10', 'pemasaran', 'Cetak brosur', 150000);
await updateRincianBiaya('2026-10', 'pemasaran', 1761811200123, 'Cetak brosur & banner', 275000);
await hapusRincianBiaya('2026-10', 'pemasaran', 1761811200123);
```

Bentuk record yang tersimpan:

```json
{
  "id": 3,
  "bulanTahun": "2026-10",
  "jenis": "pemasaran",
  "nominal": 150000,
  "keterangan": [
    { "id": 1761811200123, "text": "Cetak brosur", "nominal": 150000, "tanggal": "2026-10-30 15:20" }
  ]
}
```

Perilaku:
- `nominal` pada record selalu dihitung ulang dari total seluruh `keterangan[]`.
- Jika rincian terakhir dihapus, record pengeluaran ikut dihapus.
- Satu kategori hanya punya satu record per bulan (unique compound index `[bulanTahun+jenis]`).

### Profil toko

Modul: `src/database/db.js` + `src/composables/useStoreProfile.js`.

| Operasi | Fungsi | Parameter | Return |
|---|---|---|---|
| Baca profil (async, Dexie) | `getIdentitasToko()` | — | `Promise<{ namaToko, alamatToko, noHp } atau null>` |
| Simpan profil (Dexie) | `simpanIdentitasToko(data)` | `data: ProfilToko` | `Promise<ProfilToko>` (dengan `id: 1`, `updatedAt`) |
| Simpan via composable | `useStoreProfile().saveProfile(data)` | `data: ProfilToko` | `Promise<ProfilToko>` (Dexie + state + localStorage) |
| Muat ke state | `loadStoreProfileFromDb()` | — | `Promise<ProfilToko>` |
| Baca sinkron (ekspor) | `getStoredProfileSync()` | — | `ProfilToko` |
| Cek kelengkapan | `isStoreProfileComplete` (computed) | — | `boolean` (`namaToko` & `alamatToko` terisi) |

Contoh body `saveProfile`:

```json
{
  "namaToko": "Warung POSSuper",
  "alamatToko": "Jl. Melati No. 10, Bandung",
  "noHp": "081234567890"
}
```

Record `profilToko` yang tersimpan:

```json
{
  "id": 1,
  "namaToko": "Warung POSSuper",
  "alamatToko": "Jl. Melati No. 10, Bandung",
  "noHp": "081234567890",
  "updatedAt": "2026-10-30T08:20:00.000Z"
}
```

### Persediaan (snapshot bulanan)

Tidak ada endpoint publik; diperbarui otomatis oleh hook Dexie pada tabel `produk`:

- **create**: `+ (quantity × hpp)`
- **update**: selisih `(qtyBaru × hppBaru) − (qtyLama × hppLama)`
- **delete**: `− (quantity × hpp)`

Snapshot disimpan per bulan berjalan:

```json
{ "bulanTahun": "2026-10", "totalNilai": 450000 }
```

Dibaca oleh dashboard:

```js
const snapshot = await db.persediaan.get('2026-10');          // periode bulan
const snapshot = await db.persediaan.orderBy('bulanTahun').last(); // semester / semua
```

### Notifikasi (toast)

Modul: `src/composables/useToast.js`.

| Operasi | Fungsi | Parameter | Return |
|---|---|---|---|
| Tampilkan toast | `showToast(message, type?, duration?)` | `message: string`, `type?: 'success' / 'error' / 'warning' / 'info'` (default `success`), `duration?: number` (ms, default `3000`) | `void` |
| Sembunyikan toast | `hideToast()` | — | `void` |

State: `toastState = { show, message, type }`. Hanya satu toast aktif; pemanggilan baru mereset timer.

### Ekspor PDF & Excel

| Operasi | Fungsi | Parameter | Hasil |
|---|---|---|---|
| Simpan/bagikan PDF | `saveAndSharePDF(doc, filename)` | `doc: jsPDF`, `filename: string` | Native: tulis ke cache + dialog Share; Web: `doc.save()` |
| Unduh nota PDF | `generateAndDownloadReceiptPDF(transaksi, preGeneratedQrBase64?)` | `transaksi: Penjualan`, `preGeneratedQrBase64?: string` | PDF nota (header accent, tabel item, QR) |
| Ekspor laba rugi Excel | `exportLabaRugiExcel(periodeParam)` | `periodeParam: 'YYYY-MM' / '1 Semester Terakhir' / 'Seluruh Waktu'` | File `.xlsx` via Filesystem + Share |
| Ekspor laba rugi PDF | `eksporLabaRugi()` (lokal di `DashboardView`) | — | PDF ringkasan laba rugi |

Contoh parameter Excel:

```js
await exportLabaRugiExcel('2026-10');
await exportLabaRugiExcel('1 Semester Terakhir');
await exportLabaRugiExcel('Seluruh Waktu');
```

### Backup & restore (ekspor / impor JSON)

Modul: `src/utils/backupHandler.js` (util), `src/composables/useBackup.js` (state + toast), `src/pages/BackupView.vue` (UI).

| Operasi | Fungsi | Parameter | Return |
|---|---|---|---|
| Kumpulkan semua tabel | `collectBackupData()` | — | `Promise<{ produk, penjualan, pengeluaran, persediaan, profilToko, kasManual, saldoAwalKas }>`. Semua record, tanpa filter periode |
| Susun payload backup | `buildBackupPayload()` | — | `Promise<BackupPayload>` (format, schemaVersion, metadata, data) |
| Rakit file backup | `createBackupFile()` | — | `Promise<{ payload, json: string, filename: string }>` |
| Simpan file (web/Android) | `saveBackupJson(json, filename)` | `json: string`, `filename: string` | `Promise<{ platform: 'web atau android', filename, uri, shared }>` |
| Baca & validasi file | `readBackupFile(file)` | `file: File` (hasil input type=file) | `Promise<{ payload, summary, fileName }>`; melempar `BackupValidationError` bila tidak valid |
| Validasi payload | `validateBackupPayload(payload)` | `payload: object` | `BackupSummary` atau melempar `BackupValidationError` |
| Pulihkan data | `restoreBackup(payload, tables?)` | `payload: object` (hasil parse file), `tables?: string[]` (daftar tabel yang dipulihkan; default seluruh tabel) | `Promise<{ tables, counts }>`; transaksi `rw` Dexie, rollback bila gagal |
| State halaman | `useBackup()` | — | `{ isExporting, isReadingFile, isRestoring, stats, lastBackupAt, pendingBackup, selectedTables, hasSelectedTables, isTableSelected, toggleTable, loadStats, exportData, selectBackupFile, cancelPendingBackup, restorePendingBackup }` |

Format file backup (schemaVersion 2):

```json
{
  "format": "possuper-backup",
  "schemaVersion": 2,
  "metadata": {
    "appName": "POSSuper",
    "appVersion": "0.0.0",
    "exportedAt": "2026-10-30T15:30:00.000Z",
    "storeName": "Warung POSSuper",
    "counts": { "produk": 25, "penjualan": 150, "pengeluaran": 20, "persediaan": 12, "profilToko": 1, "kasManual": 3, "saldoAwalKas": 1 }
  },
  "data": {
    "produk": [], "penjualan": [], "pengeluaran": [], "persediaan": [], "profilToko": [],
    "kasManual": [], "saldoAwalKas": []
  }
}
```

Nama file: `POSSuper-Backup-YYYY-MM-DD-HHmmss.json`.

**Kompatibilitas mundur**: file backup `schemaVersion: 1` (tanpa `kasManual` & `saldoAwalKas`) tetap bisa diimpor — tabel yang hilang otomatis dinormalkan ke array kosong. Restore menghasilkan transaksi kas ganda hanya jika file v2 sudah berisi data yang sama dengan tabel lokal (restore bersifat replace, bukan merge).

Contoh pemanggilan:

```js
import { createBackupFile, saveBackupJson, readBackupFile, restoreBackup } from '../utils/backupHandler';

// 1. Ekspor
const { json, filename } = await createBackupFile();
await saveBackupJson(json, filename);   // web: Blob download · Android: Filesystem + Share

// 2. Impor
const { payload } = await readBackupFile(filePilihan);   // validasi menyeluruh, DB belum disentuh
await restoreBackup(payload);                            // semua tabel
await restoreBackup(payload, ['penjualan', 'pengeluaran']); // hanya tabel terpilih
```

Restore selektif:
- Tabel yang dipilih dibersihkan lalu diisi ulang dari file; tabel sisanya tidak dibuka sama sekali.
- `resolveRestoreTables(tables)` menjaga pasangan `produk` + `persediaan` selalu ikut bersama (snapshot diturunkan dari data produk).
- Pilihan kosong ditolak dengan `BackupValidationError` (UI juga menonaktifkan tombol restore).
- Setiap file dipilih ulang, pilihan kembali ke seluruh tabel.

Alur pemulihan:
1. Salinan murni payload (tanpa reactive proxy) lalu validasi ulang.
2. `db.transaction('rw', produk, penjualan, pengeluaran, persediaan, profilToko)` — clear lalu `bulkPut`/`bulkAdd` dengan primary key asli.
3. Hook snapshot persediaan dijeda lewat `withSnapshotTrackingPaused()` (coba/akhir selalu di-reset) sehingga snapshot dari file tidak dihitung ulang; tabel `persediaan` dipulihkan paling akhir.
4. Verifikasi jumlah record di dalam transaksi; selisih apa pun membuat transaksi gagal (rollback).
5. Setelah sukses: `applyStoreProfile()` (state + localStorage legacy) dan refresh `useProducts()` + statistik halaman.

Pesan toast: `Yeay! Backup data berhasil dibuat.` · `Berhasil! Seluruh data toko sudah dipulihkan.` · `File backup tidak valid atau mengalami kerusakan.` · `Ups, data gagal dipulihkan. Data sebelumnya tetap aman.` · `Gagal membuat file backup. Silakan coba lagi.`

### Integrasi eksternal

| Integrasi | Arah | Detail |
|---|---|---|
| Note viewer (QR nota) | URL yang ditanam di QR, **bukan** request dari aplikasi | `https://rafifs-ops.github.io/note-viewer-smartpos/?t=<tokenNota>` (token JWT) |
| Email dukungan | `mailto:` | `windysuyono06@gmail.com` dari halaman Tentang |
| Capacitor Share | native | Membuka sheet share Android untuk PDF/Excel |
| Thermal printer | native (Bluetooth/Wi-Fi) | `@delicity/capacitor-thermal-printer` — cetak struk ESC/POS |

### Thermal Printer Bluetooth

Modul: `src/utils/thermalPrinter/` (escposCommands, receiptFormatter, printerService), `src/composables/useThermalPrinter.js`, `src/pages/PrinterSettingsView.vue`.

Fitur ini memungkinkan cetak struk langsung ke printer thermal Bluetooth tanpa unduh PDF. **Hanya berfungsi di aplikasi Android**; di web browser, tombol cetak dinonaktifkan dan pengguna diarahkan ke unduh PDF.

#### Plugin & protokol

- **Plugin**: `@delicity/capacitor-thermal-printer` v8.5.5 (Capacitor 8).
- **Protokol utama**: ESC/POS generik via Bluetooth Classic (SPP), BLE, dan Wi-Fi (TCP 9100).
- **SDK brand** (opsional, aktif otomatis jika binary tersedia): Star (auto via Maven Central), Epson, Brother, Zebra (perlu drop binary manual).
- Plugin menangani: discovery multi-sumber, dedup, auto-reconnect (3 attempts backoff eksponensial), chunking paket transport, dan permission Android.

#### Cara menghubungkan printer

1. Buka **Pengaturan Printer** dari menu utama (`/printer-settings`).
2. Tekan **Cari Printer** — plugin akan memindai Bluetooth Classic, BLE, dan jaringan Wi-Fi (timeout default 10 detik).
3. Pilih printer dari daftar (menampilkan nama, alamat/MAC, transport, adapter).
4. Tekan **Hubungkan** — plugin membuka koneksi dan memverikasinya. Jika berhasil, tombol berubah status "Terhubung".
5. Tekan **Jadikan Default** — profil printer disimpan native oleh plugin.

#### Cara mengatur printer default & ukuran kertas

- **Default**: setelah koneksi berhasil, tekan "Jadikan Default". Profil tersimpan native oleh plugin (`setDefaultPrinter`). Saat mencetak tanpa `printerId`, plugin otomatis memakai default + auto-reconnect.
- **Ukuran kertas**: pilih **58mm** (32 kolom) atau **80mm** (48 kolom) di bagian "Ukuran Kertas". Preferensi disimpan di localStorage key `possuper_paper_width`. Nilai 80mm adalah default.

#### Cara test print

Di halaman Pengaturan Printer, setelah terhubung, tekan **Test Print**. Plugin akan mengirim struk uji yang berisi nama toko, nama printer, ukuran kertas, dan waktu cetak.

#### Cara cetak struk

- **Setelah transaksi** (ReceiptView): tombol **Cetak Struk** di atas tombol Unduh PDF. Jika belum ada printer default, pengguna diarahkan ke `/printer-settings`.
- **Cetak ulang** (SalesHistoryView): tombol **Cetak Struk** di setiap kartu riwayat transaksi. Menggunakan record `penjualan` yang sudah ada — **tidak membuat transaksi baru** dan **tidak memodifikasi data**.

#### Format struk thermal

Struk dibentuk oleh `buildReceiptModel()` → layout blok → `modelToPrintItems()` → plugin `printText()`. Struktur:

1. Nama toko (bold, double-size, center)
2. Alamat toko & no. HP (center)
3. Divider
4. Nomor transaksi (`Transaksi #<id>`) dan tanggal/waktu
5. Divider
6. Detail item: nama produk (wrapped), qty × harga satuan, subtotal rata kanan
7. Divider
8. TOTAL (bold, dari `totalPenjualan` yang tersimpan)
9. Ucapan terima kasih + branding POSSuper
10. QR verifikasi nota (tokenNota asli dari record)
11. Feed + cut (partial)

QR berisi URL `https://rafifs-ops.github.io/note-viewer-smartpos/?t=<tokenNota>` — token JWT yang sudah tersimpan di record `penjualan`, **tidak dibuat baru** saat mencetak.

#### Encoding & karakter

- Teks di-encode ke Windows-1252 via `encodeText()`. Karakter di luar Latin-1 (mis. CJK) diganti `?`.
- Karakter khusus CP1252 (€, €, –, —, dll.) dipetakan ke kode yang benar.
- Nama produk panjang di-wrap otomatis ke baris berikutnya sesuai kolom kertas.

#### API composable `useThermalPrinter`

State: `isConnected`, `isConnecting`, `isScanning`, `isPrinting`, `availablePrinters`, `connectedPrinter`, `paperWidth`, `error`, `isSupported`, `hasDefaultPrinter`, `defaultPrinterId`.

Fungsi: `init()`, `scanPrinters(timeoutMs)`, `connectPrinter(printer, setAsDefault)`, `disconnectPrinter()`, `setDefaultPrinter(printer)`, `setPaperWidth(mm)`, `printTestReceipt()`, `printReceipt(transaksi, { printerId })`, `checkConnection()`.

State bersifat module-scoped (shared antar halaman, sama seperti `useProducts`/`useToast`). `isPrinting` mencegah double-print.

#### Storage

| Key | Lokasi | Isi |
|---|---|---|
| Profil printer default | Native (plugin) | id, name, address, transport, adapter, capabilities |
| `possuper_default_printer_id` | localStorage | ID printer default (sinkron dengan profil plugin) |
| `possuper_paper_width` | localStorage | Lebar kertas: `58` atau `80` (default `80`) |

#### Pesan error (Indonesia)

Plugin melempar error dengan kode stabil. `printerService.js` meng-normalisasi ke pesan Indonesia: `PRINTER_NOT_FOUND`, `CONNECTION_FAILED`, `PERMISSION_DENIED`, `BLUETOOTH_DISABLED`, `PAPER_EMPTY`, `COVER_OPEN`, `SDK_NOT_AVAILABLE`, `TIMEOUT`, dll. Pesan lengkap di `src/utils/thermalPrinter/printerConstants.js` → `ERROR_MESSAGES`.

Pesan saat platform tidak didukung: `Pencetakan Bluetooth memerlukan aplikasi Android POSSuper. Gunakan "Unduh PDF" di web browser.`

### Laporan Keuntungan & Arus Kas

Modul: `src/services/profitReportService.js` (perhitungan keuntungan) dan `src/services/cashFlowService.js` (arus kas). Halaman: `DashboardView.vue` (ringkasan + tren + widget kas) dan `CashFlowView.vue` (riwayat kas lengkap, route `/cash-flow`).

#### Konsep laporan keuntungan

Dashboard menyajikan alur perhitungan yang mudah dipahami UMKM:

```text
TOTAL PENJUALAN (OMZET)     ← Σ totalPenjualan dari record penjualan
         ↓ dikurangi HPP
KEUNTUNGAN KOTOR            ← penjualan − HPP
         ↓ dikurangi Biaya Operasional
ESTIMASI LABA USAHA         ← kotor − biaya operasional
```

- **Istilah "Estimasi Laba Usaha"** dipakai, bukan "Laba Bersih", karena ini bukan laporan keuangan diaudit.
- **Margin** = `(estimasiLabaUsaha / totalPenjualan) × 100`, dengan proteksi divide-by-zero.

#### Formula perhitungan

| Komponen | Formula | Sumber data |
|---|---|---|
| Total penjualan | `Σ penjualan[].totalPenjualan` | `db.penjualan` (filter tanggal) |
| HPP | `Σ penjualan[].totalHpp` | Record transaksi — **tidak dihitung ulang** dengan harga modal saat ini |
| Keuntungan kotor | `totalPenjualan − totalHpp` | — |
| Biaya operasional | `Σ keterangan[].nominal` (rincian, per tanggal) | `db.pengeluaran[].keterangan[]` |
| Estimasi laba usaha | `keuntunganKotor − totalBiayaOperasional` | — |
| Margin keuntungan | `(laba / penjualan) × 100` | — |

**Filter pengeluaran**: rincian dengan tanggal valid difilter berdasarkan tanggal rincian; rincian tanpa tanggal (data lama) jatuh ke fallback `bulanTahun` record induk. Hanya `keterangan[].nominal` yang dihitung — **tidak** `pengeluaran.nominal` sekaligus (mencegah double-count).

#### Konsep laporan arus kas

Metode **langsung** (direct method). Sumber arus kas:

1. **Otomatis dari penjualan** → kas masuk, asumsi dibayar pada tanggal transaksi.
2. **Otomatis dari rincian pengeluaran** → kas keluar, asumsi dibayar pada tanggal pencatatan (fallback `bulanTahun`).
3. **Otomatis dari pencatatan produk baru & penambahan stok** → kas keluar pembelian persediaan sebesar `quantity × HPP` stok awal atau `jumlah tambahan × HPP` (lihat [Integrasi kas produk baru](#integrasi-kas-produk-baru)).
4. **Manual** (`db.kasManual`) → modal pemilik, pinjaman, pembelian stok/aset, pengambilan uang pemilik, dll.

Setiap transaksi masuk satu dari tiga aktivitas:

| Aktivitas | Contoh |
|---|---|
| **Operasi** | Penerimaan penjualan, listrik/air/internet, sewa, pemasaran, perlengkapan |
| **Investasi** | Pembelian peralatan/mesin, penjualan aset usaha |
| **Pendanaan** | Tambahan modal pemilik, pinjaman diterima/dibayar, pengambilan uang pemilik |

Pembelian persediaan (operasi) **tidak dicampur** dengan pembelian aset tetap (investasi).

#### Rumus arus kas

```js
kasMasuk    = Σ transaksi masuk (periode)
kasKeluar   = Σ transaksi keluar (periode)
arusKasBersih = kasMasuk − kasKeluar
saldoAkhir  = saldoAwalPeriode + arusKasBersih
```

**Saldo awal periode** dihitung dari `saldoAwalKas.saldoAwal` + seluruh transaksi setelah `berlakuSejak` dan sebelum awal periode terpilih (running balance konsisten).

Jika saldo awal belum disetel: kas masuk/keluar/bersih tetap ditampilkan; **saldo akhir tidak ditampilkan** dan pengguna diarahkan untuk mengatur saldo awal.

#### Sumber & deduplikasi

- Transaksi penjualan & pengeluaran **tidak disalin** ke tabel baru — di-derive saat dibaca.
- `kasManual` hanya untuk transaksi yang **tidak** tercatat di penjualan/pengeluaran.
- Setiap entry ditandai `sumber` (`penjualan` / `pengeluaran` / `manual` / `produk_baru` / `penambahan_stok`) agar bisa dikenali di riwayat.
- Transaksi otomatis tidak bisa diedit/dihapus dari riwayat kas — arahkan ke modul sumbernya.

#### Disclaimer arus kas

Penerimaan & pembayaran direkonstruksi dari pencatatan dengan asumsi telah diselesaikan pada tanggal transaksi. **Bukan** rekonsiliasi rekening bank atau saldo fisik yang sudah diverifikasi.

#### Cara menggunakan Riwayat Kas

1. Buka **Riwayat Kas** dari menu utama (`/cash-flow`).
2. Atur **Saldo Awal Kas** (nominal + tanggal berlaku) — opsional tapi disarankan.
3. Pilih periode (hari ini, 7 hari, bulan ini, bulan sebelumnya, seluruh waktu, atau khusus).
4. Filter jenis (masuk/keluar), aktivitas (operasi/investasi/pendanaan), atau cari keterangan.
5. Tekan **+ Catat Transaksi Kas** untuk mencatat modal, pembelian stok/aset, pinjaman, dll.
6. Transaksi manual bisa diedit/dihapus; transaksi otomatis hanya bisa dilihat dengan tautan ke modul sumbernya.

### Integrasi kas produk baru

Saat pengguna mencatat produk baru lewat menu **Catat Produk** (`/input`), nilai stok awal otomatis dicatat sebagai **kas keluar** di laporan arus kas. Tujuannya agar pembelian persediaan yang diisi saat pendaftaran produk ikut tercermin di arus kas.

#### Rumus

```js
totalHppProduk = quantity × hpp;
// Contoh: 10 unit × Rp3.000 = Rp30.000
```

#### Record yang disimpan

Record ditulis ke tabel `kasManual` (sumber data yang sudah dibaca `cashFlowService`) dengan bentuk:

```json
{
  "tanggal": "2026-11-10 15:30:00",
  "tipe": "keluar",
  "aktivitas": "operasi",
  "kategori": "pembelian_persediaan",
  "keterangan": "Pembelian stok awal - Kopi Sachet",
  "nominal": 30000,
  "metodePembayaran": "tunai",
  "catatan": "Otomatis dari pencatatan produk baru",
  "sumber": "produk_baru",
  "sumberId": "8990001",
  "createdAt": "2026-11-10T08:30:00.000Z"
}
```

| Field | Nilai |
|---|---|
| `tipe` | `keluar` |
| `aktivitas` | `operasi` |
| `kategori` | `pembelian_persediaan` |
| `nominal` | `Math.round(quantity × hpp)`; tidak ada record bila hasilnya ≤ 0 |
| `tanggal` | Waktu penyimpanan produk (`YYYY-MM-DD HH:mm:ss`) |
| `sumber` / `sumberId` | `produk_baru` / ID/SKU produk untuk identifikasi & jejak sumber |

#### Kapan kas keluar dicatat (dan kapan tidak)

| Skenario | Kas keluar baru? |
|---|---|
| SKU/ID baru dengan quantity > 0 dan HPP > 0 | ✅ satu record sesuai `quantity × HPP` |
| Quantity 0 atau HPP 0 | ❌ tidak ada record (nominal tidak valid) |
| SKU sudah ada (proses ditolak `InputView`) | ❌ tidak ada record kedua |
| Update produk existing (nama, harga jual, HPP) | ❌ tidak ada record |
| Tambah stok produk lama di Daftar Inventaris | ✅ satu record sesuai `jumlah tambahan × HPP` saat itu |
| Kurangi stok / koreksi stok turun | ❌ tidak ada record |
| Hapus produk | ❌ histori kas tidak dihapus |
| Restore backup JSON / impor data | ❌ restore menulis tabel langsung dengan hook dijeda, tidak memanggil fungsi kas |
| Penyimpanan produk gagal | ❌ kas keluar ikut rollback (satu transaksi Dexie) |

#### Penambahan stok produk lama

Tombol **+ (Tambah Stok)** di Daftar Inventaris (`/list`) mencatat pembelian persediaan sebagai kas keluar. Nominal memakai **HPP produk saat tombol ditekan**:

```js
nominal = jumlahTambahan × hppProdukSaatIni;
// Contoh: tambah 1 unit produk HPP Rp3.000 → Rp3.000
```

Record `kasManual` yang dibuat:

```json
{
  "tanggal": "2026-11-10 16:00:00",
  "tipe": "keluar",
  "aktivitas": "operasi",
  "kategori": "pembelian_persediaan",
  "keterangan": "Penambahan stok 1 - Kopi Sachet",
  "nominal": 3000,
  "metodePembayaran": "tunai",
  "catatan": "Otomatis dari penambahan stok produk",
  "sumber": "penambahan_stok",
  "sumberId": "8990001"
}
```

Perilaku:
- Hanya penambahan > 0 yang dicatat; tombol **− (Kurangi Stok)** dan koreksi stok turun **tidak** membuat kas keluar.
- Perubahan stok dan kas keluar atomik dalam satu transaksi (`produk` + `kasManual`); gagal salah satu = rollback.
- Snapshot `persediaan` tetap diperbarui sekali oleh hook Dexie existing (selisih quantity × HPP).
- Jika HPP produk 0, tidak ada record kas (nominal tidak valid), tetapi stok tetap bertambah.
- HPP yang dipakai adalah HPP saat penambahan; mengubah HPP setelahnya tidak menghitung ulang histori kas.

#### Pencegahan double counting & atomicity

- Produk dan kas keluar ditulis dalam satu transaksi `db.transaction('rw', db.produk, db.kasManual)`. Gagal di salah satu langkah = keduanya batal.
- Di dalam transaksi, `db.produk.get(id)` diperiksa ulang sebelum menulis kas. ID yang sudah ada hanya di-upsert tanpa kas baru, sehingga pemanggilan berulang tidak menggandakan transaksi.
- Snapshot `persediaan` tetap diperbarui **satu kali** oleh hook Dexie existing pada tabel `produk`; transaksi ini tidak menulis `persediaan` secara manual sehingga tidak ada perhitungan ganda.
- Record otomatis bertanda `sumber: 'produk_baru'` atau `sumber: 'penambahan_stok'` sehingga tidak tercampur dengan kas manual, penjualan, atau pengeluaran.
- `tambahStokDenganKas` membaca produk di dalam transaksi dan mencatat kas hanya untuk selisih stok yang benar-benar bertambah, sehingga klik ganda tetap tercatat sesuai jumlah unit yang benar-benar ditambahkan.

#### Sinkronisasi laporan

Setelah produk tersimpan atau stok ditambah: inventory dan snapshot persediaan diperbarui hook existing, lalu entry kas langsung terbaca oleh `cashFlowService` (`getSemuaCashFlowEntries` / `getArusKasPeriode`). Entry muncul di Riwayat Kas, ringkasan kas keluar, tren arus kas, perhitungan saldo berjalan/saldo akhir (bila saldo awal diatur), dan widget Arus Kas Dashboard — tanpa refresh manual tambahan. Setelah tambah stok, Daftar Inventaris juga menampilkan toast nominal kas keluar yang tercatat.

#### Dampak ke laporan keuntungan

- Pembelian persediaan **mengurangi kas**, tetapi **tidak otomatis menjadi biaya HPP** pada laporan keuntungan.
- HPP pada laporan keuntungan tetap berasal dari `penjualan[].totalHpp`, yaitu barang yang benar-benar terjual.
- Penambahan persediaan tidak mengurangi estimasi laba usaha secara langsung, dan nilai stok tetap mengikuti snapshot `persediaan` existing.

### Format return & error

- Sebagian besar fungsi tulis (`addProduct`, `tambahRincianBiaya`, dll.) menangkap error di dalam dan menulis `console.error`. Beberapa melempar error ke pemanggil (`simpanIdentitasToko`, `exportLabaRugiExcel`), lalu halaman terkait menampilkan toast error.
- `getProduct` mengembalikan `undefined` bila ID tidak ditemukan; `useScanCart` menampilkan toast warning.
- `getPengeluaranKategoriBulan` selalu mengembalikan objek (default `nominal: 0`, `keterangan: []`) agar UI aman.
- `getIdentitasToko` mengembalikan `null` bila belum ada profil.

---

## Cara Menjalankan Project

### Prasyarat

- **Node.js** `^22.18.0 || >=24.12.0` (lihat `engines` di package.json)
- npm (atau package manager kompatibel)
- Untuk build Android: Android Studio + JDK yang sesuai Capacitor 8

### Install & development

```bash
# 1. Install dependency
npm install

# 2. Jalankan dev server (default http://localhost:5173)
npm run dev
```

### Build produksi

```bash
npm run build     # output ke dist/
npm run preview   # pratinjau build produksi secara lokal
```

### Menjalankan di Android (Capacitor)

```bash
npm run build
npx cap copy android     # salin dist/ ke android/app/src/main/assets/public
npx cap sync android     # sinkronkan plugin native (lakukan setelah menambah plugin)
npx cap open android     # buka project di Android Studio
```

Konfigurasi native:
- `capacitor.config.json` → `appId: com.rafifebrians.possuper`, `appName: POSSuper`, `webDir: dist`.
- `android/variables.gradle` → `minSdkVersion = 26` (naik dari 24 karena Star SDK di plugin thermal printer membutuhkan API 26).
- Label aplikasi Android: `android/app/src/main/res/values/strings.xml` (`app_name = POSSuper`).
- Ikon launcher & splash: `android/app/src/main/res/mipmap-*` dan `drawable*/splash.png`.
- Permission Bluetooth **tidak perlu ditambah manual** ke `AndroidManifest.xml` — plugin `@delicity/capacitor-thermal-printer` menyediakan permission-nya sendiri (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` untuk Android 12+; `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION` untuk Android ≤ 11).

### Reset data lokal (development)

Data tersimpan di IndexedDB dan localStorage browser/WebView:

1. Buka DevTools → **Application** → **IndexedDB** → hapus database `SmartPosUmkmDb`.
2. Hapus localStorage key `smartpos_store_profile` (profil toko cache).
3. Hapus localStorage key `possuper_default_printer_id` dan `possuper_paper_width` (preferensi printer thermal).
4. Jalankan aplikasi dari halaman `/store-profile` untuk mengisi identitas toko.

> Menghapus data ini akan menghilangkan seluruh produk, transaksi, biaya, dan preferensi printer yang tersimpan di perangkat.

### Scripts

| Script | Perintah | Fungsi |
|---|---|---|
| `dev` | `vite` | Dev server dengan HMR |
| `build` | `vite build` | Build produksi ke `dist/` |
| `preview` | `vite preview` | Serve hasil build |

Unit test thermal printer (tanpa framework test):

```bash
# 88 test thermal printer
node --experimental-loader ./tests/esm-loader.mjs tests/thermalPrinter.test.js

# 45 test laporan keuntungan & arus kas
node --experimental-loader ./tests/esm-loader.mjs tests/financialReport.test.js
```

Tidak ada script test/lint lain di project ini.

---

## Struktur Halaman Frontend

### Route & halaman

| Route | Halaman | Fungsi utama | Data yang dipakai |
|---|---|---|---|
| `/` | `HomeView` | Menu utama (bento grid), branding POSSuper, pintasan ke semua fitur | — |
| `/scan` | `ScanView` | Kasir: scan barcode, input ID, cari produk, keranjang, checkout | `produk`, `penjualan`, `profilToko` |
| `/input` | `InputView` | Form catat produk baru + scan ID | `produk` |
| `/list` | `ListView` | Inventori: cari, edit, atur stok, hapus, pagination | `produk` |
| `/hpp` | `HppView` | Kalkulator HPP per unit & rekomendasi harga jual | state lokal (tidak disimpan) |
| `/biaya` | `BiayaView` | Input & kelola rincian pengeluaran per kategori/bulan | `pengeluaran` |
| `/dashboard` | `DashboardView` | Ringkasan bisnis, laporan keuntungan, tren, pengeluaran, produk, widget arus kas, ekspor | `penjualan`, `pengeluaran`, `persediaan`, `kasManual`, `saldoAwalKas` |
| `/receipt` | `ReceiptView` | Struk transaksi + QR + unduh PDF | `penjualan`, `profilToko` |
| `/history` | `SalesHistoryView` | Riwayat transaksi, filter, unduh nota, hapus | `penjualan` |
| `/store-profile` | `StoreProfileView` | Identitas toko + live preview nota | `profilToko` |
| `/backup` | `BackupView` | Ekspor & impor backup JSON, checklist restore selektif, preview, konfirmasi restore, panduan pindah perangkat | semua tabel bisnis (read-only di UI) |
| `/printer-settings` | `PrinterSettingsView` | Pengaturan thermal printer: cari/hubungkan/putuskan printer, set default, pilih ukuran kertas, test print | state printer (localStorage + plugin profile) |
| `/cash-flow` | `CashFlowView` | Riwayat kas: ringkasan, filter, CRUD kas manual, saldo awal, running balance | `penjualan`, `pengeluaran`, `kasManual`, `saldoAwalKas` |
| `/about` | `AboutView` | Info aplikasi, privasi, syarat & ketentuan | — |
| `/guide` | `GuideView` | Panduan istilah keuangan (akordeon) | data statis |

### Anatomi layout

Semua halaman mengikuti pola **shell → header → body**. Primitive UI berikut tersedia dan didefinisikan di `src/assets/main.css`:

```
.page-shell                  → min-h-screen, background #F4F9F6, text #1D2D2A
├── .page-header             → band accent #264653, rounded bawah, dekorasi blur primary
│   ├── .page-title          → judul halaman (putih)
│   └── .page-subtitle       → pill subtitle (primary-soft di atas accent)
└── .page-body               → container max-w-xl, padding & gap konsisten
    ├── .card / .card-soft   → surface utama / highlight primary-tint
    ├── .field               → input, select, textarea
    ├── .btn-primary         → CTA (primary-strong, teks putih, lolos AA)
    ├── .btn-secondary       → aksi sekunder/outline
    ├── .chip / .icon-tile   → label & ikon
    ├── .modal-overlay       → backdrop accent + blur
    │   └── .modal-panel     → panel modal (max-h 85vh, scroll internal)
    └── .empty-state         → kondisi kosong
```

### Komponen reusable

| Komponen | Dipakai di | Peran |
|---|---|---|
| `CartItem.vue` | `ScanView` | Baris keranjang: nama, qty, subtotal, margin, kontrol +/- dan hapus |
| `ScanInput.vue` | `ScanView` | Tombol scan barcode, input ID manual, tombol buka pencarian |
| `ScanSummary.vue` | `ScanView` | Dua kartu ringkasan: total penjualan & estimasi keuntungan |
| `ProductSearchModal.vue` | `ScanView` | Modal pencarian produk (nama/ID) + status stok |
| `RincianBiaya.vue` | `DashboardView` | Grid 7 kategori biaya, akordeon rincian, modal tambah/edit/hapus |
| `RankingProduk.vue` | `DashboardView` | Produk paling laku & paling sepi |
| `ToastNotification.vue` | `App.vue` | Toast global success/error/warning/info |

### Guard & navigasi

- Guard `router.beforeEach` hanya membatasi `/scan`: tanpa `namaToko` + `alamatToko`, pengguna diarahkan ke `/store-profile` dengan toast warning.
- `App.vue` menangani tombol back Android:
  - di `/` → keluar aplikasi;
  - di halaman lain → `router.back()`, fallback ke `/`.
- `ScanView` memakai `onBeforeRouteLeave` untuk konfirmasi bila keranjang masih berisi item.
- `scrollBehavior` mengembalikan posisi scroll saat back/forward, selain itu scroll ke atas.

---

## Sistem Desain

Warna didefinisikan terpusat sebagai design token Tailwind 4 di `src/assets/main.css`.

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-background` | `#F4F9F6` | Background utama halaman & area konten |
| `--color-primary` | `#2A9D8F` | Aksen, ikon, indikator aktif, highlight |
| `--color-accent` | `#264653` | Header, navigasi, heading penekanan |
| `--color-ink` | `#1D2D2A` | Teks utama, heading, label, tabel |
| `--color-primary-strong` | `#1E7B6F` | Permukaan CTA terisi (kontras 5.1:1 dengan teks putih) |

Token turunan: `surface`, `surface-muted`, `surface-sunken`, `primary-hover/-active/-soft/-tint`, `accent-hover/-soft/-tint`, `ink-secondary`, `ink-muted`, `border`, `border-strong`, serta status `success`, `warning`, `danger`, `info` (masing-masing dengan varian `-soft`).

Aturan singkat:
- Jangan menulis warna hardcoded di komponen; gunakan token.
- Status sistem tetap dibedakan secara visual (bukan dipaksa memakai primary).
- `--color-primary-strong` hanya untuk permukaan terisi yang memuat teks; `--color-primary` tetap untuk aksen agar identitas brand tetap kuat.

---

## Responsive dan Aksesibilitas

- Layout diuji pada lebar **320, 375, 390, 768, 1440, dan 1920 px** tanpa horizontal overflow.
- Grid menu & kartu menyesuaikan kolom; form memakai lebar penuh pada layar kecil.
- Modal dibatasi `max-h-[85vh]` dan lebarnya mengikuti viewport sehingga tidak terpotong.
- Tombol aksi utama berukuran 40–56 px dan kontrol kecil (pagination, ikon +/-) 32–36 px; semua memiliki state hover/active/disabled/focus-visible.
- Teks tombol primary memakai `#1E7B6F` agar kontras teks putih mencapai **5.1:1** (WCAG AA); hover 6.4:1, active 8.0:1.
- Teks utama `#1D2D2A` di atas `#F4F9F6` memiliki rasio 13.5:1.

---

## Audit & Refactoring (2025)

Full project audit & refactoring dilakukan untuk memastikan integritas data, konsistensi perhitungan, dan kualitas kode.

### Critical Fixes
- **Atomic checkout (ScanView)**: Penyimpanan transaksi penjualan + pengurangan stok produk dibungkus dalam satu transaksi Dexie (`rw`, `penjualan` + `produk`). Jika gagal di tengah, seluruh operasi rollback — mencegah penjualan tersimpan tapi stok tidak berkurang.
- **useBackup profile clobber**: Restore selektif tidak lagi memaksa update profil toko jika tabel `profilToko` tidak dipilih atau data kosong.
- **useProduct error swallowing**: Semua operasi tulis (`addProduct`, `deleteProduct`, `decreaseProductStock`, `ubahStokAman`, `updateProductDetails`) melempar error kembali sehingga caller bisa menampilkan toast error yang benar.
- **Excel handler konsistensi**: `exportLabaRugiExcel` sekarang menggunakan `profitReportService` (sama dengan Dashboard) untuk perhitungan `totalPengeluaran` dari `keterangan[]` dan periode filter yang konsisten. Ditambah fallback web (Blob download) bila tidak di Capacitor.
- **DB race conditions**: Diperbaiki `tambahRincianBiaya` & snapshot update untuk operasi atomic yang aman dari concurrent write.

### High Fixes
- **Dead code removed**: `RincianBiaya.vue` (18.3 KB) & `RankingProduk.vue` (3.8 KB) — tidak di-import di halaman manapun, dihapus.
- **Missing try/catch**: Ditambahkan ke `ListView` (edit/stok/hapus), `BiayaView` (`muatRincianEksisting`), `ReceiptView` (load + PDF), `SalesHistoryView` (load + PDF), `DashboardView` (PDF export).
- **CashFlowView search**: Dihapus `@input="muatData"` di search input — filtering sudah client-side via `entriesTerfilter`, tidak perlu reload DB tiap keystroke.
- **ListView page clamp**: Watcher pada `totalPages` memaksa `currentPage` ke halaman valid saat search mempersempit hasil; search term reset ke halaman 1.

### Medium Improvements
- **Shared constants**: `EXPENSE_CATEGORY_LABELS` diekstrak ke `src/constants/expenseCategories.js` — digunakan oleh `BiayaView`, `DashboardView`, `excelHandler` (sebelumnya duplikat di 3 file).
- **Pagination composable**: `usePagination` diekstrak ke `src/composables/usePagination.js` — digunakan oleh `ListView` & `SalesHistoryView` (sebelumnya duplikat logika pagination).
- **Unused imports cleaned**: `useStoreProfile.js` (hapus `db`), `AboutView.vue` (hapus `currentYear`), `pdfHandler.js` (hapus side-effect `import 'jspdf-autotable'` duplicate).
- **DashboardView**: Hapus import ganda `jspdf-autotable`.

### Verification
- `npm run build` ✅ (1.41s, no warnings)
- Unit tests: 45 `financialReport.test.js` + 88 `thermalPrinter.test.js` = **133 passed, 0 failed**
- `npx cap sync android` ✅ (6 plugins synced)

---

## PWA (Progressive Web App)

POSSuper versi website dapat di-install sebagai PWA langsung dari browser. PWA **bukan file APK**: instalasi memakai fasilitas install browser setelah website memenuhi syarat (HTTPS/localhost, manifest valid, service worker terdaftar, dan icon tersedia).

### File & konfigurasi

| File | Fungsi |
|---|---|
| `public/manifest.webmanifest` | Nama, `short_name`, `start_url`, `scope`, `display: standalone`, warna tema, dan icon |
| `public/icons/icon-192.png` | Icon PWA 192×192 |
| `public/icons/icon-512.png` | Icon PWA 512×512 |
| `public/icons/icon-maskable-512.png` | Icon maskable 512×512 (logo berada di safe zone, tidak terpotong) |
| `public/icons/apple-touch-icon-180.png` | Icon iOS (Add to Home Screen) |
| `vite.config.js` | Konfigurasi `vite-plugin-pwa` (Workbox `generateSW`) |
| `src/main.js` | Registrasi service worker via `virtual:pwa-register`, hanya di web |
| `src/composables/usePwaInstall.js` | Deteksi install prompt, status standalone, petunjuk manual per perangkat |
| `src/pages/HomeView.vue` | Kartu **Install POSSuper** di homepage |
| `index.html` | Link manifest, theme color, apple touch icon, meta install |

Manifest memakai warna brand: `theme_color` `#264653`, `background_color` `#F4F9F6`, dengan icon logo POSSuper. Manifest dan seluruh icon disajikan dari root (`/manifest.webmanifest`, `/icons/...`).

### Service worker & strategi caching

- Dibuat otomatis oleh `vite-plugin-pwa` (Workbox `generateSW`) saat `npm run build` → `dist/sw.js` + `dist/workbox-*.js`.
- **Precache** hanya berisi file hasil build (HTML, JS, CSS, icon, manifest) — app shell. Tidak ada runtime caching untuk respons API karena aplikasi tidak punya backend.
- **Navigation fallback** ke `index.html`, sehingga route Vue Router (`/dashboard`, `/cash-flow`, dll.) tetap dapat dibuka saat offline.
- `registerType: 'autoUpdate'` + `cleanupOutdatedCaches`, `skipWaiting`, dan `clientsClaim`: versi cache lama dibersihkan dan service worker baru mengambil alih tanpa menumpuk cache lama.
- Registrasi service worker **hanya di web** (`!Capacitor.isNativePlatform()`). Aplikasi Android native memuat aset dari WebView lokal dan tidak mendaftarkan service worker, sehingga tidak ada konflik cache.
- **Data bisnis tidak pernah disimpan di Cache Storage.** Service worker tidak meng-cache file backup JSON, transaksi, atau data pribadi. Semua data tetap di IndexedDB (`SmartPosUmkmDb`), dan mekanisme backup/restore tidak diubah.

### Cara install

**Chrome/Edge desktop**
1. Buka website POSSuper melalui HTTPS (atau `localhost` saat development).
2. Klik ikon **Install** di address bar, atau menu browser → **Install POSSuper**.
3. Atau klik tombol **Install** pada kartu di homepage.

**Android (Chrome/Edge)**
1. Buka website POSSuper.
2. Buka menu browser (⋮) → **Install app** / **Add to Home Screen**.
3. Jika tersedia, tombol **Install** pada kartu homepage juga menjalankan prompt instalasi.

**iOS Safari**
1. Buka website POSSuper di Safari.
2. Ketuk tombol **Share**.
3. Pilih **Add to Home Screen**.

iOS Safari tidak mendukung `beforeinstallprompt`, sehingga kartu homepage menampilkan petunjuk manual (bukan tombol palsu).

### Kemampuan offline & batasan

- Setelah **satu kunjungan online yang berhasil**, app shell tersimpan dan aplikasi dapat dibuka kembali tanpa koneksi, termasuk navigasi internal antar route.
- IndexedDB, backup/restore JSON, ekspor PDF/Excel, QR nota, kasir, dashboard, dan arus kas tetap berfungsi sebagaimana di web.
- PWA **tidak** memiliki integrasi thermal printer Bluetooth; fitur itu hanya tersedia di APK Android. Di PWA/web, gunakan **Unduh PDF** untuk struk.
- Prompt instalasi bergantung pada browser: `beforeinstallprompt` tidak tersedia di iOS Safari dan sebagian browser lain. Untuk browser tersebut, gunakan petunjuk manual.
- PWA membutuhkan **secure context** (HTTPS di produksi, `localhost` saat development). Konfigurasi saat ini mengasumsikan deployment di root `/` (seperti konfigurasi Vercel). Jika di-deploy pada subdirektori, sesuaikan `base` Vite, `start_url`, `scope`, dan path icon.
- Klaim offline hanya berlaku setelah app shell benar-benar tersimpan; kunjungan pertama tetap membutuhkan koneksi.

## Distribusi Android (APK)

Selain web dan PWA, POSSuper tersedia sebagai aplikasi Android native (Capacitor) yang mendukung fitur native seperti thermal printer Bluetooth dan berbagi file lewat share sheet.

### Link download

Folder Google Drive resmi APK POSSuper:

**https://drive.google.com/drive/folders/1-weQy7-INxHfwsDavmZi8SxbSjBtOaZZ?usp=sharing**

Link ini ditampilkan pada banner homepage versi web dengan `target="_blank"` dan `rel="noopener noreferrer"`.

### Cara mendapatkan & memasang APK

1. Buka link Google Drive di atas dari browser perangkat Android.
2. Unduh file APK dari folder tersebut.
3. Buka file APK; jika diminta, izinkan **Install unknown apps** untuk aplikasi browser/file manager yang dipakai.
4. Selesaikan instalasi, lalu buka **POSSuper**.

APK didistribusikan manual melalui Google Drive (bukan Play Store), sehingga pembaruan dilakukan dengan mengunduh dan memasang APK terbaru.

### Perbedaan web, PWA, dan APK

| Aspek | Website | PWA | Android APK |
|---|---|---|---|
| Cara mendapat | Buka URL di browser | Install dari browser (manifest + service worker) | Unduh APK dari Google Drive lalu pasang |
| Cara membuka | Tab browser | Icon di layar perangkat (standalone) | Icon aplikasi Android |
| Data bisnis | IndexedDB | IndexedDB | IndexedDB (WebView) |
| Offline | Butuh koneksi (kecuali app shell SW sudah tersimpan) | App shell offline setelah kunjungan pertama | Aset dibundel di aplikasi |
| Thermal printer Bluetooth | ❌ (unduh PDF) | ❌ (unduh PDF) | ✅ |
| Backup/restore JSON | ✅ (unduh file) | ✅ (unduh file) | ✅ (native share sheet) |
| Pembaruan | Otomatis saat dibuka | Service worker `autoUpdate` | Pasang APK terbaru |

Banner **Download Android APK** hanya tampil saat website dibuka di tab browser (desktop maupun mobile). Banner disembunyikan di aplikasi Android native (`Capacitor.isNativePlatform()`) dan saat POSSuper sudah berjalan sebagai PWA standalone — bukan berdasarkan user-agent atau ukuran layar.

## Batasan dan Catatan

- **Tanpa backend, tanpa login**: data hanya ada di perangkat; tidak ada multi-user, role, atau sinkronisasi antar perangkat.
- **Backup bersifat manual**: tidak ada backup otomatis/cloud; pengguna harus mengekspor sendiri lewat menu Backup & Restore (`/backup`). Ekspor PDF/Excel tetap bersifat laporan, bukan backup penuh.
- **Restore bersifat replace, bukan merge**: data di perangkat tujuan digantikan sepenuhnya oleh isi file backup; tidak ada mekanisme penggabungan dua perangkat.
- **Rahasia JWT nota** saat ini hardcoded di `ScanView` (`RAHASIA_NOTA_ANDA`) untuk keperluan demo; untuk produksi sebaiknya dipindahkan ke konfigurasi aman/secret server.
- **Nama database & key localStorage memakai nama legacy** (`SmartPosUmkmDb`, `smartpos_store_profile`) dan sengaja tidak diubah agar data pengguna lama tetap terbaca.
- **Pinia belum digunakan** meski ada di dependency; `@capacitor/splash-screen` juga terpasang tetapi splash diatur lewat theme/drawable native.
- **Thermal printer hanya di Android**: fitur cetak struk Bluetooth memerlukan aplikasi Android POSSuper. Di web browser, tombol cetak dinonaktifkan dan pengguna diarahkan ke unduh PDF. Plugin `@delicity/capacitor-thermal-printer` menyediakan fallback web yang menampilkan pesan "tidak didukung".
- **minSdk Android = 26**: dinaikkan dari 24 karena Star SDK (bundled di plugin thermal printer) membutuhkan API 26.
- **Kas penambahan stok memakai HPP saat transaksi**: nominal dihitung dari `jumlah tambahan × HPP` produk ketika tombol Tambah Stok ditekan; mengubah HPP setelahnya tidak menghitung ulang histori kas. Pengurangan stok tidak membuat kas keluar atau kas masuk.
- **PWA offline terbatas pada app shell**: data bisnis tetap di IndexedDB dan tidak di-cache ke Cache Storage; kunjungan online pertama diperlukan sebelum mode offline bekerja. Prompt install tidak tersedia di semua browser (iOS Safari memakai Add to Home Screen).
- **PWA tanpa thermal printer**: cetak struk Bluetooth hanya tersedia di APK Android; di PWA/web gunakan unduh PDF.
- **APK didistribusikan manual**: file berada di folder Google Drive (bukan Play Store), sehingga pengguna memasang APK sendiri dan pembaruan tidak otomatis.
- **Tidak ada npm script test/lint**: unit test dijalankan manual (`node --experimental-loader ./tests/esm-loader.mjs tests/*.test.js`), dan verifikasi build memakai `npm run build`.
- **Ukuran bundle** besar (±1.36 MB) karena jsPDF, SheetJS, dan html2canvas; Vite menampilkan peringatan chunk > 500 kB. Bisa dioptimalkan dengan dynamic import bila diperlukan.
- Integrasi QR nota mengarah ke aplikasi eksternal (`note-viewer-smartpos`); perubahan URL tersebut berada di luar project ini.

---

## Kredit

Dikembangkan sebagai aplikasi POS untuk UMKM oleh Rafi Febrian Suprapto (developer) dan Windy Permata Suyono (product owner).
