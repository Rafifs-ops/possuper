<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header pt-10 pb-12">
            <div class="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success text-white shadow-lg shadow-success/30">
                <div class="absolute inset-0 animate-ping rounded-2xl border-2 border-success/60 opacity-40"></div>
                <svg class="relative z-10 h-7 w-7" fill="none" stroke="currentColor" stroke-width="3"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 class="page-title">Transaksi Berhasil!</h1>
            <p class="page-subtitle">
                Penjualan telah tersimpan di sistem
            </p>
        </header>

        <!-- Bagian Konten Utama -->
        <div class="page-body">

            <!-- Card Nota / Receipt -->
            <div class="card flex flex-col gap-4 p-5 sm:p-6">

                <!-- Header Nota: Identitas Toko & Transaksi -->
                <div class="border-b border-dashed border-border pb-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-1">
                            <h2 class="text-lg font-bold leading-tight tracking-tight text-ink">
                                {{ storeProfile.namaToko || 'POSSuper' }}
                            </h2>
                            <p v-if="storeProfile.alamatToko" class="mt-1 text-xs font-medium leading-snug text-ink-secondary">
                                {{ storeProfile.alamatToko }}
                            </p>
                            <p v-if="storeProfile.noHp" class="mt-0.5 text-[11px] font-semibold text-ink-muted">
                                Telp/WA: {{ storeProfile.noHp }}
                            </p>
                        </div>
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-hover">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>

                    <div class="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                            ID: #{{ transaksi?.id || '-' }}
                        </span>
                        <span class="rounded-lg bg-background px-2.5 py-1 font-mono text-[11px] font-bold text-ink-secondary">
                            {{ transaksi?.tanggal }}
                        </span>
                    </div>
                </div>

                <!-- Daftar Item Barang -->
                <div class="my-1 space-y-3">
                    <div v-for="(item, index) in transaksi?.items" :key="index"
                        class="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                        <div class="min-w-0 pr-2">
                            <p class="truncate text-sm font-bold leading-tight text-ink">{{ item.nama }}</p>
                            <p class="mt-0.5 text-[11px] font-medium text-ink-muted tabular-nums">
                                {{ item.quantity }} x Rp {{ Number(item.harga).toLocaleString('id-ID') }}
                            </p>
                        </div>
                        <div class="shrink-0 rounded-lg bg-surface px-2.5 py-1.5 font-bold text-ink tabular-nums">
                            Rp {{ (Number(item.harga) * item.quantity).toLocaleString('id-ID') }}
                        </div>
                    </div>
                </div>

                <!-- Total Penjualan -->
                <div class="flex items-center justify-between gap-3 border-t border-dashed border-border pt-4">
                    <p class="text-[11px] font-bold uppercase tracking-widest text-ink-secondary">Total Penjualan</p>
                    <p class="text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
                        Rp {{ (transaksi?.totalPenjualan || 0).toLocaleString('id-ID') }}
                    </p>
                </div>

                <!-- QR Code (latar terang agar tetap mudah dipindai) -->
                <div class="mx-auto mt-3 flex w-max flex-col items-center justify-center rounded-xl border border-border bg-surface p-4 shadow-inner">
                    <img :src="qrCodeBase64" alt="QR Code Nota"
                        :style="{ width: qrDisplaySize + 'px', height: qrDisplaySize + 'px' }"
                        class="max-w-full object-contain mix-blend-multiply" />
                    <span class="mt-2 text-[9px] font-bold uppercase tracking-widest text-ink-muted">Scan QR Nota</span>
                </div>
            </div>

            <!-- Area Tombol Aksi -->
            <!-- Tombol Cetak Struk Thermal (full width) -->
            <div class="mt-1">
                <button @click="cetakStruk" :disabled="isPrinting || !isSupported"
                    class="btn-primary w-full rounded-2xl py-4 disabled:cursor-not-allowed disabled:opacity-50">
                    <svg v-if="isPrinting" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                            stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {{ isPrinting ? 'Mencetak…' : 'Cetak Struk' }}
                </button>
            </div>

            <!-- Tombol PDF & Transaksi Baru -->
            <div class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <!-- Tombol Unduh PDF -->
                <button @click="unduhPDF" class="btn-secondary rounded-2xl py-4">
                    <svg class="h-5 w-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh PDF
                </button>

                <!-- Tombol Transaksi Baru -->
                <RouterLink to="/scan" class="btn-primary rounded-2xl py-4">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Transaksi Baru
                </RouterLink>
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
import { useRoute, useRouter } from 'vue-router';
import { db } from '../database/db';
import { generateAndDownloadReceiptPDF } from '../utils/pdfHandler';
import QRCode from 'qrcode'; // <--- Import di sini
import { useToast } from '../composables/useToast';
import { useStoreProfile } from '../composables/useStoreProfile';
import { useThermalPrinter } from '../composables/useThermalPrinter';

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { storeProfile } = useStoreProfile();
const {
    isPrinting,
    isSupported,
    hasDefaultPrinter,
    error: printError,
    printReceipt
} = useThermalPrinter();
const transaksi = ref(null);

const qrCodeBase64 = ref(null);

const qrDisplaySize = computed(() => {
    const baseSize = 160; // Ukuran dasar (w-40 h-40 = 160px)
    const itemCount = transaksi.value?.items?.length || 0;
    // Tambah 15px per jenis barang, maksimum 320px
    return Math.min(baseSize + (itemCount * 15), 320);
});

onMounted(async () => {
    try {
        const id = Number(route.query.id);
        if (id) {
            transaksi.value = await db.penjualan.get(id);
            // Generate QR Code di sini setelah data transaksi di-fetch
            if (transaksi.value && transaksi.value.tokenNota) {
                const urlTujuan = `https://rafifs-ops.github.io/note-viewer-smartpos/?t=${transaksi.value.tokenNota}`;
                qrCodeBase64.value = await QRCode.toDataURL(urlTujuan, { margin: 4, width: 500, errorCorrectionLevel: 'L', scale: 4 });
            }
        }
    } catch (e) {
        console.error('Gagal memuat data transaksi:', e);
        showToast('Terjadi kesalahan saat memuat data transaksi.', 'error');
    }
    if (!transaksi.value) {
        showToast("Data transaksi tidak ditemukan!", "error");
        router.replace('/');
    }
});

const unduhPDF = async () => {
    if (!transaksi.value) return;
    try {
        await generateAndDownloadReceiptPDF(transaksi.value, qrCodeBase64.value);
        showToast('PDF berhasil diunduh.', 'success');
    } catch (e) {
        console.error('Gagal mengunduh PDF:', e);
        showToast('Gagal mengunduh PDF struk.', 'error');
    }
};

const cetakStruk = async () => {
    if (!transaksi.value) return;

    // Jika belum ada printer default, arahkan ke pengaturan printer
    if (!hasDefaultPrinter.value) {
        showToast('Belum ada printer default. Atur printer terlebih dahulu.', 'warning', 4000);
        router.push('/printer-settings');
        return;
    }

    const result = await printReceipt(transaksi.value);
    if (result) {
        showToast('Struk berhasil dikirim ke printer.', 'success');
    } else if (printError.value) {
        showToast(printError.value, 'error');
    }
};
</script>
