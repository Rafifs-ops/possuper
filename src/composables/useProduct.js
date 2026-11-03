import { ref } from 'vue';
import { db } from '../database/db';

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

    return { productList, loadProducts, getProduct, addProduct, deleteProduct, decreaseProductStock, ubahStokAman, updateProductDetails };
}
