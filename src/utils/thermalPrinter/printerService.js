/**
 * Printer service untuk thermal printer POSSuper.
 *
 * Membungkus API plugin `@delicity/capacitor-thermal-printer` (Capacitor 8)
 * dengan penanganan error, status, dan deteksi platform yang konsisten
 * untuk seluruh UI aplikasi.
 *
 * Plugin API (lihat node_modules/@delicity/capacitor-thermal-printer/README.md):
 *   discoverPrinters, connectPrinter, disconnectPrinter, setDefaultPrinter,
 *   getDefaultPrinter, getSavedPrinters, removePrinter, printImage, printText,
 *   getPrinterStatus, requestPermissions, checkPermissions, isBluetoothEnabled.
 *
 * Status koneksi bersifat runtime saja (tidak persisten). Profil printer
 * default tersimpan native oleh plugin; preferensi lebar kertas user
 * disimpan terpisah di localStorage.
 */

import { Capacitor } from '@capacitor/core';
import { ThermalPrinter } from '@delicity/capacitor-thermal-printer';
import {
    ERROR_MESSAGES,
    GENERIC_PRINT_ERROR,
    WEB_UNSUPPORTED_MESSAGE,
    CONNECTION_STATUS
} from './printerConstants';
import {
    buildReceiptModel,
    buildTestModel,
    modelToPrintItems
} from './receiptFormatter';
import { getStoredProfileSync } from '../../composables/useStoreProfile';

// ---------------------------------------------------------------------------
// Status internal (non-reactive; composable membungkus dengan ref)
// ---------------------------------------------------------------------------

const internalStatus = {
    state: CONNECTION_STATUS.IDLE,
    message: '',
    lastError: null
};

let defaultPrinterId = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPlatform() {
    return Capacitor.getPlatform();
}

function isNativePlatform() {
    const p = getPlatform();
    return p === 'android' || p === 'ios';
}

/** Ambil kode error dari error yang dilempar plugin. */
function getErrorCode(error) {
    if (error && typeof error === 'object' && typeof error.code === 'string') {
        return error.code;
    }
    return null;
}

/** Ubah error plugin menjadi pesan Indonesia yang dapat ditampilkan. */
function normalizeError(error) {
    const code = getErrorCode(error);
    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
    }
    if (error && typeof error.message === 'string' && error.message) {
        return error.message;
    }
    return GENERIC_PRINT_ERROR;
}

function setState(state, message = '', error = null) {
    internalStatus.state = state;
    internalStatus.message = message;
    internalStatus.lastError = error;
}

function setDefaultId(id) {
    defaultPrinterId = id || null;
    try {
        if (id) {
            localStorage.setItem('possuper_default_printer_id', id);
        } else {
            localStorage.removeItem('possuper_default_printer_id');
        }
    } catch (e) {
        // localStorage penuh / disabled — abaikan
    }
}

function loadDefaultId() {
    try {
        defaultPrinterId = localStorage.getItem('possuper_default_printer_id') || null;
    } catch (e) {
        defaultPrinterId = null;
    }
    return defaultPrinterId;
}

loadDefaultId();

// ---------------------------------------------------------------------------
// Public API service
// ---------------------------------------------------------------------------

