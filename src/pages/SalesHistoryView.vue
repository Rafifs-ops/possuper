<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Riwayat Penjualan</h1>
            <p class="page-subtitle">
                Daftar Transaksi Selesai
            </p>
        </header>

        <!-- Bagian Konten Utama -->
        <div class="page-body">

            <!-- Search Bar & Date Filter -->
            <div class="card p-4">
                <div class="flex flex-col gap-3">
                    <!-- Search Input -->
                    <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <svg class="h-5 w-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input v-model="searchTerm" type="text"
                            placeholder="Cari berdasarkan ID transaksi atau nama produk..."
                            class="field pl-12" />
                        <button v-if="searchTerm" @click="searchTerm = ''"
                            class="absolute inset-y-0 right-0 flex items-center pr-4">
                            <svg class="h-5 w-5 text-ink-muted hover:text-ink" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="flex flex-wrap items-end gap-3">
                        <div class="min-w-[140px] flex-1">
                            <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                Tanggal Mulai
                            </label>
                            <input v-model="startDate" type="date" class="field px-4 py-3" />
                        </div>
                        <div class="min-w-[140px] flex-1">
                            <label class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                Tanggal Akhir
                            </label>
                            <input v-model="endDate" type="date" class="field px-4 py-3" />
                        </div>
                        <button @click="() => { startDate = ''; endDate = ''; currentPage = 1; }"
                            class="btn-secondary rounded-xl px-4 py-3 text-sm"
                            v-if="startDate || endDate">
                            Reset Filter
                        </button>
                    </div>

                    <div class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                        Menampilkan {{ paginatedRiwayat.length }} dari {{ filteredRiwayat.length }} transaksi
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="riwayat.length === 0" class="empty-state">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h2 class="text-base font-bold tracking-tight text-ink">Belum ada riwayat penjualan</h2>
                <p class="mt-2 max-w-[260px] text-[11px] font-medium leading-relaxed text-ink-muted">
                    Tidak ada catatan transaksi yang terdaftar di database saat ini.
                </p>
            </div>

            <!-- List Data State -->
            <div v-else class="space-y-6">
                <!-- Grouping Berdasarkan Bulan (Paginated) -->
                <div v-for="(items, month) in paginatedGroupedRiwayat" :key="month" class="flex flex-col gap-4">

                    <!-- Judul Bulan -->
                    <h2 class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-secondary">
                        <span class="h-4 w-1 rounded-full bg-primary"></span>
                        {{ month }}
                    </h2>

                    <!-- Kartu Riwayat -->
                    <div v-for="item in items" :key="item.id"
                        class="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-5">

                        <!-- Header Kartu: ID & Tanggal -->
                        <div class="relative z-10 mb-3 flex flex-wrap items-start justify-between gap-2">
                            <span class="rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                                ID: {{ item.id }}
                            </span>
                            <span class="flex items-center gap-1 text-[11px] font-semibold text-ink-muted">
                                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 01-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {{ item.tanggal }}
                            </span>
                        </div>

                        <!-- Total Penjualan -->
                        <div class="relative z-10 mb-4">
                            <p class="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total Penjualan</p>
                            <p class="text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
                                Rp {{ (item.totalPenjualan || 0).toLocaleString('id-ID') }}
                            </p>
                        </div>

                        <!-- Detail Produk -->
                        <div class="relative z-10 mb-4 rounded-xl border border-border bg-background p-4">
                            <h3 class="mb-3 flex justify-between gap-2 border-b border-dashed border-border pb-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                <span>Detail Produk Terjual</span>
                                <span class="rounded bg-surface px-2 py-0.5 text-ink-secondary">{{ item.items?.length || 0 }} Item</span>
                            </h3>

                            <div class="flex flex-col gap-3">
                                <div v-for="(prod, idx) in item.items" :key="idx"
                                    class="flex items-center justify-between gap-3">
                                    <div class="min-w-0 flex-1 pr-2">
                                        <p class="truncate text-sm font-semibold leading-tight text-ink">{{ prod.nama }}</p>
                                        <p class="mt-0.5 text-[10px] font-medium text-ink-muted tabular-nums">
                                            {{ prod.quantity }} x Rp {{ (prod.harga || 0).toLocaleString('id-ID') }}
                                        </p>
                                    </div>
                                    <div class="shrink-0 rounded-lg bg-surface px-2.5 py-1 text-sm font-bold text-ink tabular-nums">
                                        Rp {{ (prod.quantity * (prod.harga || 0)).toLocaleString('id-ID') }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tombol Aksi -->
                        <div class="relative z-10 mt-auto space-y-2">
                            <!-- Cetak Struk Thermal -->
                            <button @click="cetakStruk(item)"
                                :disabled="isPrinting || !isSupported"
                                class="btn-primary w-full rounded-xl py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40">
                                <svg v-if="isPrinting && printingId === item.id" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                {{ isPrinting && printingId === item.id ? 'Mencetak…' : 'Cetak Struk' }}
                            </button>

                            <div class="flex gap-3">
                                <button @click="unduhPDF(item)"
                                    class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-strong py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-strong-hover active:scale-95">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Unduh Nota
                                </button>
                                <button @click="hapusRiwayat(item.id)" title="Hapus Riwayat"
                                    class="flex w-12 items-center justify-center rounded-xl bg-danger-soft text-danger shadow-sm transition-all hover:bg-danger hover:text-white active:scale-95">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State for Search / Filter -->
                <div v-if="filteredRiwayat.length === 0 && riwayat.length > 0" class="empty-state">
                    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h2 class="text-base font-bold tracking-tight text-ink">Tidak Ada Hasil</h2>
                    <p class="mt-2 max-w-[260px] text-[11px] font-medium leading-relaxed text-ink-muted">
                        Tidak ada transaksi yang cocok dengan kata kunci atau filter tanggal pencarian Anda.
                    </p>
                </div>

                <!-- Pagination Controls -->
                <div v-if="filteredRiwayat.length > 0" class="card p-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                            Halaman {{ currentPage }} dari {{ totalPages || 1 }}
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToFirstPage()" :disabled="currentPage === 1"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                title="Halaman Pertama">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <button @click="prevPage()" :disabled="currentPage === 1"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                title="Halaman Sebelumnya">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>

                            <div class="flex items-center gap-1 px-2">
                                <button v-for="(page, idx) in getPageNumbers" :key="typeof page === 'number' ? page : 'ellipsis-' + idx"
                                    @click="typeof page === 'number' ? goToPage(page) : null"
                                    :disabled="typeof page !== 'number'"
                                    :class="`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${page === currentPage ? 'bg-primary-strong text-white shadow-sm' : 'bg-surface text-ink-secondary border border-border hover:border-primary/40 hover:text-primary'} ${typeof page !== 'number' ? 'cursor-default' : ''}`">
                                    {{ page }}
                                </button>
                            </div>

                            <button @click="nextPage()" :disabled="currentPage === totalPages"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                title="Halaman Berikutnya">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 5l7 7m0 0l-7 7m7-7H6" />
                                </svg>
                            </button>
                            <button @click="goToLastPage()" :disabled="currentPage === totalPages"
                                class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                title="Halaman Terakhir">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 5l7 7m0 0l-7 7m7-7H6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tombol Kembali -->
            <RouterLink to="/" class="btn-secondary rounded-2xl">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Menu Utama
            </RouterLink>

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { db } from '../database/db';
import { generateAndDownloadReceiptPDF } from '../utils/pdfHandler';
import { useToast } from '../composables/useToast';
import { useThermalPrinter } from '../composables/useThermalPrinter';

const router = useRouter();
const riwayat = ref([]);
const { showToast } = useToast();
const {
    isPrinting,
    isSupported,
    hasDefaultPrinter,
    error: printError,
    printReceipt
} = useThermalPrinter();
const printingId = ref(null);

// State untuk search, date filter, dan pagination
const searchTerm = ref('');
const startDate = ref('');
const endDate = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

onMounted(async () => {
    await loadRiwayat();
});

const loadRiwayat = async () => {
    try {
        riwayat.value = await db.penjualan.orderBy('id').reverse().toArray();
    } catch (e) {
        console.error('Gagal memuat riwayat:', e);
        showToast('Gagal memuat riwayat penjualan.', 'error');
    }
};

// Reset ke halaman 1 saat filter pencarian atau tanggal berubah
watch([searchTerm, startDate, endDate], () => {
    currentPage.value = 1;
});

// Computed untuk filtering data berdasarkan search term dan tanggal
const filteredRiwayat = computed(() => {
    let filtered = riwayat.value;

    // Filter berdasarkan search term
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase().trim();
        filtered = filtered.filter(item =>
            item.id.toString().includes(term) ||
            (item.items && item.items.some(prod =>
                prod.nama.toLowerCase().includes(term) ||
                (prod.harga && prod.harga.toString().includes(term))
            ))
        );
    }

    // Filter berdasarkan tanggal
    if (startDate.value) {
        filtered = filtered.filter(item => item.tanggal && item.tanggal.substring(0, 10) >= startDate.value);
    }
    if (endDate.value) {
        filtered = filtered.filter(item => item.tanggal && item.tanggal.substring(0, 10) <= endDate.value);
    }

    return filtered;
});

