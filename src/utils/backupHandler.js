import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import dayjs from 'dayjs';
import { db, withSnapshotTrackingPaused } from '../database/db';
import { getStoredProfileSync } from '../composables/useStoreProfile';

/**
 * Backup & Restore POSSuper — format pertukaran data antarperangkat.
 *
 * Semua proses berjalan lokal: data dibaca dari Dexie/IndexedDB, ditulis ke file
 * JSON, lalu dipulihkan kembali tanpa backend, akun, atau layanan cloud.
 */

export const BACKUP_FORMAT = 'possuper-backup';
export const BACKUP_SCHEMA_VERSION = 2;
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2];

// Tabel bisnis yang ikut backup. Urutan restore: produk dulu, snapshot persediaan
// dipulihkan terakhir agar nilainya persis sama dengan file backup.
// Versi 2 menambahkan kasManual & saldoAwalKas untuk fitur arus kas.
export const BACKUP_TABLES = ['produk', 'penjualan', 'pengeluaran', 'persediaan', 'profilToko', 'kasManual', 'saldoAwalKas'];

// Tabel yang sudah ada sejak backup versi 1 (wajib ada di file v1).
const BACKUP_TABLES_V1 = ['produk', 'penjualan', 'pengeluaran', 'persediaan', 'profilToko'];

export const BACKUP_TABLE_LABELS = {
    produk: 'Data produk',
    penjualan: 'Data penjualan',
    pengeluaran: 'Data pengeluaran',
    persediaan: 'Data persediaan',
    profilToko: 'Data profil toko',
    kasManual: 'Transaksi kas manual',
    saldoAwalKas: 'Saldo awal kas'
};

// Kategori pengeluaran yang dikenal aplikasi (lihat BiayaView & RincianBiaya).
export const EXPENSE_CATEGORIES = [
    'pemasaran',
    'listrik_air_internet',
    'perlengkapan',
    'admin',
    'pajak',
    'sewa',
    'lain_lain'
];

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
const MAX_BACKUP_BYTES = 64 * 1024 * 1024;

export class BackupValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'BackupValidationError';
        this.details = details;
    }
}

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isNonNegativeNumber = (value) => isFiniteNumber(value) && value >= 0;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const isMonthKey = (value) => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const isDateLike = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.trim());

const invalid = (table, detail) =>
    new BackupValidationError(`${BACKUP_TABLE_LABELS[table] || 'Data'} pada file tidak valid: ${detail}`);

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

/** Ambil seluruh record dari seluruh tabel bisnis. */
export async function collectBackupData() {
    const [produk, penjualan, pengeluaran, persediaan, profilToko, kasManual, saldoAwalKas] = await Promise.all([
        db.produk.toArray(),
        db.penjualan.toArray(),
        db.pengeluaran.toArray(),
        db.persediaan.toArray(),
        db.profilToko.toArray(),
        db.kasManual.toArray(),
        db.saldoAwalKas.toArray()
    ]);

    return { produk, penjualan, pengeluaran, persediaan, profilToko, kasManual, saldoAwalKas };
}

/** Susun payload backup lengkap dengan metadata. */
export async function buildBackupPayload() {
    const data = await collectBackupData();
    const profile = data.profilToko.find((item) => Number(item?.id) === 1);
    const fallbackProfile = getStoredProfileSync();
    const exportedAt = new Date().toISOString();

    return {
        format: BACKUP_FORMAT,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        metadata: {
            appName: 'POSSuper',
            appVersion: APP_VERSION,
            exportedAt,
            storeName: (profile?.namaToko || fallbackProfile.namaToko || '').trim(),
            counts: {
                produk: data.produk.length,
                penjualan: data.penjualan.length,
                pengeluaran: data.pengeluaran.length,
                persediaan: data.persediaan.length,
                profilToko: data.profilToko.length,
                kasManual: data.kasManual.length,
                saldoAwalKas: data.saldoAwalKas.length
            }
        },
        data
    };
}

/** Nama file informatif: POSSuper-Backup-2026-10-30-153000.json */
export function buildBackupFilename(date = new Date()) {
    return `POSSuper-Backup-${dayjs(date).format('YYYY-MM-DD-HHmmss')}.json`;
}