export const printerService = {
    /** Status runtime terakhir (bukan state Vue). */
    get status() {
        return { ...internalStatus };
    },

    /** ID printer default yang dipilih user (tersimpan di localStorage). */
    get defaultPrinterId() {
        return defaultPrinterId;
    },

    /** Apakah platform mendukung pencetakan Bluetooth thermal. */
    isSupported() {
        return isNativePlatform();
    },

    /** Minta izin Bluetooth yang diperlukan plugin. */
    async requestPermissions() {
        if (!isNativePlatform()) {
            return { granted: false, message: WEB_UNSUPPORTED_MESSAGE };
        }
        try {
            const result = await ThermalPrinter.requestPermissions();
            const granted =
                result.bluetoothScan === 'granted' &&
                result.bluetoothConnect === 'granted';
            return { granted, raw: result };
        } catch (error) {
            return { granted: false, error: normalizeError(error) };
        }
    },

    /** Cek apakah adapter Bluetooth perangkat menyala. */
    async isBluetoothEnabled() {
        if (!isNativePlatform()) {
            return { enabled: false };
        }
        try {
            return await ThermalPrinter.isBluetoothEnabled();
        } catch (e) {
            return { enabled: false };
        }
    },

    /**
     * Cari printer di sekitar.
     * @param {number} timeoutMs waktu pencarian dalam milidetik
     * @returns {Promise<Array>} daftar printer yang ditemukan
     */
    async scanPrinters(timeoutMs = 10000) {
        if (!isNativePlatform()) {
            setState(CONNECTION_STATUS.ERROR, WEB_UNSUPPORTED_MESSAGE);
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }

        setState(CONNECTION_STATUS.SCANNING, 'Mencari printer di sekitar…');
        try {
            const { printers } = await ThermalPrinter.discoverPrinters({ timeoutMs });
            setState(CONNECTION_STATUS.IDLE, '');
            return printers || [];
        } catch (error) {
            const msg = normalizeError(error);
            setState(CONNECTION_STATUS.ERROR, msg, error);
            throw error;
        }
    },

    /**
     * Hubungkan ke printer dan verifikasi koneksi.
     * @param {object} printer objek dari hasil scan
     * @param {boolean} setAsDefault jadikan default jika koneksi berhasil
     * @returns {Promise<{connected: boolean, paper: object|null, printerId: string}>}
     */
    async connectPrinter(printer, setAsDefault = false) {
        if (!printer || !printer.id) {
            throw new Error('Data printer tidak valid.');
        }
        if (!isNativePlatform()) {
            setState(CONNECTION_STATUS.ERROR, WEB_UNSUPPORTED_MESSAGE);
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }

        setState(CONNECTION_STATUS.CONNECTING, `Menghubungkan ke ${printer.name || printer.id}…`);
        try {
            const result = await ThermalPrinter.connectPrinter({
                printerId: printer.id,
                setAsDefault
            });

            if (result.connected) {
                setState(CONNECTION_STATUS.CONNECTED, `Terhubung ke ${printer.name || result.printerId}`);
                if (setAsDefault) {
                    setDefaultId(result.printerId || printer.id);
                }
                return {
                    connected: true,
                    paper: result.paper || null,
                    printerId: result.printerId || printer.id,
                    adapter: result.adapter
                };
            }

            setState(CONNECTION_STATUS.DISCONNECTED, 'Printer tidak merespons.');
            return { connected: false, paper: null, printerId: printer.id };
        } catch (error) {
            const msg = normalizeError(error);
            setState(CONNECTION_STATUS.ERROR, msg, error);
            throw error;
        }
    },

    /** Putuskan koneksi ke printer tertentu (atau printer aktif). */
    async disconnectPrinter(printerId) {
        const id = printerId || defaultPrinterId;
        if (!id || !isNativePlatform()) {
            return;
        }
        try {
            await ThermalPrinter.disconnectPrinter({ printerId: id });
        } catch (e) {
            // Disconnect gagal tidak kritis — abaikan
        }
        setState(CONNECTION_STATUS.IDLE, '');
    },

    /** Periksa status koneksi printer. */
    async checkConnection(printerId) {
        const id = printerId || defaultPrinterId;
        if (!id || !isNativePlatform()) {
            return { connected: false };
        }
        try {
            const status = await ThermalPrinter.getPrinterStatus({ printerId: id });
            return { connected: status.connection === 'connected', status };
        } catch (e) {
            return { connected: false };
        }
    },

    /** Ambil profil default printer yang tersimpan native oleh plugin. */
    async getDefaultPrinter() {
        if (!isNativePlatform()) {
            return null;
        }
        try {
            const { profile } = await ThermalPrinter.getDefaultPrinter();
            return profile || null;
        } catch (e) {
            return null;
        }
    },

    /** Daftar semua profil printer yang tersimpan. */
    async getSavedPrinters() {
        if (!isNativePlatform()) {
            return [];
        }
        try {
            const { profiles } = await ThermalPrinter.getSavedPrinters();
            return profiles || [];
        } catch (e) {
            return [];
        }
    },

    /** Tandai printer sebagai default (tersimpan native + localStorage ID). */
    async setDefaultPrinter(printerId) {
        if (!printerId || !isNativePlatform()) {
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }
        try {
            await ThermalPrinter.setDefaultPrinter({ printerId });
            setDefaultId(printerId);
        } catch (error) {
            throw error;
        }
    },

    /** Hapus profil tersimpan (lupakan printer). */
    async removePrinter(printerId) {
        if (!printerId || !isNativePlatform()) {
            return;
        }
        try {
            await ThermalPrinter.removePrinter({ printerId });
            if (defaultPrinterId === printerId) {
                setDefaultId(null);
            }
        } catch (e) {
            // ignore
        }
    },

    /**
     * Kirim data ESC/POS ke printer melalui plugin printText.
     * @param {Uint8Array} _bytes byte ESC/POS (untuk referensi / pengujian)
     * @param {object} options opsi cetak
     * @param {Array} options.items item printText plugin (dari modelToPrintItems)
     * @param {string} [options.printerId] target printer (default: profil default)
     * @param {number} [options.paperWidthMm] lebar kertas
     * @returns {Promise<object>} hasil dari plugin
     */
    async sendPrintJob(_bytes, { items, printerId, paperWidthMm } = {}) {
        if (!isNativePlatform()) {
            setState(CONNECTION_STATUS.ERROR, WEB_UNSUPPORTED_MESSAGE);
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Data cetak kosong.');
        }

        setState(CONNECTION_STATUS.CONNECTED, 'Mengirim data cetak…');
        try {
            const options = { items };
            if (printerId) {
                options.printerId = printerId;
            }
            if (paperWidthMm) {
                options.paperWidthMm = paperWidthMm;
            }
            const result = await ThermalPrinter.printText(options);
            setState(CONNECTION_STATUS.CONNECTED, '');
            return result;
        } catch (error) {
            const msg = normalizeError(error);
            setState(CONNECTION_STATUS.ERROR, msg, error);
            throw error;
        }
    },

    /** Cetak struk uji. */
    async printTestReceipt({ printerId, paperWidthMm } = {}) {
        if (!isNativePlatform()) {
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }

        const profile = await this.getDefaultPrinter();
        const model = buildTestModel({
            storeName: 'POSSuper',
            printerName: profile?.name || printerId || 'Printer Thermal',
            paperWidthMm: paperWidthMm || 80
        });
        const items = modelToPrintItems(model);

        return this.sendPrintJob(null, {
            items,
            printerId,
            paperWidthMm: paperWidthMm || model.paper.widthMm
        });
    },

    /**
     * Cetak struk transaksi dari record `penjualan`.
     * Tidak memodifikasi data transaksi — hanya membaca.
     */
    async printReceipt(transaksi, { printerId, paperWidthMm } = {}) {
        if (!isNativePlatform()) {
            throw new Error(WEB_UNSUPPORTED_MESSAGE);
        }
        if (!transaksi) {
            throw new Error('Data transaksi tidak tersedia.');
        }

        const profile = getStoredProfileSync();
        const model = buildReceiptModel({
            transaksi,
            profile,
            paperWidthMm: paperWidthMm || 80,
            includeQr: true,
            includeCut: true
        });
        const items = modelToPrintItems(model);

        return this.sendPrintJob(null, {
            items,
            printerId,
            paperWidthMm: paperWidthMm || model.paper.widthMm
        });
    }
};
