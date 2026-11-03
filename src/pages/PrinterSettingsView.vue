<template>
    <div class="page-shell">

        <!-- Header -->
        <header class="page-header">
            <h1 class="page-title">Pengaturan Printer</h1>
            <p class="page-subtitle">
                Thermal Printer Bluetooth
            </p>
        </header>

        <!-- Konten Utama -->
        <div class="page-body">

            <!-- Catatan platform web -->
            <div v-if="!isSupported" class="card border-info/30 bg-info-soft/50 p-4">
                <div class="flex items-start gap-3">
                    <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-sm font-bold text-ink">Tidak Didukung di Browser</h3>
                        <p class="mt-1 text-xs font-medium leading-relaxed text-ink-muted">
                            Pencetakan Bluetooth hanya tersedia di aplikasi Android POSSuper.
                            Gunakan fitur unduh PDF di web browser.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Status Printer -->
            <div class="card p-4">
                <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Status Printer
                </h2>

                <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        :class="statusIconClass">
                        <svg v-if="isConnected" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 13l4 4L19 7" />
                        </svg>
                        <svg v-else-if="isConnecting" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364M5.636 5.636l12.728 12.728" />
                        </svg>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold leading-tight" :class="isConnected ? 'text-success' : 'text-ink-secondary'">
                            {{ statusLabel }}
                        </p>
                        <p v-if="connectedPrinter" class="mt-0.5 truncate text-xs font-medium text-ink-muted">
                            {{ connectedPrinter.name }}
                        </p>
                        <p v-if="error" class="mt-1 text-xs font-medium text-danger">
                            {{ error }}
                        </p>
                    </div>
                </div>

                <!-- Aksi koneksi -->
                <div v-if="isSupported" class="mt-4 flex flex-wrap gap-2">
                    <button v-if="isConnected" @click="handleDisconnect"
                        class="btn-secondary flex-1 rounded-xl py-2.5 text-xs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364M5.636 5.636l12.728 12.728" />
                        </svg>
                        Putuskan Koneksi
                    </button>
                    <button @click="handleTestPrint"
                        :disabled="!isConnected || isPrinting"
                        class="btn-primary flex-1 rounded-xl py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40">
                        <svg v-if="isPrinting" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        {{ isPrinting ? 'Mencetak…' : 'Test Print' }}
                    </button>
                </div>
            </div>

            <!-- Pencarian Printer -->
            <div v-if="isSupported" class="card p-4">
                <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                        Cari Printer
                    </h2>
                    <button @click="handleScan"
                        :disabled="isScanning || isConnecting"
                        class="flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-hover transition-all hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                        <svg v-if="isScanning" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <svg v-else class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {{ isScanning ? 'Mencari…' : 'Cari Printer' }}
                    </button>
                </div>

                <!-- Empty state -->
                <div v-if="!isScanning && availablePrinters.length === 0"
                    class="rounded-xl border border-dashed border-border bg-background py-8 text-center">
                    <svg class="mx-auto mb-3 h-10 w-10 text-ink-muted/40" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364M5.636 5.636l12.728 12.728" />
                    </svg>
                    <p class="text-xs font-medium text-ink-muted">
                        Tekan "Cari Printer" untuk memindai perangkat Bluetooth di sekitar
                    </p>
                </div>

                <!-- Daftar printer -->
                <div v-else class="space-y-2">
                    <div v-for="printer in availablePrinters" :key="printer.id"
                        class="rounded-xl border p-3 transition-all"
                        :class="printer.id === defaultPrinterId
                            ? 'border-primary/40 bg-primary-soft/40'
                            : 'border-border bg-background hover:border-primary/30'">

                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <p class="truncate text-sm font-bold text-ink">{{ printer.name }}</p>
                                    <span v-if="printer.id === defaultPrinterId"
                                        class="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                        Default
                                    </span>
                                </div>
                                <p class="mt-0.5 truncate font-mono text-[10px] font-medium text-ink-muted">
                                    {{ printer.address || printer.id }}
                                </p>
                                <div class="mt-1.5 flex flex-wrap gap-1">
                                    <span class="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold text-ink-muted">
                                        {{ transportLabel(printer.transport) }}
                                    </span>
                                    <span v-if="printer.adapter"
                                        class="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase text-ink-muted">
                                        {{ printer.adapter }}
                                    </span>
                                    <span v-if="printer.brand"
                                        class="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold text-ink-muted">
                                        {{ printer.brand }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex shrink-0 flex-col gap-1.5">
                                <button @click="handleConnect(printer)"
                                    :disabled="isConnecting || isScanning"
                                    class="btn-primary rounded-lg px-3 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-40">
                                    {{ isConnecting && connectingId === printer.id ? 'Menghubungkan…' : 'Hubungkan' }}
                                </button>
                                <button v-if="printer.id !== defaultPrinterId" @click="handleSetDefault(printer)"
                                    :disabled="isConnecting"
                                    class="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">
                                    Jadikan Default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Konfigurasi Kertas -->
            <div v-if="isSupported" class="card p-4">
                <h2 class="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Ukuran Kertas
                </h2>
                <div class="grid grid-cols-2 gap-2">
                    <button v-for="size in [58, 80]" :key="size" @click="handlePaperWidth(size)"
                        class="rounded-xl border p-3 text-center transition-all"
                        :class="paperWidth === size
                            ? 'border-primary bg-primary-soft/50 text-primary-hover'
                            : 'border-border bg-background text-ink-secondary hover:border-primary/30'">
                        <p class="text-lg font-bold tabular-nums">{{ size }}<span class="text-xs font-medium">mm</span></p>
                        <p class="mt-0.5 text-[10px] font-medium text-ink-muted">
                            {{ size === 58 ? '32 kolom' : '48 kolom' }}
                        </p>
                    </button>
                </div>
            </div>

            <!-- Tombol Kembali -->
            <RouterLink to="/" class="btn-secondary rounded-2xl">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
            </RouterLink>

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useThermalPrinter } from '../composables/useThermalPrinter';
import { useToast } from '../composables/useToast';
import { TRANSPORT_LABELS } from '../utils/thermalPrinter/printerConstants';

