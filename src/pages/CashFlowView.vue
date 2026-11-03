<template>
    <div class="page-shell">

        <!-- Header -->
        <header class="page-header">
            <h1 class="page-title">Riwayat Kas</h1>
            <p class="page-subtitle">Pantau seluruh uang yang masuk dan keluar dari tokomu</p>
        </header>

        <div class="page-body max-w-3xl">

            <!-- Loading -->
            <div v-if="isLoading" class="empty-state">
                <div class="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary"></div>
                <p class="text-sm font-bold text-ink">Memuat data arus kas...</p>
            </div>

            <template v-else>

                <!-- Ringkasan Arus Kas -->
                <section aria-labelledby="ringkas-title">
                    <h2 id="ringkas-title" class="section-title">Ringkasan Arus Kas</h2>
                    <p class="section-desc">Ringkasan kas pada periode yang dipilih.</p>

                    <div class="rounded-2xl border border-accent/20 bg-accent-tint p-4 shadow-sm sm:p-5">
                        <div class="mb-3 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-success">Kas Masuk</p>
                                <p class="mt-1 text-sm font-bold tabular-nums text-success sm:text-base">Rp {{ fmt(totals.kasMasuk) }}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-danger">Kas Keluar</p>
                                <p class="mt-1 text-sm font-bold tabular-nums text-danger sm:text-base">Rp {{ fmt(totals.kasKeluar) }}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Arus Kas Bersih</p>
                                <p class="mt-1 text-sm font-bold tabular-nums sm:text-base"
                                    :class="totals.arusKasBersih > 0 ? 'text-success' : totals.arusKasBersih < 0 ? 'text-danger' : 'text-ink-muted'">
                                    {{ totals.arusKasBersih >= 0 ? '+' : '−' }}Rp {{ fmt(Math.abs(totals.arusKasBersih)) }}
                                </p>
                            </div>
                        </div>

                        <div v-if="totals.saldoAwalTersedia" class="space-y-1.5 border-t border-accent/15 pt-3 text-xs">
                            <div class="flex justify-between">
                                <span class="text-ink-secondary">Saldo awal periode</span>
                                <span class="font-semibold tabular-nums text-ink">Rp {{ fmt(totals.saldoAwal) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-ink-secondary">Estimasi saldo akhir</span>
                                <span class="font-bold tabular-nums" :class="totals.saldoAkhir >= 0 ? 'text-ink' : 'text-danger'">
                                    Rp {{ fmt(totals.saldoAkhir) }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="border-t border-accent/15 pt-3 text-center text-[11px] font-medium text-ink-muted">
                            Atur saldo awal untuk mengetahui estimasi saldo kas toko.
                        </div>
                    </div>
                </section>

                <!-- Pengaturan Saldo Awal -->
                <section aria-labelledby="saldo-title">
                    <div class="card p-4 sm:p-5">
                        <div class="mb-3 flex items-center justify-between">
                            <div>
                                <h2 id="saldo-title" class="text-sm font-bold text-ink">Saldo Awal Kas</h2>
                                <p class="mt-0.5 text-[11px] font-medium text-ink-muted">
                                    {{ saldoAwalConfig
                                        ? `Berlaku sejak ${formatTanggalPendek(saldoAwalConfig.berlakuSejak)}`
                                        : 'Belum disetel. Atur agar estimasi saldo akhir tampil.' }}
                                </p>
                            </div>
                            <button @click="bukaModalSaldoAwal" class="btn-ghost rounded-xl text-xs">
                                {{ saldoAwalConfig ? 'Ubah' : 'Atur' }}
                            </button>
                        </div>
                        <div v-if="saldoAwalConfig" class="text-lg font-bold tabular-nums text-ink">
                            Rp {{ fmt(saldoAwalConfig.saldoAwal) }}
                        </div>
                    </div>
                </section>

                <!-- Filter -->
                <section aria-labelledby="filter-title">
                    <h2 id="filter-title" class="section-title">Filter Transaksi</h2>

                    <!-- Periode -->
                    <div class="card mb-3 p-4 sm:p-5">
                        <label class="field-label">Periode</label>
                        <div class="mb-3 flex flex-wrap gap-2">
                            <button v-for="p in periodeFilters" :key="p.value" @click="pilihPeriode(p.value)"
                                class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                                :class="filterPeriode === p.value
                                    ? 'bg-primary-strong text-white'
                                    : 'bg-surface-muted text-ink-secondary hover:bg-primary-soft'">
                                {{ p.label }}
                            </button>
                        </div>
                        <div v-if="filterPeriode === 'custom'" class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="field-label">Dari</label>
                                <input v-model="customStart" type="date" class="field" @change="muatData" />
                            </div>
                            <div>
                                <label class="field-label">Sampai</label>
                                <input v-model="customEnd" type="date" class="field" @change="muatData" />
                            </div>
                        </div>

                        <!-- Tipe & Aktivitas -->
                        <div class="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label class="field-label">Jenis</label>
                                <select v-model="filterTipe" class="field appearance-none" @change="muatData">
                                    <option value="semua">Semua Transaksi</option>
                                    <option value="masuk">Kas Masuk</option>
                                    <option value="keluar">Kas Keluar</option>
                                </select>
                            </div>
                            <div>
                                <label class="field-label">Aktivitas</label>
                                <select v-model="filterAktivitas" class="field appearance-none" @change="muatData">
                                    <option value="semua">Semua Aktivitas</option>
                                    <option value="operasi">Operasi</option>
                                    <option value="investasi">Investasi</option>
                                    <option value="pendanaan">Pendanaan</option>
                                </select>
                            </div>
                        </div>

                        <!-- Search -->
                        <div class="mt-3">
                            <label class="field-label">Pencarian</label>
                            <input v-model="searchQuery" type="text" placeholder="Cari keterangan atau kategori..."
                                class="field" />
                        </div>
                    </div>
                </section>

                <!-- Tombol Catat Transaksi -->
                <button @click="bukaModalTambah" class="btn-primary w-full rounded-2xl py-4">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Catat Transaksi Kas
                </button>

                <!-- Daftar Transaksi -->
                <section aria-labelledby="daftar-title">
                    <h2 id="daftar-title" class="section-title">Daftar Transaksi</h2>

                    <div v-if="entriesTerfilter.length === 0" class="empty-state">
                        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p class="text-sm font-bold text-ink">Belum ada transaksi kas</p>
                        <p class="mt-1 text-xs text-ink-muted">Transaksi penjualan, pengeluaran, dan catatan manual akan muncul di sini.</p>
                    </div>

                    <div v-else class="space-y-2">
                        <!-- Group by date -->
                        <template v-for="group in groupedEntries" :key="group.tanggal">
                            <p class="mt-3 text-[11px] font-bold uppercase tracking-widest text-ink-muted first:mt-0">
                                {{ formatTanggalPanjang(group.tanggal) }}
                            </p>

                            <div v-for="entry in group.items" :key="entry.id"
                                class="card flex items-center gap-3 p-3.5 sm:p-4"
                                :class="entry.tipe === 'masuk' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-danger'">
                                <!-- Ikon -->
                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                    :class="entry.tipe === 'masuk' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'">
                                    <svg v-if="entry.tipe === 'masuk'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                    </svg>
                                </div>

                                <!-- Info -->
                                <div class="min-w-0 flex-grow">
                                    <div class="flex items-center gap-2">
                                        <p class="truncate text-sm font-bold text-ink">{{ entry.keterangan }}</p>
                                        <span class="chip shrink-0">{{ SUMBER_LABELS[entry.sumber] || entry.sumber }}</span>
                                    </div>
                                    <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-ink-muted">
                                        <span>{{ AKTIVITAS_LABELS[entry.aktivitas] || entry.aktivitas }}</span>
                                        <span>·</span>
                                        <span>{{ formatJam(entry.tanggal) }}</span>
                                        <span v-if="entry.tipe === 'keluar'">·</span>
                                        <span v-if="entry.tipe === 'keluar' && entry.sumber === 'manual'">−</span>
                                    </div>
                                    <p v-if="totals.saldoAwalTersedia" class="mt-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                                        Saldo: Rp {{ fmt(entry.runningBalance) }}
                                    </p>
                                </div>

                                <!-- Nominal + Aksi -->
                                <div class="flex shrink-0 flex-col items-end gap-1">
                                    <p class="text-sm font-bold tabular-nums"
                                        :class="entry.tipe === 'masuk' ? 'text-success' : 'text-danger'">
                                        {{ entry.tipe === 'masuk' ? '+' : '−' }} Rp {{ fmt(entry.nominal) }}
                                    </p>
                                    <div v-if="entry.sumber === 'manual'" class="flex gap-1">
                                        <button @click="bukaModalEdit(entry)"
                                            class="rounded-lg px-2 py-1 text-[10px] font-bold text-ink-muted transition hover:bg-surface-muted hover:text-ink">
                                            Edit
                                        </button>
                                        <button @click="konfirmasiHapus(entry)"
                                            class="rounded-lg px-2 py-1 text-[10px] font-bold text-danger transition hover:bg-danger-soft">
                                            Hapus
                                        </button>
                                    </div>
                                    <RouterLink v-else-if="entry.sumber === 'pengeluaran'" to="/biaya"
                                        class="text-[10px] font-bold text-info transition hover:underline">
                                        Ke Input Biaya
                                    </RouterLink>
                                    <RouterLink v-else-if="entry.sumber === 'penjualan'" to="/history"
                                        class="text-[10px] font-bold text-info transition hover:underline">
                                        Ke Riwayat Jual
                                    </RouterLink>
                                </div>
                            </div>
                        </template>
                    </div>
                </section>

                <!-- Disclaimer -->
                <p class="text-center text-[10px] leading-relaxed text-ink-muted">
                    Catatan: penerimaan & pembayaran dari penjualan dan pengeluaran direkonstruksi berdasarkan pencatatan
                    dengan asumsi telah diselesaikan pada tanggal transaksi. Ini bukan saldo bank yang sudah diverifikasi.
                </p>

            </template>

            <RouterLink to="/" class="btn-secondary rounded-2xl">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Menu Utama
            </RouterLink>
        </div>

        <!-- ===== Modal: Transaksi Kas Manual ===== -->
        <div v-if="modalTransaksi" class="modal-overlay" @click.self="tutupModalTransaksi">
            <div class="modal-panel">
                <div class="border-b border-border px-5 py-4">
                    <h3 class="text-base font-bold text-ink">{{ modalMode === 'edit' ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas' }}</h3>
                    <p class="mt-0.5 text-[11px] font-medium text-ink-muted">Transaksi ini tercatat khusus di luar penjualan & pengeluaran otomatis.</p>
                </div>

                <form @submit.prevent="simpanTransaksi" class="flex-grow overflow-y-auto px-5 py-4">
                    <!-- Tipe -->
                    <div class="mb-4">
                        <label class="field-label">Jenis <span class="text-danger">*</span></label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" @click="form.tipe = 'masuk'; form.kategori = ''"
                                class="rounded-xl border-2 px-4 py-3 text-sm font-bold transition"
                                :class="form.tipe === 'masuk'
                                    ? 'border-success bg-success-soft text-success'
                                    : 'border-border bg-surface text-ink-muted'">
                                ↑ Kas Masuk
                            </button>
                            <button type="button" @click="form.tipe = 'keluar'; form.kategori = ''"
                                class="rounded-xl border-2 px-4 py-3 text-sm font-bold transition"
                                :class="form.tipe === 'keluar'
                                    ? 'border-danger bg-danger-soft text-danger'
                                    : 'border-border bg-surface text-ink-muted'">
                                ↓ Kas Keluar
                            </button>
                        </div>
                    </div>

                    <!-- Keterangan -->
                    <div class="mb-4">
                        <label class="field-label">Keterangan <span class="text-danger">*</span></label>
                        <input v-model="form.keterangan" type="text" required
                            placeholder="Contoh: Tambahan modal pemilik"
                            class="field" />
                    </div>

                    <!-- Aktivitas -->
                    <div class="mb-4">
                        <label class="field-label">Aktivitas <span class="text-danger">*</span></label>
                        <select v-model="form.aktivitas" class="field appearance-none" @change="form.kategori = ''">
                            <option value="operasi">Operasi</option>
                            <option value="investasi">Investasi</option>
                            <option value="pendanaan">Pendanaan</option>
                        </select>
                    </div>

                    <!-- Kategori -->
                    <div class="mb-4">
                        <label class="field-label">Kategori <span class="text-danger">*</span></label>
                        <select v-model="form.kategori" required class="field appearance-none">
                            <option value="" disabled>Pilih kategori...</option>
                            <option v-for="k in kategoriTersedia" :key="k.value" :value="k.value">{{ k.label }}</option>
                        </select>
                    </div>

                    <!-- Nominal -->
                    <div class="mb-4">
                        <label class="field-label">Nominal (Rp) <span class="text-danger">*</span></label>
                        <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="form.nominal" type="number" min="1" required placeholder="0"
                                class="field pl-12 tabular-nums" />
                        </div>
                    </div>

                    <!-- Tanggal -->
                    <div class="mb-4">
                        <label class="field-label">Tanggal <span class="text-danger">*</span></label>
                        <input v-model="form.tanggal" type="date" required class="field appearance-none" />
                    </div>

                    <!-- Metode Pembayaran -->
                    <div class="mb-4">
                        <label class="field-label">Metode Pembayaran (opsional)</label>
                        <select v-model="form.metodePembayaran" class="field appearance-none">
                            <option value="">— Pilih —</option>
                            <option value="tunai">Tunai</option>
                            <option value="transfer">Transfer</option>
                            <option value="qris">QRIS</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>

                    <!-- Catatan -->
                    <div class="mb-2">
                        <label class="field-label">Catatan Tambahan (opsional)</label>
                        <textarea v-model="form.catatan" rows="2" placeholder="Catatan tambahan..."
                            class="field resize-none"></textarea>
                    </div>
                </form>

                <div class="flex gap-3 border-t border-border px-5 py-4">
                    <button @click="tutupModalTransaksi" class="btn-secondary flex-1 rounded-xl">Batal</button>
                    <button @click="simpanTransaksi" class="btn-primary flex-1 rounded-xl">
                        {{ modalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ===== Modal: Saldo Awal ===== -->
        <div v-if="modalSaldoAwal" class="modal-overlay" @click.self="modalSaldoAwal = false">
            <div class="modal-panel">
                <div class="border-b border-border px-5 py-4">
                    <h3 class="text-base font-bold text-ink">{{ saldoAwalConfig ? 'Ubah Saldo Awal Kas' : 'Atur Saldo Awal Kas' }}</h3>
                    <p class="mt-0.5 text-[11px] font-medium text-ink-muted">Saldo awal adalah jumlah uang kas yang dimiliki toko sebelum mulai mencatat.</p>
                </div>
                <form @submit.prevent="simpanSaldoAwalForm" class="flex-grow overflow-y-auto px-5 py-4">
                    <div class="mb-4">
                        <label class="field-label">Saldo Awal (Rp) <span class="text-danger">*</span></label>
                        <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="formSaldoAwal.saldoAwal" type="number" min="0" required placeholder="0"
                                class="field pl-12 tabular-nums" />
                        </div>
                    </div>
                    <div class="mb-2">
                        <label class="field-label">Berlaku Sejak <span class="text-danger">*</span></label>
                        <input v-model="formSaldoAwal.berlakuSejak" type="date" required class="field appearance-none" />
                    </div>
                    <p class="text-[10px] font-medium text-ink-muted">
                        Perubahan saldo awal akan memengaruhi perhitungan saldo berjalan dan estimasi saldo akhir.
                    </p>
                </form>
                <div class="flex gap-3 border-t border-border px-5 py-4">
                    <button @click="modalSaldoAwal = false" class="btn-secondary flex-1 rounded-xl">Batal</button>
                    <button @click="simpanSaldoAwalForm" class="btn-primary flex-1 rounded-xl">Simpan</button>
                </div>
            </div>
        </div>

        <!-- ===== Modal: Konfirmasi Hapus ===== -->
        <div v-if="modalHapus" class="modal-overlay" @click.self="modalHapus = false">
            <div class="modal-panel max-w-sm">
                <div class="px-5 py-6 text-center">
                    <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
                        <svg class="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 class="text-base font-bold text-ink">Hapus Transaksi Kas?</h3>
                    <p class="mt-1.5 text-sm font-medium text-ink-muted">
                        "{{ entryHapus?.keterangan }}" sebesar Rp {{ fmt(entryHapus?.nominal || 0) }} akan dihapus permanen.
                    </p>
                </div>
                <div class="flex gap-3 border-t border-border px-5 py-4">
                    <button @click="modalHapus = false" class="btn-secondary flex-1 rounded-xl">Batal</button>
                    <button @click="hapusTransaksi" class="flex-1 rounded-xl bg-danger px-5 py-3.5 text-sm font-bold text-white transition hover:bg-danger/90">
                        Hapus
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import dayjs from 'dayjs';
import { useToast } from '../composables/useToast';
import {
    getArusKasPeriode, getSaldoAwalKas, simpanSaldoAwalKas,
    tambahKasManual, updateKasManual, hapusKasManual,
    KATEGORI_KAS_MANUAL, AKTIVITAS_LABELS, SUMBER_LABELS,
    filterCashFlowEntries
} from '../services/cashFlowService';

const { showToast } = useToast();
const isLoading = ref(true);

/* Data */
const allEntries = ref([]);
const totals = ref({ kasMasuk: 0, kasKeluar: 0, arusKasBersih: 0, saldoAwal: 0, saldoAkhir: null, saldoAwalTersedia: false });
const saldoAwalConfig = ref(null);

/* Filter */
const filterPeriode = ref('bulan');
const filterTipe = ref('semua');
const filterAktivitas = ref('semua');
const searchQuery = ref('');
const customStart = ref(dayjs().startOf('month').format('YYYY-MM-DD'));
const customEnd = ref(dayjs().format('YYYY-MM-DD'));

const periodeFilters = [
    { value: 'hari', label: 'Hari Ini' },
    { value: '7hari', label: '7 Hari Terakhir' },
    { value: 'bulan', label: 'Bulan Ini' },
    { value: 'bulanLalu', label: 'Bulan Sebelumnya' },
    { value: 'semua', label: 'Seluruh Waktu' },
    { value: 'custom', label: 'Khusus' }
];

/* Modal transaksi */
const modalTransaksi = ref(false);
const modalMode = ref('tambah');
const form = ref(getFormKosong());

/* Modal saldo awal */
const modalSaldoAwal = ref(false);
const formSaldoAwal = ref({ saldoAwal: 0, berlakuSejak: dayjs().format('YYYY-MM-DD') });

/* Modal hapus */
const modalHapus = ref(false);
const entryHapus = ref(null);

function getFormKosong() {
    return {
        tipe: 'keluar',
        keterangan: '',
        aktivitas: 'operasi',
        kategori: '',
        nominal: '',
        tanggal: dayjs().format('YYYY-MM-DD'),
        metodePembayaran: '',
        catatan: ''
    };
}

/* Derived */
const kategoriTersedia = computed(() => {
    const tipe = form.value.tipe === 'masuk' ? 'masuk' : 'keluar';
    const aktivitas = form.value.aktivitas || 'operasi';
    return KATEGORI_KAS_MANUAL[tipe]?.[aktivitas] || [];
});

const entriesTerfilter = computed(() =>
    filterCashFlowEntries(allEntries.value, {
        tipe: filterTipe.value,
        aktivitas: filterAktivitas.value,
        search: searchQuery.value
    })
);

const groupedEntries = computed(() => {
    const map = {};
    entriesTerfilter.value.forEach((e) => {
        const key = e.tanggal.slice(0, 10);
        if (!map[key]) map[key] = { tanggal: key, items: [] };
        map[key].items.push(e);
    });
    return Object.values(map).sort((a, b) => (a.tanggal > b.tanggal ? -1 : 1));
});

/* Helpers */
const fmt = (n) => Math.round(n || 0).toLocaleString('id-ID');
const formatTanggalPanjang = (d) => dayjs(d).format('dddd, D MMMM YYYY');
const formatTanggalPendek = (d) => dayjs(d).format('D MMMM YYYY');
const formatJam = (t) => dayjs(t).format('HH:mm');

/* Rentang periode */
function getRentang() {
    switch (filterPeriode.value) {
        case 'hari': {
            const s = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const e = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            return { start: s, end: e };
        }
        case '7hari': {
            const s = dayjs().subtract(6, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const e = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            return { start: s, end: e };
        }
        case 'bulan': {
            const s = dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss');
            const e = dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss');
            return { start: s, end: e };
        }
        case 'bulanLalu': {
            const s = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
            const e = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');
            return { start: s, end: e };
        }
        case 'custom': {
            if (!customStart.value || !customEnd.value) return { start: null, end: null };
            const s = dayjs(customStart.value).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            const e = dayjs(customEnd.value).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            return { start: s, end: e };
        }
        default:
            return { start: null, end: null };
    }
}

function pilihPeriode(value) {
    filterPeriode.value = value;
    muatData();
}

/* Load */
const muatData = async () => {
    isLoading.value = true;
    try {
        const { start, end } = getRentang();
        const hasil = await getArusKasPeriode(start, end);
        allEntries.value = hasil.entries;
        totals.value = hasil.totals;
        saldoAwalConfig.value = hasil.saldoAwalConfig || await getSaldoAwalKas();
    } catch (e) {
        console.error('Gagal memuat arus kas:', e);
        showToast('Gagal memuat data arus kas.', 'error');
    } finally {
        isLoading.value = false;
    }
};

/* Modal transaksi */
function bukaModalTambah() {
    modalMode.value = 'tambah';
    form.value = getFormKosong();
    modalTransaksi.value = true;
}

function bukaModalEdit(entry) {
    modalMode.value = 'edit';
    const manualId = String(entry.id).replace('manual-', '');
    form.value = {
        id: Number(manualId),
        tipe: entry.tipe,
        keterangan: entry.keterangan,
        aktivitas: entry.aktivitas,
        kategori: entry.kategori,
        nominal: entry.nominal,
        tanggal: entry.tanggal.slice(0, 10),
        metodePembayaran: entry.metodePembayaran || '',
        catatan: entry.deskripsi !== 'Catatan kas manual' ? entry.deskripsi : ''
    };
    modalTransaksi.value = true;
}

function tutupModalTransaksi() {
    modalTransaksi.value = false;
}

async function simpanTransaksi() {
    try {
        const payload = {
            ...form.value,
            nominal: Number(form.value.nominal),
            tanggal: dayjs(form.value.tanggal).format('YYYY-MM-DD') + ' ' + dayjs().format('HH:mm:ss')
        };
        if (modalMode.value === 'edit') {
            await updateKasManual(form.value.id, payload);
            showToast('Transaksi kas berhasil diperbarui.', 'success');
        } else {
            await tambahKasManual(payload);
            showToast('Transaksi kas berhasil dicatat.', 'success');
        }
        modalTransaksi.value = false;
        await muatData();
    } catch (e) {
        console.error('Gagal menyimpan transaksi kas:', e);
        showToast(e.message || 'Gagal menyimpan transaksi kas.', 'error');
    }
}

/* Modal saldo awal */
function bukaModalSaldoAwal() {
    if (saldoAwalConfig.value) {
        formSaldoAwal.value = {
            saldoAwal: saldoAwalConfig.value.saldoAwal,
            berlakuSejak: saldoAwalConfig.value.berlakuSejak
        };
    } else {
        formSaldoAwal.value = { saldoAwal: 0, berlakuSejak: dayjs().format('YYYY-MM-DD') };
    }
    modalSaldoAwal.value = true;
}

async function simpanSaldoAwalForm() {
    try {
        await simpanSaldoAwalKas({
            saldoAwal: Number(formSaldoAwal.value.saldoAwal),
            berlakuSejak: formSaldoAwal.value.berlakuSejak
        });
        showToast('Saldo awal kas berhasil disimpan.', 'success');
        modalSaldoAwal.value = false;
        await muatData();
    } catch (e) {
        console.error('Gagal menyimpan saldo awal:', e);
        showToast('Gagal menyimpan saldo awal kas.', 'error');
    }
}

/* Hapus */
function konfirmasiHapus(entry) {
    entryHapus.value = entry;
    modalHapus.value = true;
}

async function hapusTransaksi() {
    try {
        const manualId = String(entryHapus.value.id).replace('manual-', '');
        await hapusKasManual(Number(manualId));
        showToast('Transaksi kas berhasil dihapus.', 'success');
        modalHapus.value = false;
        await muatData();
    } catch (e) {
        console.error('Gagal menghapus transaksi kas:', e);
        showToast('Gagal menghapus transaksi kas.', 'error');
    }
}

onMounted(() => { muatData(); });
</script>
