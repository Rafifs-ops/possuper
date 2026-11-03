/**
 * Konstanta fitur Thermal Printer POSSuper.
 *
 * Referensi:
 * - Protokol ESC/POS (perintah generik untuk printer thermal 58mm / 80mm)
 * - `@delicity/capacitor-thermal-printer` (plugin native: discovery, koneksi, kirim byte)
 */

/** Key localStorage untuk konfigurasi printer default. */
export const PRINTER_STORAGE_KEY = 'possuper_default_printer';

/**
 * Profil kertas yang didukung.
 * `dots` = lebar cetak pada 203 dpi, `columns` = jumlah kolom font Font A (12 dot).
 * 384 / 12 = 32 kolom (58mm) · 576 / 12 = 48 kolom (80mm).
 */
export const PAPER_SIZES = {
    58: { widthMm: 58, dots: 384, columns: 32 },
    80: { widthMm: 80, dots: 576, columns: 48 }
};

export const SUPPORTED_PAPER_WIDTHS = [58, 80];

/** Ambil profil kertas teraman (default 80mm bila tidak dikenal). */
export function getPaperProfile(widthMm) {
    const key = Number(widthMm) === 58 ? 58 : 80;
    return PAPER_SIZES[key];
}

/** Status koneksi yang ditampilkan ke pengguna. */
export const CONNECTION_STATUS = {
    IDLE: 'idle',
    SCANNING: 'scanning',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};

/** Label status (Indonesia) untuk UI. */
export const STATUS_LABELS = {
    [CONNECTION_STATUS.IDLE]: 'Belum terhubung',
    [CONNECTION_STATUS.SCANNING]: 'Mencari perangkat',
    [CONNECTION_STATUS.CONNECTING]: 'Menghubungkan',
    [CONNECTION_STATUS.CONNECTED]: 'Terhubung',
    [CONNECTION_STATUS.DISCONNECTED]: 'Koneksi terputus',
    [CONNECTION_STATUS.ERROR]: 'Gagal terhubung'
};

/** Label transport perangkat. */
export const TRANSPORT_LABELS = {
    bluetooth: 'Bluetooth Classic (SPP)',
    ble: 'Bluetooth BLE',
    wifi: 'Wi-Fi / TCP',
    ethernet: 'Ethernet',
    usb: 'USB'
};

/** Badge singkat untuk daftar perangkat. */
export const TRANSPORT_SHORT = {
    bluetooth: 'SPP',
    ble: 'BLE',
    wifi: 'Wi-Fi',
    ethernet: 'LAN',
    usb: 'USB'
};

/**
 * Pesan error berdasarkan kode normalisasi plugin
 * (lihat PrintErrorCode pada @delicity/capacitor-thermal-printer).
 */
export const ERROR_MESSAGES = {
    PRINTER_NOT_FOUND: 'Printer tidak ditemukan. Pencari ulang daftar printer.',
    PRINTER_OFFLINE: 'Printer sedang offline. Pastikan printer menyala dan berada dekat perangkat.',
    CONNECTION_FAILED: 'Gagal terhubung ke printer. Coba sambungkan kembali.',
    PERMISSION_DENIED: 'Izin Bluetooth ditolak. Izinkan akses Bluetooth pada pengaturan perangkat.',
    BLUETOOTH_DISABLED: 'Bluetooth perangkat sedang mati. Nyalakan Bluetooth terlebih dahulu.',
    WIFI_NOT_CONNECTED: 'Perangkat belum terhubung ke jaringan Wi-Fi printer.',
    PAIRING_REQUIRED: 'Printer belum dipasangkan. Selesaikan proses pairing Bluetooth pada perangkat.',
    UNSUPPORTED_TRANSPORT: 'Jenis koneksi printer ini tidak didukung di perangkat Anda.',
    UNSUPPORTED_PRINTER: 'Printer ini tidak mendukung perintah yang digunakan.',
    IMAGE_INVALID: 'Gambar struk tidak valid.',
    IMAGE_TOO_LARGE: 'Ukuran data cetak terlalu besar untuk printer.',
    PRINT_FAILED: 'Data gagal dikirim ke printer.',
    PAPER_EMPTY: 'Kertas printer habis. Isi kertas lalu coba lagi.',
    COVER_OPEN: 'Tutup printer terbuka. Tutup kembali lalu coba lagi.',
    SDK_NOT_AVAILABLE: 'Pencetakan Bluetooth hanya tersedia pada aplikasi Android POSSuper.',
    TIMEOUT: 'Printer tidak merespons (waktu tunggu habis). Coba lagi.',
    UNKNOWN: 'Terjadi kesalahan pada proses cetak.'
};

/** Pesan fallback bila plugin melempar error tanpa kode dikenal. */
export const GENERIC_PRINT_ERROR =
    'Gagal mencetak struk. Periksa koneksi Bluetooth dan kondisi printer.';

/** Pesan saat fitur tidak tersedia di platform berjalan. */
export const WEB_UNSUPPORTED_MESSAGE =
    'Pencetakan Bluetooth memerlukan aplikasi Android POSSuper. Gunakan "Unduh PDF" di web browser.';

/** Service UUID ESC/POS BLE yang umum dipakai printer generik. */
export const WEB_BLE_SERVICES = [
    '0000ff00-0000-1000-8000-00805f9b34fb', // FF00 (printer generik China)
    '0000ffe0-0000-1000-8000-00805f9b34fb', // FFE0 (HM-10 / JL-01)
    '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISSC (IMPRINTER)
];

/** Karakteristik BLE yang lazim dipakai untuk menulis data ESC/POS. */
export const WEB_BLE_CHARACTERISTICS = [
    '0000ff01-0000-1000-8000-00805f9b34fb',
    '0000ffe1-0000-1000-8000-00805f9b34fb',
    '49535343-1e4d-4bd9-ba61-23c647249616'
];

/** Jumlah byte per paket tulis BLE (di bawah batas ATT MTU 512). */
export const WEB_BLE_CHUNK_SIZE = 180;

/** URL viewer verifikasi nota (sama dengan yang dipakai QR pada PDF). */
export const NOTE_VIEWER_BASE_URL = 'https://rafifs-ops.github.io/note-viewer-smartpos/?t=';
