<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Catat Produk</h1>
            <p class="page-subtitle">
                Registrasi Data Barang Baru
            </p>
        </header>

        <!-- Bagian Form -->
        <div class="page-body">

            <form @submit.prevent="simpanProduk" class="card flex flex-col gap-5 p-5 sm:p-6">

                <!-- ID Barcode / SKU -->
                <div>
                    <label class="field-label pl-1">
                        ID Barcode / SKU <span class="text-danger">*</span>
                    </label>
                    <div class="flex gap-2">
                        <input v-model="form.id" type="text" required placeholder="Ketik atau scan ID..."
                            class="field flex-1 font-mono" />

                        <button type="button" @click="scanIdSaja" title="Scan Barcode"
                            class="btn-primary shrink-0 rounded-xl px-4 py-2">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Nama Barang -->
                <div>
                    <label class="field-label pl-1">
                        Nama Barang <span class="text-danger">*</span>
                    </label>
                    <input v-model="form.nama" type="text" required placeholder="Contoh: Kopi Sachet Spesial"
                        class="field" />
                </div>

                <!-- Harga Jual -->
                <div>
                    <label class="field-label pl-1">
                        Harga Jual <span class="text-danger">*</span>
                    </label>
                    <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                            <span class="text-sm font-bold text-ink-muted">Rp</span>
                        </div>
                        <input v-model="form.harga" type="number" min="0" required placeholder="0"
                            class="field pl-12 tabular-nums" />
                    </div>
                </div>

                <!-- Harga Pokok Penjualan (HPP) -->
                <div>
                    <label class="field-label pl-1">
                        Harga Pokok (HPP) <span class="text-danger">*</span>
                    </label>
                    <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                            <span class="text-sm font-bold text-ink-muted">Rp</span>
                        </div>
                        <input v-model="form.hpp" type="number" min="0" required placeholder="0"
                            class="field pl-12 tabular-nums" />
                    </div>
                </div>

                <!-- Quantity (Stok) -->
                <div>
                    <label class="field-label pl-1">
                        Quantity (Stok) <span class="text-danger">*</span>
                    </label>
                    <div class="relative w-full sm:w-1/2">
                        <input v-model="form.quantity" type="number" min="0" required placeholder="0"
                            class="field pr-16 tabular-nums" />
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-xl border-l border-border bg-surface-muted px-3 pr-4">
                            <span class="text-[11px] font-bold uppercase tracking-wide text-ink-secondary">Pcs</span>
                        </div>
                    </div>
                </div>

                <!-- Info: nilai stok awal otomatis masuk arus kas -->
                <div class="rounded-xl border border-primary/25 bg-primary-tint p-3.5">
                    <p class="text-[11px] font-medium leading-relaxed text-ink-secondary">
                        Nilai stok awal (jumlah barang × HPP) akan otomatis dicatat sebagai kas keluar pada
                        laporan arus kas.
                    </p>
                    <p v-if="totalStokAwal > 0" class="mt-2 text-xs font-bold tabular-nums text-primary-hover">
                        Total kas keluar: Rp {{ fmtRp(totalStokAwal) }}
                    </p>
                </div>

                <!-- Tombol Submit -->
                <button type="submit" class="btn-primary mt-1 w-full rounded-2xl py-4">
                    Simpan Data Produk
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </form>

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
import { reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { useProducts } from '../composables/useProduct';
import { useToast } from '../composables/useToast';

const route = useRoute();
const { addProductWithStokAwal, getProduct } = useProducts();
const { showToast } = useToast();

const form = reactive({
    id: '',
    nama: '',
    hpp: '',
    harga: '',
    quantity: ''
});

// Nilai stok awal yang akan dicatat otomatis sebagai kas keluar (quantity × HPP).
const totalStokAwal = computed(() => {
    const qty = Number(form.quantity) || 0;
    const hpp = Number(form.hpp) || 0;
    if (qty <= 0 || hpp <= 0) return 0;
    return Math.round(qty * hpp);
});

const fmtRp = (n) => Math.round(n || 0).toLocaleString('id-ID');

// Menangkap ID jika user dialihkan dari halaman "Cek Produk" (ScanView.vue)
onMounted(() => {
    if (route.query.newId) {
        form.id = route.query.newId;
    }
});

// Fungsi untuk melakukan scan khusus mengisi kolom ID di form ini
const scanIdSaja = async () => {
    try {
        const result = await CapacitorBarcodeScanner.scanBarcode({
            hint: 17,
            cameraDirection: 1,
            scanOrientation: 1,
            android: { scanningLibrary: 'mlkit' }
        });

        if (result && result.ScanResult) {
            // Langsung masukkan hasil scan ke input ID
            form.id = result.ScanResult;
        }
    } catch (error) {
        console.error('Proses scan dibatalkan atau error:', error);
    }
};

// Fungsi menyimpan data
const simpanProduk = async () => {
    if (!form.id) {
        showToast('ID Barcode tidak boleh kosong!', 'warning');
        return;
    }

    try {
        const produkSudahAda = await getProduct(form.id);
        if (produkSudahAda) {
            showToast(`Peringatan! Barcode ID ${form.id} sudah terdaftar atas nama "${produkSudahAda.nama}". Jika ingin menambah stok, silakan gunakan menu Daftar Inventaris.`, 'warning');
            return; // Hentikan eksekusi
        }

        // Produk baru disimpan bersama kas keluar pembelian stok awal (atomik).
        const kasKeluar = await addProductWithStokAwal({
            id: form.id,
            nama: form.nama,
            hpp: Number(form.hpp),
            harga: Number(form.harga),
            quantity: Number(form.quantity),
            createdAt: Date.now()
        });
        showToast(
            kasKeluar
                ? `Barang ${form.nama} berhasil disimpan! Kas keluar Rp ${fmtRp(kasKeluar.nominal)} tercatat di Riwayat Kas.`
                : `Barang ${form.nama} berhasil disimpan!`,
            'success'
        );
    } catch (error) {
        console.error('Gagal menyimpan produk:', error);
        showToast('Gagal menyimpan produk!', 'error');
        return;
    } finally {
        form.id = '';
        form.nama = '';
        form.hpp = '';
        form.harga = '';
        form.quantity = '';
    };
}
</script>