const {
    isConnected,
    isConnecting,
    isScanning,
    isPrinting,
    availablePrinters,
    connectedPrinter,
    paperWidth,
    error,
    isSupported,
    defaultPrinterId,
    init,
    scanPrinters,
    connectPrinter,
    disconnectPrinter,
    setDefaultPrinter,
    setPaperWidth,
    printTestReceipt
} = useThermalPrinter();

const { showToast } = useToast();
const connectingId = ref(null);

const statusLabel = computed(() => {
    if (isConnecting.value) return 'Menghubungkan…';
    if (isConnected.value) return 'Terhubung';
    if (error.value) return 'Gagal';
    return 'Tidak Terhubung';
});

const statusIconClass = computed(() => {
    if (isConnected.value) return 'bg-success/15 text-success';
    if (isConnecting.value) return 'bg-primary-soft text-primary';
    if (error.value) return 'bg-danger-soft text-danger';
    return 'bg-surface-muted text-ink-muted';
});

const transportLabel = (transport) => TRANSPORT_LABELS[transport] || transport || 'Unknown';

onMounted(async () => {
    await init();
});

const handleScan = async () => {
    const printers = await scanPrinters();
    if (printers.length === 0 && !error.value) {
        showToast('Tidak ada printer ditemukan di sekitar.', 'warning');
    } else if (printers.length > 0) {
        showToast(`${printers.length} printer ditemukan.`, 'success');
    }
};

const handleConnect = async (printer) => {
    connectingId.value = printer.id;
    const result = await connectPrinter(printer, true);
    connectingId.value = null;

    if (result?.connected) {
        showToast(`Berhasil terhubung ke ${printer.name}.`, 'success');
    } else if (error.value) {
        showToast(error.value, 'error');
    }
};

const handleDisconnect = async () => {
    await disconnectPrinter();
    showToast('Koneksi printer diputus.', 'info');
};

const handleSetDefault = async (printer) => {
    await setDefaultPrinter(printer);
    if (!error.value) {
        showToast(`${printer.name} dijadikan printer default.`, 'success');
    }
};

const handleTestPrint = async () => {
    const result = await printTestReceipt();
    if (result) {
        showToast('Struk uji berhasil dikirim ke printer.', 'success');
    } else if (error.value) {
        showToast(error.value, 'error');
    }
};

const handlePaperWidth = (size) => {
    setPaperWidth(size);
    showToast(`Ukuran kertas diatur ke ${size}mm.`, 'info');
};
</script>
