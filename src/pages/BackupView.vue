<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Backup & Restore</h1>
            <p class="page-subtitle">
                Pindahkan data ke perangkat lain
            </p>
        </header>

        <!-- Bagian Konten Utama -->
        <div class="page-body">

            <!-- Informasi Backup -->
            <div class="card-soft flex items-start gap-3.5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary-hover shadow-sm">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>
                <div class="min-w-0">
                    <h2 class="text-sm font-bold leading-snug text-ink">
                        Amankan data bisnismu dan pindahkan seluruh aktivitas toko ke perangkat lain dengan mudah.
                    </h2>
                    <p class="mt-1.5 text-[11px] font-medium leading-relaxed text-ink-secondary">
                        Semua data disimpan secara lokal. File backup hanya tersimpan di perangkat atau lokasi yang kamu pilih.
                    </p>
                </div>
            </div>

            <!-- Ekspor Data -->
            <section class="card flex flex-col gap-4 p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3 border-b border-border pb-3.5">
                    <div class="flex items-center gap-3">
                        <div class="icon-tile">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-sm font-bold tracking-tight text-ink">Ekspor Data</h2>
                            <p class="text-[11px] font-medium text-ink-muted">Satu file JSON untuk semua data</p>
                        </div>
                    </div>
                    <span class="chip shrink-0">JSON</span>
                </div>

                <p class="text-xs font-medium leading-relaxed text-ink-secondary">
                    Unduh seluruh data bisnismu dalam satu file JSON untuk disimpan atau dipindahkan ke perangkat lain.
                </p>

                <!-- Ringkasan data saat ini -->
                <div class="grid grid-cols-2 gap-2.5">
                    <div v-for="item in statItems" :key="item.key"
                        class="rounded-xl border border-border bg-background px-3.5 py-3">
                        <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{{ item.label }}</p>
                        <p class="mt-1 text-lg font-bold tracking-tight text-ink tabular-nums">
                            {{ item.value.toLocaleString('id-ID') }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2 rounded-xl bg-surface-muted px-3.5 py-2.5">
                    <svg class="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-[11px] font-semibold text-ink-secondary">
                        Backup terakhir:
                        <span class="text-ink">{{ lastBackupAt ? formatDateTime(lastBackupAt) : 'Belum pernah dibuat' }}</span>
                    </p>
                </div>

                <button type="button" class="btn-primary w-full rounded-2xl py-4" :disabled="isBusy" @click="eksporData">
                    <span v-if="isExporting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {{ isExporting ? 'Menyiapkan file...' : 'Ekspor Data' }}
                </button>

                <p class="text-center text-[10px] font-medium leading-relaxed text-ink-muted">
                    <template v-if="isNative">
                        File disimpan sebagai <span class="font-bold text-ink-secondary">POSSuper-Backup-YYYY-MM-DD.json</span>,
                        lalu kamu bisa membagikannya lewat WhatsApp, Bluetooth, atau Google Drive.
                    </template>
                    <template v-else>
                        File akan terunduh dengan nama <span class="font-bold text-ink-secondary">POSSuper-Backup-YYYY-MM-DD.json</span>.
                    </template>
                </p>
            </section>

            <!-- Impor Data -->
            <section class="card flex flex-col gap-4 p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3 border-b border-border pb-3.5">
                    <div class="flex items-center gap-3">
                        <div class="icon-tile">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-sm font-bold tracking-tight text-ink">Impor Data</h2>
                            <p class="text-[11px] font-medium text-ink-muted">Pulihkan dari file backup</p>
                        </div>
                    </div>
                    <span class="chip shrink-0">Restore</span>
                </div>

                <p class="text-xs font-medium leading-relaxed text-ink-secondary">
                    Sudah punya file backup? Pulihkan seluruh data toko dari perangkat sebelumnya dalam beberapa langkah.
                </p>

                <input ref="fileInput" type="file" accept=".json,application/json" class="hidden" @change="pilihFile" />

                <button type="button" class="btn-secondary w-full rounded-2xl py-4" :disabled="isBusy"
                    @click="bukaFilePicker">
                    <span v-if="isReadingFile"
                        class="h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-primary"></span>
                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {{ isReadingFile ? 'Membaca file...' : 'Pilih File JSON' }}
                </button>

                <!-- Preview backup terpilih -->
                <div v-if="pendingBackup"
                    class="flex flex-col gap-3.5 rounded-xl border border-primary/25 bg-primary-tint p-4">
                    <div class="flex items-start gap-2.5">
                        <svg class="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div class="min-w-0">
                            <p class="text-[10px] font-bold uppercase tracking-widest text-primary-hover">File terpilih</p>
                            <p class="mt-0.5 truncate text-xs font-bold text-ink">{{ pendingBackup.fileName }}</p>
                        </div>
                    </div>

                    <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5">
                        <div class="col-span-2">
                            <dt class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Nama toko</dt>
                            <dd class="text-xs font-bold text-ink">{{ pendingBackup.summary.storeName || 'Tidak tercatat' }}</dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tanggal backup</dt>
                            <dd class="text-xs font-bold text-ink">
                                {{ pendingBackup.summary.exportedAt ? formatDateTime(pendingBackup.summary.exportedAt) : 'Tidak tercatat' }}
                            </dd>
                        </div>
                        <div v-for="item in previewItems" :key="item.key"
                            class="rounded-lg bg-surface/80 px-3 py-2">
                            <dt class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{{ item.label }}</dt>
                            <dd class="text-sm font-bold text-ink tabular-nums">{{ item.value.toLocaleString('id-ID') }}</dd>
                        </div>
                    </dl>

                    <!-- Pilihan data yang dipulihkan (restore selektif) -->
                    <div class="flex flex-col gap-2.5 border-t border-primary/25 pt-3.5">
                        <div class="flex items-center justify-between gap-2">
                            <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                Pilih data yang dipulihkan
                            </p>
                            <span class="text-[10px] font-bold text-primary-hover tabular-nums">
                                {{ selectedTables.length }}/{{ tableOptions.length }} dipilih
                            </span>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label v-for="opt in tableOptions" :key="opt.key" :for="`table-${opt.key}`"
                                class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                                :class="isTableSelected(opt.key)
                                    ? 'border-primary/40 bg-surface'
                                    : 'border-border bg-background'">
                                <input :id="`table-${opt.key}`" type="checkbox"
                                    class="h-4 w-4 shrink-0 accent-primary" :checked="isTableSelected(opt.key)"
                                    @change="toggleTable(opt.key)" />
                                <span class="flex-1 text-xs font-bold leading-snug text-ink">{{ opt.label }}</span>
                                <span class="text-[11px] font-bold text-ink-muted tabular-nums">
                                    {{ (pendingBackup.summary.counts[opt.key] || 0).toLocaleString('id-ID') }} item
                                </span>
                            </label>
                        </div>

                        <p class="text-[10px] font-medium leading-relaxed text-ink-muted">
                            Snapshot persediaan selalu dipulihkan bersama produk agar nilai stok tetap konsisten.
                            Tabel yang tidak dicentang tidak akan diubah.
                        </p>
                    </div>

                    <div class="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-soft p-3">
                        <svg class="mt-0.5 h-4 w-4 shrink-0 text-warning" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p class="text-[11px] font-semibold leading-relaxed text-ink">
                            <template v-if="hasLocalData">
                                Perhatian! Import data akan mengganti seluruh data produk, penjualan, pengeluaran, dan
                                persediaan yang saat ini tersimpan di perangkat ini dengan data dari file backup.
                                Pastikan Anda telah melakukan backup data sebelumnya.
                            </template>
                            <template v-else>
                                Perangkat ini belum memiliki data bisnis. Seluruh data dari file backup akan dipulihkan
                                dan langsung bisa dipakai.
                            </template>
                        </p>
                    </div>

                    <div class="flex flex-col gap-2 sm:flex-row-reverse">
                        <button type="button" class="btn-primary flex-1 rounded-xl py-3 text-xs"
                            :disabled="isBusy || !hasSelectedTables" @click="mintaKonfirmasi">
                            Pulihkan Data
                        </button>
                        <button type="button" class="btn-ghost flex-1 rounded-xl border border-border py-3 text-xs"
                            :disabled="isBusy" @click="cancelPendingBackup">
                            Batalkan
                        </button>
                    </div>
                </div>
            </section>

            <!-- Panduan Pindah Perangkat -->
            <section class="card flex flex-col gap-4 p-5 sm:p-6">
                <div class="border-b border-border pb-3">
                    <h2 class="text-sm font-bold tracking-tight text-ink">Panduan Pindah Perangkat</h2>
                    <p class="text-[11px] font-medium text-ink-muted">Tiga langkah, data pindah tanpa internet</p>
                </div>

                <ol class="flex flex-col gap-3">
                    <li v-for="(langkah, index) in panduan" :key="langkah.title" class="flex items-start gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-hover">
                            <span class="text-xs font-extrabold tabular-nums">{{ index + 1 }}</span>
                        </div>
                        <div class="min-w-0">
                            <h3 class="text-xs font-bold text-ink">{{ langkah.title }}</h3>
                            <p class="mt-0.5 text-[11px] font-medium leading-relaxed text-ink-secondary">
                                {{ langkah.desc }}
                            </p>
                        </div>
                    </li>
                </ol>
            </section>

            <!-- Catatan Keamanan -->
            <div class="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent-tint p-4">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p class="text-[11px] font-medium leading-relaxed text-ink-secondary">
                    File backup berisi data bisnis toko. Simpan di lokasi yang aman dan jangan bagikan ke orang yang
                    tidak berkepentingan. Tidak ada data yang diunggah ke server atau cloud.
                </p>
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

        <!-- Modal Konfirmasi Restore -->
        <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="showConfirm && pendingBackup" class="modal-overlay">
                <div class="modal-panel max-w-sm p-6">
                    <div class="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h4 class="text-sm font-extrabold uppercase tracking-wide text-ink">Pulihkan Data?</h4>
                            <p class="mt-1 text-[11px] font-medium text-ink-muted">
                                Data di perangkat ini akan diganti.
                            </p>
                        </div>
                        <button type="button" class="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                            :disabled="isRestoring" @click="showConfirm = false">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="flex flex-col gap-3">
                        <p class="rounded-xl border border-warning/30 bg-warning-soft p-3 text-[11px] font-semibold leading-relaxed text-ink">
                            Data yang dipilih akan diganti dengan isi file
                            <span class="font-bold">{{ pendingBackup.fileName }}</span>. Tindakan ini tidak dapat dibatalkan.
                        </p>

                        <div class="rounded-xl border border-border bg-background p-3">
                            <p class="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                Data yang dipulihkan
                            </p>
                            <ul class="flex flex-wrap gap-1.5">
                                <li v-for="opt in selectedOptions" :key="opt.key"
                                    class="rounded-lg bg-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-hover">
                                    {{ opt.label }}
                                </li>
                            </ul>
                        </div>

                        <dl class="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3">
                            <div class="flex items-center justify-between gap-2">
                                <dt class="text-[11px] font-semibold text-ink-secondary">Nama toko</dt>
                                <dd class="truncate text-[11px] font-bold text-ink">
                                    {{ pendingBackup.summary.storeName || '-' }}
                                </dd>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <dt class="text-[11px] font-semibold text-ink-secondary">Tanggal backup</dt>
                                <dd class="text-[11px] font-bold text-ink">
                                    {{ pendingBackup.summary.exportedAt ? formatDateTime(pendingBackup.summary.exportedAt) : '-' }}
                                </dd>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <dt class="text-[11px] font-semibold text-ink-secondary">Produk</dt>
                                <dd class="text-[11px] font-bold text-ink tabular-nums">
                                    {{ pendingBackup.summary.counts.produk.toLocaleString('id-ID') }}
                                </dd>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <dt class="text-[11px] font-semibold text-ink-secondary">Transaksi</dt>
                                <dd class="text-[11px] font-bold text-ink tabular-nums">
                                    {{ pendingBackup.summary.counts.penjualan.toLocaleString('id-ID') }}
                                </dd>
                            </div>
                        </dl>

                        <div class="mt-1 flex items-center justify-end gap-2">
                            <button type="button" class="btn-ghost rounded-xl border border-border" :disabled="isRestoring"
                                @click="showConfirm = false">
                                Batal
                            </button>
                            <button type="button" class="btn-primary rounded-xl px-5 py-2.5 text-xs" :disabled="isRestoring"
                                @click="konfirmasiRestore">
                                <span v-if="isRestoring"
                                    class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                                {{ isRestoring ? 'Memulihkan...' : 'Ya, Pulihkan' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { useBackup } from '../composables/useBackup';

const {
    isExporting,
    isReadingFile,
    isRestoring,
    isBusy,
    hasLocalData,
    stats,
    lastBackupAt,
    pendingBackup,
    selectedTables,
    hasSelectedTables,
    isTableSelected,
    toggleTable,
    loadStats,
    exportData,
    selectBackupFile,
    cancelPendingBackup,
    restorePendingBackup
} = useBackup();

const fileInput = ref(null);
const showConfirm = ref(false);
const isNative = Capacitor.isNativePlatform();

onMounted(() => {
    loadStats();
});

const statItems = computed(() => [
    { key: 'produk', label: 'Produk', value: stats.value.produk },
    { key: 'penjualan', label: 'Transaksi', value: stats.value.penjualan },
    { key: 'pengeluaran', label: 'Pengeluaran', value: stats.value.pengeluaran },
    { key: 'persediaan', label: 'Snapshot Stok', value: stats.value.persediaan },
    { key: 'kasManual', label: 'Kas Manual', value: stats.value.kasManual }
]);

const previewItems = computed(() => {
    const counts = pendingBackup.value?.summary?.counts;
    if (!counts) return [];
    return [
        { key: 'produk', label: 'Produk', value: counts.produk },
        { key: 'penjualan', label: 'Transaksi', value: counts.penjualan },
        { key: 'pengeluaran', label: 'Pengeluaran', value: counts.pengeluaran },
        { key: 'persediaan', label: 'Snapshot Stok', value: counts.persediaan },
        { key: 'kasManual', label: 'Kas Manual', value: counts.kasManual || 0 }
    ];
});

const tableOptions = [
    { key: 'produk', label: 'Produk & stok' },
    { key: 'penjualan', label: 'Riwayat penjualan' },
    { key: 'pengeluaran', label: 'Pengeluaran / biaya' },
    { key: 'persediaan', label: 'Snapshot persediaan' },
    { key: 'profilToko', label: 'Profil toko' },
    { key: 'kasManual', label: 'Transaksi kas manual' },
    { key: 'saldoAwalKas', label: 'Saldo awal kas' }
];

const selectedOptions = computed(() => tableOptions.filter((opt) => isTableSelected(opt.key)));

const panduan = [
    {
        title: 'Ekspor',
        desc: 'Buka POSSuper di perangkat lama dan ekspor seluruh data.'
    },
    {
        title: 'Pindahkan',
        desc: 'Kirim file JSON ke perangkat baru melalui WhatsApp, Bluetooth, atau media lainnya.'
    },
    {
        title: 'Pulihkan',
        desc: 'Buka POSSuper di perangkat baru, pilih file backup, lalu lakukan import.'
    }
];

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const bukaFilePicker = () => {
    if (isBusy.value) return;
    fileInput.value?.click();
};

const pilihFile = async (event) => {
    const file = event.target.files?.[0];
    // Reset agar file yang sama bisa dipilih ulang setelah gagal validasi.
    event.target.value = '';
    if (!file) return;
    showConfirm.value = false;
    await selectBackupFile(file);
};

const eksporData = async () => {
    await exportData();
};

const mintaKonfirmasi = () => {
    if (!pendingBackup.value || isBusy.value) return;
    showConfirm.value = true;
};

const konfirmasiRestore = async () => {
    const berhasil = await restorePendingBackup();
    if (berhasil) {
        showConfirm.value = false;
    }
};
</script>