// Pagination computed
const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredRiwayat.value.length / itemsPerPage.value));
});

const paginatedRiwayat = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredRiwayat.value.slice(start, end);
});

// Grouped data berdasarkan bulan dari transaksi di halaman aktif
const paginatedGroupedRiwayat = computed(() => {
    const groups = {};
    paginatedRiwayat.value.forEach(item => {
        let monthName = 'Tidak Diketahui';
        let year = '';
        if (item.tanggal) {
            const yyyy = item.tanggal.substring(0, 4);
            const mm = item.tanggal.substring(5, 7);
            const monthIdx = parseInt(mm, 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
                monthName = bulanIndo[monthIdx];
                year = yyyy;
            }
        }
        const key = `${monthName} ${year}`.trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    return groups;
});

// Fungsi helper untuk pagination
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const goToFirstPage = () => {
    currentPage.value = 1;
};

const goToLastPage = () => {
    currentPage.value = totalPages.value;
};

const getPageNumbers = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = currentPage.value;

    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        if (current <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        } else if (current >= total - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = total - 3; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = current - 1; i <= current + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        }
    }
    return pages;
});

const hapusRiwayat = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus riwayat penjualan ini?')) {
        try {
            await db.penjualan.delete(id);
            riwayat.value = riwayat.value.filter(item => item.id !== id);
            showToast('Riwayat penjualan berhasil dihapus', 'success');
        } catch (error) {
            console.error('Gagal menghapus riwayat:', error);
            showToast('Gagal menghapus riwayat penjualan', 'error');
        }
    }
};

const unduhPDF = async (transaksi) => {
    try {
        await generateAndDownloadReceiptPDF(transaksi);
        showToast('PDF berhasil diunduh.', 'success');
    } catch (e) {
        console.error('Gagal mengunduh PDF:', e);
        showToast('Gagal mengunduh PDF struk.', 'error');
    }
};

const cetakStruk = async (transaksi) => {
    // Jika belum ada printer default, arahkan ke pengaturan printer
    if (!hasDefaultPrinter.value) {
        showToast('Belum ada printer default. Atur printer terlebih dahulu.', 'warning', 4000);
        router.push('/printer-settings');
        return;
    }

    printingId.value = transaksi.id;
    const result = await printReceipt(transaksi);
    printingId.value = null;

    if (result) {
        showToast(`Struk transaksi #${transaksi.id} berhasil dikirim ke printer.`, 'success');
    } else if (printError.value) {
        showToast(printError.value, 'error');
    }
};
</script>
