/**
 * Composable thermal printer untuk POSSuper.
 *
 * Menyediakan state reaktif (isConnected, isConnecting, isScanning, dll.)
 * dan fungsi-fungsi yang dipanggil oleh halaman Pengaturan Printer,
 * ReceiptView, dan SalesHistoryView.
 *
 * Pola module-scoped ref sama dengan useProducts, useStoreProfile, useToast.
 */

import { ref, computed, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { ThermalPrinter } from '@delicity/capacitor-thermal-printer';
import { printerService } from '../utils/thermalPrinter/printerService';
import {
    WEB_UNSUPPORTED_MESSAGE,
    CONNECTION_STATUS,
    SUPPORTED_PAPER_WIDTHS
} from '../utils/thermalPrinter/printerConstants';

// ---------------------------------------------------------------------------
// State module-scoped (shared antar halaman)
// ---------------------------------------------------------------------------

const connectionState = ref({
    scanning: false,
    connecting: false,
    printing: false,
    connected: false,
    connectedPrinter: null,
    error: ''
});

const availablePrinters = ref([]);
const paperWidth = ref(loadPaperWidth());
const isSupported = ref(Capacitor.isNativePlatform());
const defaultPrinterId = ref(printerService.defaultPrinterId || null);

let listenersRegistered = false;

function loadPaperWidth() {
    try {
        const saved = Number(localStorage.getItem('possuper_paper_width'));
        if (SUPPORTED_PAPER_WIDTHS.includes(saved)) return saved;
    } catch (e) { /* ignore */ }
    return 80;
}

function savePaperWidth(width) {
    try {
        localStorage.setItem('possuper_paper_width', String(width));
    } catch (e) { /* ignore */ }
}

function normalizePrinter(printer) {
    return {
        id: printer.id,
        name: printer.name || printer.id,
        address: printer.address || '',
        transport: printer.transport || 'unknown',
        adapter: printer.adapter || '',
        brand: printer.brand || '',
        model: printer.model || '',
        isDefault: !!printer.isDefault,
        isConnected: !!printer.isConnected
    };
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useThermalPrinter() {
    // ---- Computed status ----
    const isConnected = computed(() => connectionState.value.connected);
    const isConnecting = computed(() => connectionState.value.connecting);
    const isScanning = computed(() => connectionState.value.scanning);
    const isPrinting = computed(() => connectionState.value.printing);
    const connectedPrinter = computed(() => connectionState.value.connectedPrinter);
    const error = computed(() => connectionState.value.error);

    const hasDefaultPrinter = computed(() => !!defaultPrinterId.value);

    // ---- Listener plugin (didafar sekali di module scope) ----
    async function initListeners() {
        if (listenersRegistered) return;
        listenersRegistered = true;

        try {
            await ThermalPrinter.addListener('printerFound', (event) => {
                if (!event?.printer) return;
                const p = normalizePrinter(event.printer);
                const idx = availablePrinters.value.findIndex(x => x.id === p.id);
                if (idx >= 0) {
                    availablePrinters.value[idx] = p;
                } else {
                    availablePrinters.value.push(p);
                }
            });
        } catch (e) {
            // listener tidak tersedia di platform ini
        }
    }

    // ---- Init saat composable pertama dipakai ----
    async function init() {
        isSupported.value = Capacitor.isNativePlatform();
        if (!isSupported.value) return;

        await initListeners();

        // Muat profil default dari plugin
        const profile = await printerService.getDefaultPrinter();
        if (profile) {
            defaultPrinterId.value = profile.id;
            connectionState.value.connectedPrinter = normalizePrinter({
                ...profile,
                id: profile.id,
                name: profile.name || profile.id
            });
            // Sinkronkan ID default jika plugin punya profil
            if (profile.id && !printerService.defaultPrinterId) {
                try {
                    await printerService.setDefaultPrinter(profile.id);
                } catch (e) { /* ignore */ }
            }
        }
    }

    // ---- Pencarian printer ----
    async function scanPrinters(timeoutMs = 10000) {
        if (!isSupported.value) {
            connectionState.value.error = WEB_UNSUPPORTED_MESSAGE;
            return [];
        }

        connectionState.value.scanning = true;
        connectionState.value.error = '';
        availablePrinters.value = [];

        try {
            // Minta izin sebelum scan
            const perm = await printerService.requestPermissions();
            if (!perm.granted) {
                connectionState.value.error = perm.message || perm.error
                    || 'Izin Bluetooth diperlukan untuk mencari printer.';
                return [];
            }

            const printers = await printerService.scanPrinters(timeoutMs);
            availablePrinters.value = printers.map(normalizePrinter);
            return availablePrinters.value;
        } catch (err) {
            connectionState.value.error = err?.message || 'Gagal mencari printer.';
            return [];
        } finally {
            connectionState.value.scanning = false;
        }
    }

    // ---- Koneksi ----
    async function connectPrinter(printer, setAsDefault = false) {
        if (!printer?.id) {
            connectionState.value.error = 'Data printer tidak valid.';
            return null;
        }

        connectionState.value.connecting = true;
        connectionState.value.error = '';

        try {
            const result = await printerService.connectPrinter(printer, setAsDefault);
            if (result.connected) {
                connectionState.value.connected = true;
                connectionState.value.connectedPrinter = { ...printer, id: result.printerId };
            }
            return result;
        } catch (err) {
            connectionState.value.connected = false;
            connectionState.value.error = err?.message || 'Gagal terhubung ke printer.';
            return null;
        } finally {
            connectionState.value.connecting = false;
        }
    }

    async function disconnectPrinter() {
        try {
            await printerService.disconnectPrinter();
        } catch (e) { /* ignore */ }
        connectionState.value.connected = false;
        connectionState.value.connectedPrinter = null;
        connectionState.value.error = '';
    }

    // ---- Default printer & preferensi ----
    async function setDefaultPrinter(printer) {
        if (!printer?.id) return;
        try {
            await printerService.setDefaultPrinter(printer.id);
            defaultPrinterId.value = printer.id;
            connectionState.value.connectedPrinter = printer;
        } catch (err) {
            connectionState.value.error = err?.message || 'Gagal menetapkan printer default.';
        }
    }

    function setPaperWidth(width) {
        const w = Number(width);
        if (SUPPORTED_PAPER_WIDTHS.includes(w)) {
            paperWidth.value = w;
            savePaperWidth(w);
        }
    }

    // ---- Cetak ----
    async function printTestReceipt() {
        if (!isSupported.value) {
            connectionState.value.error = WEB_UNSUPPORTED_MESSAGE;
            return null;
        }
        if (connectionState.value.printing) return null;

        connectionState.value.printing = true;
        connectionState.value.error = '';

        try {
            const result = await printerService.printTestReceipt({
                printerId: printerService.defaultPrinterId || undefined,
                paperWidthMm: paperWidth.value
            });
            return result;
        } catch (err) {
            connectionState.value.error = err?.message || 'Gagal mencetak struk uji.';
            return null;
        } finally {
            connectionState.value.printing = false;
        }
    }

    async function printReceipt(transaksi, { printerId } = {}) {
        if (!isSupported.value) {
            connectionState.value.error = WEB_UNSUPPORTED_MESSAGE;
            return null;
        }
        if (!transaksi) {
            connectionState.value.error = 'Data transaksi tidak tersedia.';
            return null;
        }
        // Cegah double-print
        if (connectionState.value.printing) return null;

        connectionState.value.printing = true;
        connectionState.value.error = '';

        try {
            const result = await printerService.printReceipt(transaksi, {
                printerId: printerId || printerService.defaultPrinterId || undefined,
                paperWidthMm: paperWidth.value
            });
            return result;
        } catch (err) {
            connectionState.value.error = err?.message || 'Gagal mencetak struk.';
            return null;
        } finally {
            connectionState.value.printing = false;
        }
    }

    // ---- Cek koneksi ----
    async function checkConnection() {
        if (!isSupported.value) return false;
        const result = await printerService.checkConnection();
        connectionState.value.connected = result.connected;
        return result.connected;
    }

    // Cleanup listener (opsional, dipanggil jika perlu)
    function cleanup() {
        // Listener plugin otomatis dibersihkan saat app ditutup
        // Tidak ada resource yang perlu di-cleanup manual
    }

    return {
        // State
        isConnected,
        isConnecting,
        isScanning,
        isPrinting,
        availablePrinters,
        connectedPrinter,
        paperWidth,
        error,
        isSupported,
        hasDefaultPrinter,
        defaultPrinterId,

        // Fungsi
        init,
        scanPrinters,
        connectPrinter,
        disconnectPrinter,
        setDefaultPrinter,
        setPaperWidth,
        printTestReceipt,
        printReceipt,
        checkConnection,
        cleanup
    };
}
