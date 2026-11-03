<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Input Biaya</h1>
            <p class="page-subtitle">
                Pencatatan Pengeluaran Operasional
            </p>
        </header>

        <!-- Bagian Form -->
        <div class="page-body">

            <form @submit.prevent="simpanBiaya" class="card flex flex-col gap-5 p-5 sm:p-6">

                <!-- Kategori Pengeluaran -->
                <div>
                    <label class="field-label pl-1">
                        Kategori Pengeluaran <span class="text-danger">*</span>
                    </label>
                    <div class="relative">
                        <select v-model="form.jenis" required class="field appearance-none pr-10">
                            <option value="" disabled selected>Pilih Kategori...</option>
                            <option value="pemasaran">Biaya Pemasaran</option>
                            <option value="listrik_air_internet">Biaya Listrik, Air, dan Internet</option>
                            <option value="perlengkapan">Biaya Perlengkapan</option>
                            <option value="admin">Biaya Admin</option>
                            <option value="pajak">Biaya Pajak</option>
                            <option value="sewa">Biaya Sewa</option>
                            <option value="lain_lain">Biaya Lain-lain</option>
                        </select>
                        <div class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-muted">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Nominal (Rp) -->
                <div>
                    <label class="field-label pl-1">
                        Nominal <span class="text-danger">*</span>
                    </label>
                    <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                            <span class="text-sm font-bold text-ink-muted">Rp</span>
                        </div>
                        <input v-model="form.nominal" type="number" min="0" placeholder="0" required
                            class="field pl-12 tabular-nums">
                    </div>
                </div>

                <!-- Periode Bulan & Tahun -->
                <div>
                    <label class="field-label pl-1">
                        Periode (Bulan & Tahun) <span class="text-danger">*</span>
                    </label>
                    <input v-model="form.bulanTahun" type="month" required class="field appearance-none">
                </div>

                <!-- Keterangan Tambahan -->
                <div>
                    <label class="field-label pl-1">Keterangan Tambahan</label>
                    <textarea v-model="form.keterangan" rows="3" placeholder="Contoh: Pembelian alat tulis..."
                        class="field resize-none"></textarea>
                </div>

                <!-- Tombol Submit -->
                <button type="submit" class="btn-primary mt-1 w-full rounded-2xl py-4">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Simpan Data Pengeluaran
                </button>
            </form>

            <!-- Card Rincian Eksisting -->
            <div v-if="form.jenis" class="card flex flex-col gap-4 p-5 sm:p-6">
                <div class="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div class="min-w-0">
                        <h3 class="truncate text-sm font-bold text-ink">
                            Daftar Rincian {{ labelJenis(form.jenis) }}
                        </h3>
                        <p class="mt-0.5 text-[11px] font-medium text-ink-muted">
                            Periode: {{ formatBulan(form.bulanTahun) }}
                        </p>
                    </div>
                    <div class="shrink-0 rounded-full bg-primary-soft px-3 py-1">
                        <span class="text-[11px] font-bold text-primary-hover tabular-nums">
                            Total: Rp {{ totalNominalKategori.toLocaleString('id-ID') }}
                        </span>
                    </div>
                </div>

                <!-- Jika rincian ada -->
                <div v-if="daftarRincian.length > 0" class="flex max-h-72 flex-col gap-2.5 overflow-y-auto pr-1">
                    <div v-for="item in daftarRincian" :key="item.id"
                        class="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">

                        <!-- Mode Lihat -->
                        <div v-if="editItemId !== item.id" class="min-w-0 flex-grow">
                            <p class="truncate text-xs font-bold text-ink">{{ item.text }}</p>
                            <p class="mt-0.5 text-[11px] font-bold text-primary-hover tabular-nums">
                                Rp {{ (Number(item.nominal) || 0).toLocaleString('id-ID') }}
                            </p>
                        </div>

                        <!-- Mode Edit Inline -->
                        <div v-else class="flex flex-grow flex-col gap-2 sm:flex-row">
                            <input v-model="editForm.text" type="text" placeholder="Keterangan"
                                class="field px-3 py-1.5 text-xs" />
                            <input v-model="editForm.nominal" type="number" min="0" placeholder="Nominal"
                                class="field px-3 py-1.5 text-xs tabular-nums sm:w-32" />
                        </div>

                        <!-- Tombol Aksi -->
                        <div class="flex shrink-0 items-center gap-1.5">
                            <!-- Simpan Edit -->
                            <button v-if="editItemId === item.id" @click="simpanEdit(item.id)" type="button"
                                class="rounded-lg bg-success p-2 text-white shadow-sm transition-all hover:opacity-90"
                                title="Simpan Perubahan">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <!-- Batal Edit -->
                            <button v-if="editItemId === item.id" @click="batalEdit" type="button"
                                class="rounded-lg bg-surface-muted p-2 text-ink-secondary shadow-sm transition-all hover:bg-surface-sunken"
                                title="Batal">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <!-- Edit -->
                            <button v-if="editItemId !== item.id" @click="mulaiEdit(item)" type="button"
                                class="rounded-lg bg-warning-soft p-2 text-warning shadow-sm transition-all hover:bg-warning/20"
                                title="Edit Rincian">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <!-- Hapus -->
                            <button v-if="editItemId !== item.id" @click="hapusItem(item.id)" type="button"
                                class="rounded-lg bg-danger p-2 text-white shadow-sm transition-all hover:opacity-90"
                                title="Hapus Rincian">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Jika belum ada rincian -->
                <div v-else class="rounded-xl border border-dashed border-border-strong bg-background py-6 text-center">
                    <p class="text-xs font-bold text-ink-secondary">Belum ada rincian biaya</p>
                    <p class="mt-0.5 text-[11px] text-ink-muted">
                        Input biaya di atas untuk menambahkan rincian pertama pada periode ini.
                    </p>
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
import { ref, watch } from 'vue';
import { db, tambahRincianBiaya, updateRincianBiaya, hapusRincianBiaya, getPengeluaranKategoriBulan } from '../database/db';
import dayjs from 'dayjs';
import { useToast } from '../composables/useToast';
import { EXPENSE_CATEGORY_LABELS } from '../constants/expenseCategories';

