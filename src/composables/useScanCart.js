import { ref } from 'vue';
import { useProducts } from './useProduct';
import { useToast } from './useToast';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';

export function useScanCart() {
    const { getProduct } = useProducts();
    const { showToast } = useToast();

    const barangDitemukan = ref([]);
    const totalPenjualan = ref(0);
    const totalKeuntungan = ref(0);
    const totalHppKasir = ref(0); // Tambahan untuk melacak HPP transaksi

    const tambahProdukKeKeranjang = async (idProduk) => {
        if (!idProduk) return;
        const produk = await getProduct(idProduk);

        if (produk) {
            const existingItemIndex = barangDitemukan.value.findIndex(item => item.id === produk.id);

            // Cek jumlah barang yang sudah ada di keranjang
            const qtyDiKeranjang = existingItemIndex !== -1 ? barangDitemukan.value[existingItemIndex].quantity : 0;

            // VALIDASI STOK
            if (qtyDiKeranjang >= produk.quantity) {
                showToast(`Stok "${produk.nama}" tidak mencukupi! Sisa stok sistem: ${produk.quantity}`, 'warning');
                return; // Hentikan proses jika stok habis
            }

            if (existingItemIndex !== -1) {
                barangDitemukan.value[existingItemIndex].quantity += 1;
            } else {
                produk.quantity = 1; // inject quantity dari database menjadi quantity nota penjualan
                barangDitemukan.value.push(produk);
            }

            const modalHpp = Number(produk.hpp) || 0;
            totalPenjualan.value += Number(produk.harga);
            totalKeuntungan.value += (Number(produk.harga) - modalHpp);
            totalHppKasir.value += modalHpp;
        } else {
            showToast(`Produk dengan ID "${idProduk}" tidak ditemukan.`, 'warning');
        }
    };

    const mulaiScan = async () => {
        try {
            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: 17, cameraDirection: 1, scanOrientation: 1, android: { scanningLibrary: 'mlkit' }
            });

            if (result && result.ScanResult) {
                const scannedId = result.ScanResult;
                await tambahProdukKeKeranjang(scannedId);
            }
        } catch (error) {
            console.error('Scan dibatalkan:', error);
        }
    };

    const resetTotal = () => {
        totalPenjualan.value = 0;
        totalKeuntungan.value = 0;
        totalHppKasir.value = 0;
        barangDitemukan.value = [];
    };

    const tambahQty = async (idProduk) => {
        await tambahProdukKeKeranjang(idProduk);
    };

    const kurangQty = (idProduk) => {
        const index = barangDitemukan.value.findIndex(item => item.id === idProduk);
        if (index === -1) return;

        const item = barangDitemukan.value[index];
        const modalHpp = Number(item.hpp) || 0;

        if (item.quantity > 1) {
            item.quantity -= 1;
            totalPenjualan.value -= Number(item.harga);
            totalKeuntungan.value -= (Number(item.harga) - modalHpp);
            totalHppKasir.value -= modalHpp;
        } else {
            hapusItem(idProduk);
        }
    };

    const hapusItem = (idProduk) => {
        const index = barangDitemukan.value.findIndex(item => item.id === idProduk);
        if (index === -1) return;
        const item = barangDitemukan.value[index];
        const modalHpp = Number(item.hpp) || 0;

        // Kurangi kalkulasi total
        totalPenjualan.value -= (item.harga * item.quantity);
        totalKeuntungan.value -= ((item.harga - modalHpp) * item.quantity);
        totalHppKasir.value -= (modalHpp * item.quantity);

        // Hapus dari keranjang
        barangDitemukan.value.splice(index, 1);

        if (barangDitemukan.value.length === 0) {
            resetTotal();
        }
    };

    return {
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
    };
}
