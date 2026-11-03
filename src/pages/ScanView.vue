<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Kasir & Transaksi</h1>
            <p class="page-subtitle">
                Pemindaian & Pencatatan Cepat
            </p>
        </header>

        <!-- Bagian Konten -->
        <div class="page-body">

            <!-- Ringkasan Transaksi -->
            <section class="card p-4 sm:p-5">
                <ScanSummary :total-penjualan="totalPenjualan" :total-keuntungan="totalKeuntungan" />
            </section>

            <!-- Input Produk -->
            <section class="card p-4 sm:p-5">
                <ScanInput @scan="mulaiScan" @tambah-manual="tambahProdukKeKeranjang"
                    @buka-pencarian="isSearchModalOpen = true" />
            </section>

            <!-- Daftar Belanja (Keranjang) -->
            <section v-if="barangDitemukan?.length > 0" class="card flex flex-col gap-4 p-4 sm:p-5">

                <!-- Header Keranjang -->
                <div class="flex items-center justify-between gap-3 border-b border-border pb-3">
                    <h2 class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-secondary">
                        <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Daftar Belanja
                    </h2>
                    <span class="chip">
                        {{ barangDitemukan.length }} Item
                    </span>
                </div>

                <!-- List Produk -->
                <div class="space-y-3">
                    <CartItem v-for="produk in barangDitemukan.slice().reverse()" :key="produk.id" :produk="produk"
                        @tambah="tambahQty(produk.id)" @kurang="kurangQty(produk.id)" @hapus="hapusItem(produk.id)" />
                </div>

                <!-- Tombol Proses Penjualan -->
                <button @click="prosesPenjualan" :disabled="isProcessing" class="btn-primary w-full rounded-2xl py-4">
                    <span>{{ isProcessing ? 'Memproses Transaksi...' : 'Selesai Transaksi' }}</span>

                    <svg v-if="!isProcessing" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>

                    <svg v-else class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                </button>
            </section>

            <!-- Tombol Kembali -->
            <RouterLink to="/" class="btn-secondary mt-1 rounded-2xl">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Menu Utama
            </RouterLink>

        </div>

        <!-- Komponen Modal -->
        <ProductSearchModal :is-open="isSearchModalOpen" @close="isSearchModalOpen = false"
            @select="onProductSelected" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useScanCart } from '../composables/useScanCart';
import { useStoreProfile } from '../composables/useStoreProfile';
import { db } from '../database/db';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { SignJWT } from 'jose';

import ProductSearchModal from '../components/ProductSearchModal.vue';
import ScanSummary from '../components/ScanSummary.vue';
import ScanInput from '../components/ScanInput.vue';
import CartItem from '../components/CartItem.vue';

const router = useRouter();
const { showToast } = useToast();
const { isStoreProfileComplete, loadStoreProfileFromDb } = useStoreProfile();
const isProcessing = ref(false);

const {
    barangDitemukan,
    totalPenjualan,
    totalKeuntungan,
    totalHppKasir,
    tambahProdukKeKeranjang,
    tambahQty,
    kurangQty,
    mulaiScan,
    resetTotal,
    hapusItem
} = useScanCart();

const isSearchModalOpen = ref(false);

const onProductSelected = async (id) => {
    isSearchModalOpen.value = false;
    await tambahProdukKeKeranjang(id);
};

const prosesPenjualan = async () => {
    if (barangDitemukan.value.length === 0 || isProcessing.value) return;
    isProcessing.value = true;
    const tanggal = dayjs().format('YYYY-MM-DD HH:mm:ss');

    try {
        const toko = await loadStoreProfileFromDb();
        const secret = new TextEncoder().encode('RAHASIA_NOTA_ANDA');
        const token = await new SignJWT({
            tanggal,
            totalPenjualan: totalPenjualan.value,
            totalHpp: totalHppKasir.value,
            items: JSON.parse(JSON.stringify(barangDitemukan.value)),
            namaToko: toko.namaToko,
            alamatToko: toko.alamatToko,
            noHp: toko.noHp
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .sign(secret);

        // Transaksi atomic: penjualan + pengurangan stok dalam satu transaksi Dexie.
        // Jika ada kegagalan di tengah, seluruh operasi rollback.
        const idTransaksi = await db.transaction('rw', db.penjualan, db.produk, async () => {
            const id = await db.penjualan.add({
                tanggal,
                totalPenjualan: totalPenjualan.value,
                totalHpp: totalHppKasir.value,
                items: JSON.parse(JSON.stringify(barangDitemukan.value)),
                tokenNota: token
            });

            for (const item of barangDitemukan.value) {
                const product = await db.produk.get(item.id);
                if (product && product.quantity !== undefined) {
                    const newQty = Math.max(0, product.quantity - item.quantity);
                    await db.produk.update(item.id, { quantity: newQty });
                }
            }

            return id;
        });

        resetTotal();
        router.push({ path: '/receipt', query: { id: idTransaksi } });
    } catch (error) {
        console.error('Gagal menyimpan penjualan:', error);
        showToast('Terjadi kesalahan saat memproses penjualan. Data tidak tersimpan.', 'error');
    } finally {
        isProcessing.value = false;
    }
};

onBeforeRouteLeave((to, from, next) => {
    if (barangDitemukan.value.length > 0) {
        const konfirmasi = window.confirm(
            'Ada transaksi kasir yang belum diselesaikan! Apakah Anda yakin ingin keluar? Semua daftar belanja di keranjang akan terhapus.'
        );
        if (konfirmasi) {
            next();
        } else {
            next(false);
        }
    } else {
        next();
    }
});
</script>