const { showToast } = useToast();

const form = ref({
    jenis: '',
    nominal: '',
    bulanTahun: dayjs().format('YYYY-MM'),
    keterangan: ''
});

const daftarRincian = ref([]);
const totalNominalKategori = ref(0);
const editItemId = ref(null);
const editForm = ref({ text: '', nominal: '' });

const labelJenis = (jenis) => EXPENSE_CATEGORY_LABELS[jenis] || jenis;

const formatBulan = (val) => {
    return dayjs(val).format('MMMM YYYY');
};

const muatRincianEksisting = async () => {
    if (!form.value.jenis || !form.value.bulanTahun) {
        daftarRincian.value = [];
        totalNominalKategori.value = 0;
        return;
    }
    try {
        const record = await getPengeluaranKategoriBulan(form.value.bulanTahun, form.value.jenis);
        daftarRincian.value = Array.isArray(record.keterangan) ? record.keterangan : [];
        totalNominalKategori.value = record.nominal || 0;
    } catch (e) {
        console.error('Gagal memuat rincian biaya:', e);
        daftarRincian.value = [];
        totalNominalKategori.value = 0;
    }
};

const simpanBiaya = async () => {
    try {
        await tambahRincianBiaya(
            form.value.bulanTahun,
            form.value.jenis,
            form.value.keterangan,
            form.value.nominal
        );
        showToast('Rincian biaya berhasil ditambahkan!', 'success');
        form.value.nominal = '';
        form.value.keterangan = '';
        await muatRincianEksisting();
    } catch (error) {
        console.error(error);
        showToast('Gagal menyimpan biaya', 'error');
    }
};

const mulaiEdit = (item) => {
    editItemId.value = item.id;
    editForm.value.text = item.text;
    editForm.value.nominal = item.nominal;
};

const batalEdit = () => {
    editItemId.value = null;
    editForm.value.text = '';
    editForm.value.nominal = '';
};

const simpanEdit = async (itemId) => {
    try {
        await updateRincianBiaya(
            form.value.bulanTahun,
            form.value.jenis,
            itemId,
            editForm.value.text,
            editForm.value.nominal
        );
        showToast('Rincian biaya diperbarui!', 'success');
        batalEdit();
        await muatRincianEksisting();
    } catch (error) {
        showToast('Gagal memperbarui rincian', 'error');
    }
};

const hapusItem = async (itemId) => {
    try {
        await hapusRincianBiaya(
            form.value.bulanTahun,
            form.value.jenis,
            itemId
        );
        showToast('Rincian biaya dihapus', 'success');
        await muatRincianEksisting();
    } catch (error) {
        showToast('Gagal menghapus rincian', 'error');
    }
};

watch(() => [form.value.jenis, form.value.bulanTahun], () => {
    muatRincianEksisting();
    batalEdit();
}, { immediate: true });
</script>