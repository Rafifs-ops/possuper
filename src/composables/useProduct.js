import { ref } from 'vue';
import { db } from '../database/db';
import { buildPembelianStokAwalEntry, buildPenambahanStokEntry } from '../services/cashFlowService';

const productList = ref([]);

export function useProducts() {

    const loadProducts = async () => {
        try {
            productList.value = await db.produk.orderBy('createdAt').reverse().toArray();
        } catch (error) {
            console.error('Gagal memuat data:', error);
            throw error;
        }
    };

    const getProduct = async (id) => {
        try {
            return await db.produk.get(id);
        } catch (error) {
            console.error('Gagal mencari produk:', error);
            throw error;
        }
    };

    const addProduct = async (product) => {
        try {
            await db.produk.put(product);
            await loadProducts();
        } catch (error) {
            console.error('Gagal menyimpan produk:', error);
            throw error;
        }
    };

    /**
     * Simpan produk BARU sekaligus catat pembelian stok awal sebagai kas keluar.
     *
     * - Hanya produk dengan ID/SKU yang belum ada yang mencatat kas keluar,
     *   sebesar quantity × HPP (lihat buildPembelianStokAwalEntry).
     * - Produk existing (update) tidak pernah menambah kas keluar baru.
     * - Produk & kas keluar ditulis dalam satu transaksi Dexie yang atomik:
     *   jika salah satu gagal, keduanya dibatalkan.
     *
     * @returns {Promise<Object|null>} record kas keluar yang dibuat, atau null
     */
    const addProductWithStokAwal = async (product) => {
        let cashEntry = null;
        try {
            await db.transaction('rw', db.produk, db.kasManual, async () => {
                // Pemeriksaan ulang di dalam transaksi: update produk existing
                // tidak boleh memicu kas keluar baru (mencegah double counting).
                const existing = await db.produk.get(product.id);
                await db.produk.put(product);

                if (existing) return;

                const entry = buildPembelianStokAwalEntry(product);
                if (entry) {
                    const id = await db.kasManual.add(entry);
                    cashEntry = { ...entry, id };
                }
            });
            await loadProducts();
            return cashEntry;
        } catch (error) {
            console.error('Gagal menyimpan produk & pembelian stok awal:', error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await db.produk.delete(id);
            await loadProducts();
        } catch (error) {
            console.error('Gagal menghapus produk:', error);
            throw error;
        }
    };

    const decreaseProductStock = async (id, qtySold) => {
        try {
            const product = await db.produk.get(id);
            if (product && product.quantity !== undefined) {
                const newQty = Math.max(0, product.quantity - qtySold);
                await db.produk.update(id, { quantity: newQty });
            }
        } catch (error) {
            console.error('Gagal mengupdate stok produk:', error);
            throw error;
        }
    };

    /**
     * Tambah stok produk lama sekaligus catat pembelian persediaan sebagai kas
     * keluar (jumlah tambahan × HPP produk saat ini).
     *
     * - Hanya penambahan > 0 yang dicatat; pengurangan/koreksi stok tetap
     *   memakai `ubahStokAman` dan tidak membuat kas keluar.
     * - Perubahan stok & kas keluar ditulis dalam satu transaksi Dexie atomik.
     * - Snapshot persediaan tetap diperbarui sekali oleh hook Dexie existing.
     *
     * @returns {Promise<Object|null>} record kas keluar yang dibuat, atau null
     */
    const tambahStokDenganKas = async (id, jumlah) => {
        let cashEntry = null;
        try {
            await db.transaction('rw', db.produk, db.kasManual, async () => {
                const product = await db.produk.get(id);
                if (!product) return;

                const tambahan = Number(jumlah) || 0;
                if (tambahan <= 0) return;

                const oldQty = Number(product.quantity) || 0;
                const newQty = Math.max(0, oldQty + tambahan);
                const actualIncrease = newQty - oldQty;
                if (actualIncrease <= 0) return;

                await db.produk.update(id, { quantity: newQty });

                const entry = buildPenambahanStokEntry(product, actualIncrease);
                if (entry) {
                    const kasId = await db.kasManual.add(entry);
                    cashEntry = { ...entry, id: kasId };
                }
            });
            await loadProducts();
            return cashEntry;
        } catch (error) {
            console.error('Gagal menambah stok & mencatat kas keluar:', error);
            throw error;
        }
    };

    const ubahStokAman = async (id, penambahan) => {
        try {
            const product = await db.produk.get(id);
            if (product) {
                const newQty = Math.max(0, (product.quantity || 0) + penambahan);
                await db.produk.update(id, { quantity: newQty });
                await loadProducts();
            }
        } catch (error) {
            console.error('Gagal mengupdate stok produk:', error);
            throw error;
        }
    };

    const updateProductDetails = async (id, updatedData) => {
        try {
            await db.produk.update(id, updatedData);
            await loadProducts();
        } catch (error) {
            console.error('Gagal mengupdate detail produk:', error);
            throw error;
        }
    };

    return { productList, loadProducts, getProduct, addProduct, addProductWithStokAwal, deleteProduct, decreaseProductStock, tambahStokDenganKas, ubahStokAman, updateProductDetails };
}