/** Rakit file backup (payload + string JSON + nama file). */
export async function createBackupFile() {
    const payload = await buildBackupPayload();
    return {
        payload,
        json: JSON.stringify(payload, null, 2),
        filename: buildBackupFilename(payload.metadata.exportedAt)
    };
}

const sanitizeFilename = (name) => {
    let safe = String(name || 'POSSuper-Backup.json').replace(/[/\\?%*:|"<>]/g, '-');
    if (!safe.toLowerCase().endsWith('.json')) {
        safe += '.json';
    }
    return safe;
};

/**
 * Simpan file backup sesuai platform.
 * - Android/Capacitor: tulis ke cache aplikasi lalu buka native share sheet.
 * - Web: unduh lewat Blob + object URL, lalu bersihkan URL-nya.
 */
export async function saveBackupJson(json, filename) {
    const safeName = sanitizeFilename(filename);

    if (Capacitor.isNativePlatform()) {
        const savedFile = await Filesystem.writeFile({
            path: safeName,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
        });

        let shared = false;
        try {
            const canShare = await Share.canShare();
            if (canShare?.value) {
                await Share.share({
                    title: safeName,
                    text: 'File backup data POSSuper. Simpan di lokasi aman atau kirim ke perangkat baru.',
                    url: savedFile.uri,
                    dialogTitle: 'Simpan atau Bagikan Backup'
                });
                shared = true;
            }
        } catch (shareError) {
            // User bisa menutup share sheet; file tetap tersimpan di cache aplikasi.
            console.warn('Share sheet backup dilewati:', shareError);
        }

        return { platform: 'android', filename: safeName, uri: savedFile.uri, shared };
    }

    const blob = new Blob([json], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);

    try {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = safeName;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        // Beri waktu browser memulai unduhan sebelum URL dilepas.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    }

    return { platform: 'web', filename: safeName, uri: null, shared: false };
}

/* ------------------------------------------------------------------ */
/* Baca file                                                           */
/* ------------------------------------------------------------------ */

const readFileText = (file) =>
    new Promise((resolve, reject) => {
        if (typeof file.text === 'function') {
            file.text().then(resolve, reject);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('File tidak dapat dibaca.'));
        reader.readAsText(file);
    });

/** Baca + parse file pilihan pengguna. Tidak menyentuh database. */
export async function readBackupFile(file) {
    if (!file) {
        throw new BackupValidationError('Tidak ada file yang dipilih.');
    }

    const fileName = file.name || 'backup.json';
    const isJsonName = /\.json$/i.test(fileName);
    const isJsonMime = typeof file.type === 'string' && (file.type === 'application/json' || file.type === 'text/json');

    if (!isJsonName && !isJsonMime) {
        throw new BackupValidationError('Format file tidak didukung. Pilih file backup POSSuper berformat .json.');
    }

    if (typeof file.size === 'number' && file.size > MAX_BACKUP_BYTES) {
        throw new BackupValidationError('Ukuran file backup terlalu besar untuk diproses.');
    }

    let text;
    try {
        text = await readFileText(file);
    } catch (error) {
        console.error('Gagal membaca file backup:', error);
        throw new BackupValidationError('File backup tidak dapat dibaca. Pastikan file tidak rusak.');
    }

    if (!text || !text.trim()) {
        throw new BackupValidationError('File backup kosong. Pilih file hasil ekspor POSSuper yang valid.');
    }

    let payload;
    try {
        payload = JSON.parse(text);
    } catch (error) {
        throw new BackupValidationError('File JSON tidak valid. Pastikan file tidak rusak atau berubah.');
    }

    const summary = validateBackupPayload(payload);
    return { payload, summary, fileName };
}

/* ------------------------------------------------------------------ */
/* Validasi                                                            */
/* ------------------------------------------------------------------ */

function validateProducts(records) {
    const ids = new Set();

    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('produk', `${where} bukan objek produk.`);
        if (!isNonEmptyString(item.id)) throw invalid('produk', `${where} tidak memiliki barcode/SKU.`);
        if (!isNonEmptyString(item.nama)) throw invalid('produk', `${where} tidak memiliki nama produk.`);
        if (!isNonNegativeNumber(item.harga)) throw invalid('produk', `${where} memiliki harga yang tidak valid.`);
        if (!isNonNegativeNumber(item.hpp)) throw invalid('produk', `${where} memiliki HPP yang tidak valid.`);
        if (!isNonNegativeNumber(item.quantity)) throw invalid('produk', `${where} memiliki jumlah stok yang tidak valid.`);
        if (!isFiniteNumber(item.createdAt)) throw invalid('produk', `${where} tidak memiliki waktu pembuatan (createdAt).`);
        if (ids.has(item.id)) throw invalid('produk', `barcode/SKU "${item.id}" muncul lebih dari sekali.`);
        ids.add(item.id);
    });
}

function validateSaleItems(items, where) {
    if (!Array.isArray(items)) throw invalid('penjualan', `${where} tidak memiliki daftar item transaksi.`);

    items.forEach((item, index) => {
        const itemWhere = `${where} item #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('penjualan', `${itemWhere} bukan objek.`);
        if (!isNonEmptyString(String(item.id ?? ''))) throw invalid('penjualan', `${itemWhere} tidak memiliki ID produk.`);
        if (!isNonEmptyString(item.nama)) throw invalid('penjualan', `${itemWhere} tidak memiliki nama produk.`);
        if (!isNonNegativeNumber(item.harga)) throw invalid('penjualan', `${itemWhere} memiliki harga yang tidak valid.`);
        if (!isNonNegativeNumber(item.quantity)) throw invalid('penjualan', `${itemWhere} memiliki jumlah yang tidak valid.`);
        if (item.hpp !== undefined && !isNonNegativeNumber(item.hpp)) {
            throw invalid('penjualan', `${itemWhere} memiliki HPP yang tidak valid.`);
        }
    });
}

function validateSales(records) {
    const ids = new Set();

    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('penjualan', `${where} bukan objek transaksi.`);
        if (!Number.isInteger(item.id) || item.id <= 0) throw invalid('penjualan', `${where} memiliki ID transaksi yang tidak valid.`);
        if (ids.has(item.id)) throw invalid('penjualan', `ID transaksi #${item.id} muncul lebih dari sekali.`);
        ids.add(item.id);
        if (!isDateLike(item.tanggal)) throw invalid('penjualan', `${where} memiliki tanggal transaksi yang tidak valid.`);
        if (!isNonNegativeNumber(item.totalPenjualan)) throw invalid('penjualan', `${where} memiliki total penjualan yang tidak valid.`);
        if (!isNonNegativeNumber(item.totalHpp)) throw invalid('penjualan', `${where} memiliki total HPP yang tidak valid.`);
        validateSaleItems(item.items, where);
        if (typeof item.tokenNota !== 'string') {
            throw invalid('penjualan', `${where} tidak memiliki token nota.`);
        }
    });
}

function validateExpenseDetails(details, where) {
    // Data lama bisa menyimpan keterangan sebagai string; keduanya diterima agar
    // backup lama tetap bisa dipulihkan tanpa mengubah isinya.
    if (typeof details === 'string') return;
    if (!Array.isArray(details)) throw invalid('pengeluaran', `${where} tidak memiliki daftar rincian biaya.`);

    details.forEach((item, index) => {
        const itemWhere = `${where} rincian #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('pengeluaran', `${itemWhere} bukan objek rincian.`);
        if (item.id === undefined || item.id === null || String(item.id).trim() === '') {
            throw invalid('pengeluaran', `${itemWhere} tidak memiliki ID rincian.`);
        }
        if (typeof item.text !== 'string') throw invalid('pengeluaran', `${itemWhere} tidak memiliki teks keterangan.`);
        if (!isNonNegativeNumber(item.nominal)) throw invalid('pengeluaran', `${itemWhere} memiliki nominal yang tidak valid.`);
        if (item.tanggal !== undefined && typeof item.tanggal !== 'string') {
            throw invalid('pengeluaran', `${itemWhere} memiliki tanggal yang tidak valid.`);
        }
    });
}

function validateExpenses(records) {
    const keys = new Set();

    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('pengeluaran', `${where} bukan objek pengeluaran.`);
        if (!Number.isInteger(item.id) || item.id <= 0) throw invalid('pengeluaran', `${where} memiliki ID yang tidak valid.`);
        if (!isMonthKey(item.bulanTahun)) throw invalid('pengeluaran', `${where} memiliki periode (bulanTahun) yang tidak valid.`);
        if (!EXPENSE_CATEGORIES.includes(item.jenis)) {
            throw invalid('pengeluaran', `${where} memakai kategori "${item.jenis}" yang tidak dikenal aplikasi.`);
        }
        if (!isNonNegativeNumber(item.nominal)) throw invalid('pengeluaran', `${where} memiliki nominal yang tidak valid.`);

        const key = `${item.bulanTahun}|${item.jenis}`;
        if (keys.has(key)) {
            throw invalid('pengeluaran', `kategori "${item.jenis}" untuk periode ${item.bulanTahun} muncul lebih dari sekali.`);
        }
        keys.add(key);

        validateExpenseDetails(item.keterangan, where);
    });
}

function validateInventory(records) {
    const keys = new Set();

    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('persediaan', `${where} bukan objek snapshot.`);
        if (!isMonthKey(item.bulanTahun)) throw invalid('persediaan', `${where} memiliki periode yang tidak valid.`);
        if (!isNonNegativeNumber(item.totalNilai)) throw invalid('persediaan', `${where} memiliki total nilai yang tidak valid.`);
        if (keys.has(item.bulanTahun)) throw invalid('persediaan', `periode ${item.bulanTahun} muncul lebih dari sekali.`);
        keys.add(item.bulanTahun);
    });
}

function validateStoreProfile(records) {
    if (records.length > 1) {
        throw invalid('profilToko', 'hanya boleh berisi satu profil toko.');
    }

    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('profilToko', `${where} bukan objek profil.`);
        if (Number(item.id) !== 1) throw invalid('profilToko', `${where} harus memiliki id 1.`);
        ['namaToko', 'alamatToko', 'noHp'].forEach((field) => {
            if (item[field] !== undefined && typeof item[field] !== 'string') {
                throw invalid('profilToko', `${where} memiliki ${field} yang tidak valid.`);
            }
        });
        if (item.updatedAt !== undefined && typeof item.updatedAt !== 'string') {
            throw invalid('profilToko', `${where} memiliki updatedAt yang tidak valid.`);
        }
    });
}

const KAS_MANUAL_TIPE = ['masuk', 'keluar'];
const KAS_MANUAL_AKTIVITAS = ['operasi', 'investasi', 'pendanaan'];

function validateKasManual(records) {
    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('kasManual', `${where} bukan objek transaksi kas.`);
        if (!Number.isInteger(item.id) || item.id <= 0) throw invalid('kasManual', `${where} memiliki ID yang tidak valid.`);
        if (!isDateLike(item.tanggal)) throw invalid('kasManual', `${where} memiliki tanggal yang tidak valid.`);
        if (!KAS_MANUAL_TIPE.includes(item.tipe)) throw invalid('kasManual', `${where} memiliki tipe yang tidak valid.`);
        if (!KAS_MANUAL_AKTIVITAS.includes(item.aktivitas)) throw invalid('kasManual', `${where} memiliki aktivitas yang tidak valid.`);
        if (typeof item.kategori !== 'string' || item.kategori.trim() === '') {
            throw invalid('kasManual', `${where} tidak memiliki kategori.`);
        }
        if (typeof item.keterangan !== 'string') throw invalid('kasManual', `${where} tidak memiliki keterangan.`);
        if (!isNonNegativeNumber(item.nominal) || item.nominal <= 0) {
            throw invalid('kasManual', `${where} memiliki nominal yang tidak valid.`);
        }
    });
}

function validateSaldoAwalKas(records) {
    if (records.length > 1) {
        throw invalid('saldoAwalKas', 'hanya boleh berisi satu konfigurasi saldo awal.');
    }
    records.forEach((item, index) => {
        const where = `record #${index + 1}`;
        if (!isPlainObject(item)) throw invalid('saldoAwalKas', `${where} bukan objek saldo awal.`);
        if (Number(item.id) !== 1) throw invalid('saldoAwalKas', `${where} harus memiliki id 1.`);
        if (!isFiniteNumber(item.saldoAwal)) throw invalid('saldoAwalKas', `${where} memiliki saldo yang tidak valid.`);
        if (item.berlakuSejak !== undefined && !isDateLike(String(item.berlakuSejak))) {
            throw invalid('saldoAwalKas', `${where} memiliki tanggal berlaku yang tidak valid.`);
        }
    });
}

/**
 * Validasi menyeluruh sebelum database disentuh.
 * Mengembalikan ringkasan backup bila valid, melempar BackupValidationError bila tidak.
 *
 * `tables` menentukan tabel mana yang dicatat record-nya; struktur file tetap
 * harus lengkap (semua tabel ada). Default: seluruh tabel.
 */
export function validateBackupPayload(payload, tables = BACKUP_TABLES) {
    if (!isPlainObject(payload)) {
        throw new BackupValidationError('File JSON tidak valid: struktur backup tidak dikenali.');
    }

    if (payload.format !== BACKUP_FORMAT) {
        throw new BackupValidationError('File ini bukan backup POSSuper. Pilih file JSON hasil ekspor dari aplikasi POSSuper.');
    }

    if (!Number.isInteger(payload.schemaVersion) || !SUPPORTED_SCHEMA_VERSIONS.includes(payload.schemaVersion)) {
        throw new BackupValidationError(
            `Versi backup (${payload.schemaVersion}) belum didukung oleh aplikasi ini. Perbarui POSSuper di perangkat ini terlebih dahulu.`
        );
    }

    if (!isPlainObject(payload.data)) {
        throw new BackupValidationError('File backup tidak lengkap: bagian data tidak ditemukan.');
    }

    // Backup versi 1 tidak memiliki tabel kasManual & saldoAwalKas —
    // normalisasi ke array kosong agar restore tetap berjalan mulus.
    if (payload.schemaVersion === 1) {
        if (!Array.isArray(payload.data.kasManual)) payload.data.kasManual = [];
        if (!Array.isArray(payload.data.saldoAwalKas)) payload.data.saldoAwalKas = [];
    }

    // Semua tabel wajib ada setelah normalisasi.
    BACKUP_TABLES.forEach((table) => {
        if (!Array.isArray(payload.data[table])) {
            throw new BackupValidationError(
                `File backup tidak lengkap: ${BACKUP_TABLE_LABELS[table].toLowerCase()} tidak ditemukan.`
            );
        }
    });

    resolveRestoreTables(tables).forEach((table) => {
        TABLE_VALIDATORS[table](payload.data[table]);
    });

    const metadata = isPlainObject(payload.metadata) ? payload.metadata : {};
    const profile = payload.data.profilToko[0];
    const exportedAt = typeof metadata.exportedAt === 'string' && !Number.isNaN(Date.parse(metadata.exportedAt))
        ? metadata.exportedAt
        : '';

    return {
        storeName: (metadata.storeName || profile?.namaToko || '').trim(),
        exportedAt,
        appName: typeof metadata.appName === 'string' ? metadata.appName : 'POSSuper',
        appVersion: typeof metadata.appVersion === 'string' ? metadata.appVersion : '',
        schemaVersion: payload.schemaVersion,
        counts: {
            produk: payload.data.produk.length,
            penjualan: payload.data.penjualan.length,
            pengeluaran: payload.data.pengeluaran.length,
            persediaan: payload.data.persediaan.length,
            profilToko: payload.data.profilToko.length,
            kasManual: payload.data.kasManual.length,
            saldoAwalKas: payload.data.saldoAwalKas.length
        }
    };
}

/* ------------------------------------------------------------------ */
/* Restore                                                             */
/* ------------------------------------------------------------------ */

const TABLE_VALIDATORS = {
    produk: validateProducts,
    penjualan: validateSales,
    pengeluaran: validateExpenses,
    persediaan: validateInventory,
    profilToko: validateStoreProfile,
    kasManual: validateKasManual,
    saldoAwalKas: validateSaldoAwalKas
};

/**
 * Normalisasi pilihan tabel restore selektif.
 * Snapshot `persediaan` selalu mengikuti `produk` karena nilainya diturunkan
 * dari data produk; keduanya dipulihkan bersama agar data tetap konsisten.
 *
 * @returns {string[]} tabel terpilih dalam urutan restore yang aman
 */
export function resolveRestoreTables(tables = BACKUP_TABLES) {
    const requested = Array.isArray(tables) ? tables : BACKUP_TABLES;
    const selected = new Set(BACKUP_TABLES.filter((table) => requested.includes(table)));

    if (selected.size === 0) {
        throw new BackupValidationError('Pilih minimal satu jenis data yang akan dipulihkan.');
    }

    if (selected.has('produk')) selected.add('persediaan');
    if (selected.has('persediaan')) selected.add('produk');

    return BACKUP_TABLES.filter((table) => selected.has(table));
}

/**
 * Restore / replace di dalam satu transaksi Dexie.
 *
 * Tanpa argumen `tables`: memulihkan seluruh tabel (full restore).
 * Dengan `tables`: mode selektif — hanya tabel terpilih yang dibersihkan dan
 * ditulis ulang; tabel lain tidak disentuh sama sekali.
 *
 * Hook snapshot persediaan dihentikan sementara lewat withSnapshotTrackingPaused
 * supaya nilai snapshot dari file tidak dihitung ulang (tidak dobel), lalu tabel
 * persediaan dipulihkan terakhir. Gangguan apa pun membuat transaksi rollback.
 */
const WRITE_METHOD = {
    produk: 'bulkPut',
    penjualan: 'bulkAdd',
    pengeluaran: 'bulkAdd',
    profilToko: 'bulkPut',
    persediaan: 'bulkPut',
    kasManual: 'bulkPut',
    saldoAwalKas: 'bulkPut'
};

// Tabel ditulis dalam urutan ini; persediaan terakhir karena nilainya diturunkan
// dari data produk. kasManual & saldoAwalKas setelah tabel utama.
const WRITE_ORDER = ['produk', 'penjualan', 'pengeluaran', 'profilToko', 'kasManual', 'saldoAwalKas', 'persediaan'];

export async function restoreBackup(payload, tables = BACKUP_TABLES) {
    // Salinan murni berbentuk JSON: menghilangkan reactive proxy Vue atau nilai
    // apa pun yang tidak bisa di-clone oleh IndexedDB, tanpa menyentuh isinya.
    let plainPayload;
    try {
        plainPayload = JSON.parse(JSON.stringify(payload));
    } catch (error) {
        throw new BackupValidationError('File backup tidak valid. Pastikan file tidak rusak atau berubah.');
    }

    const restoreTables = resolveRestoreTables(tables);
    validateBackupPayload(plainPayload, restoreTables);

    const data = plainPayload.data;
    const expected = Object.fromEntries(restoreTables.map((table) => [table, data[table].length]));
    const writeOrder = WRITE_ORDER.filter((table) => restoreTables.includes(table));

    await withSnapshotTrackingPaused(async () => {
        const dbTables = restoreTables.map((table) => db[table]);
        await db.transaction('rw', ...dbTables, async () => {
            // Bersihkan hanya tabel yang dipilih.
            await Promise.all(restoreTables.map((table) => db[table].clear()));

            // Primary key dipertahankan apa adanya (barcode produk, ID transaksi, dsb).
            for (const table of writeOrder) {
                const records = data[table];
                if (records.length > 0) {
                    await db[table][WRITE_METHOD[table]](records);
                }
            }

            for (const table of restoreTables) {
                const count = await db[table].count();
                if (count !== expected[table]) {
                    throw new Error(`Verifikasi restore gagal pada tabel ${table}.`);
                }
            }
        });
    });

    return { tables: restoreTables, counts: expected };
}
