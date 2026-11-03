import { ref, computed } from 'vue';
import { db } from '../database/db';
import { useToast } from './useToast';
import { useProducts } from './useProduct';
import { applyStoreProfile } from './useStoreProfile';
import {
    BACKUP_TABLES,
    BackupValidationError,
    createBackupFile,
    restoreBackup,
    saveBackupJson,
    readBackupFile as parseBackupFile
} from '../utils/backupHandler';

const LAST_BACKUP_STORAGE_KEY = 'possuper_last_backup_at';

function readLastBackupAt() {
    try {
        const raw = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
        return raw && !Number.isNaN(Date.parse(raw)) ? raw : '';
    } catch (e) {
        return '';
    }
}

function writeLastBackupAt(value) {
    try {
        if (value) {
            localStorage.setItem(LAST_BACKUP_STORAGE_KEY, value);
        } else {
            localStorage.removeItem(LAST_BACKUP_STORAGE_KEY);
        }
    } catch (e) {
        console.warn('Gagal menyimpan waktu backup terakhir:', e);
    }
}

/**
 * State & aksi halaman Backup & Restore.
 * Semua pekerjaan berat ada di utils/backupHandler.js; composable ini mengatur
 * status loading, notifikasi, dan penyegaran state aplikasi setelah restore.
 */
export function useBackup() {
    const { showToast } = useToast();
    const { loadProducts } = useProducts();

    const isExporting = ref(false);
    const isReadingFile = ref(false);
    const isRestoring = ref(false);
    const stats = ref({ produk: 0, penjualan: 0, pengeluaran: 0, persediaan: 0, kasManual: 0 });
    const lastBackupAt = ref(readLastBackupAt());
    const pendingBackup = ref(null);
    // Pilihan tabel untuk restore selektif; default seluruh tabel.
    const selectedTables = ref([...BACKUP_TABLES]);

    const isBusy = computed(() => isExporting.value || isReadingFile.value || isRestoring.value);
    const hasLocalData = computed(() => Object.values(stats.value).some((count) => count > 0));
    const hasSelectedTables = computed(() => selectedTables.value.length > 0);

    const isTableSelected = (table) => selectedTables.value.includes(table);

    /**
     * Pilih/batal satu tabel. Snapshot persediaan selalu mengikuti produk
     * (lihat resolveRestoreTables) agar data hasil restore tetap konsisten.
     */
    const toggleTable = (table) => {
        if (!BACKUP_TABLES.includes(table)) return;

        const selected = new Set(selectedTables.value);
        if (selected.has(table)) {
            selected.delete(table);
            if (table === 'produk') selected.delete('persediaan');
            if (table === 'persediaan') selected.delete('produk');
        } else {
            selected.add(table);
            if (table === 'produk') selected.add('persediaan');
            if (table === 'persediaan') selected.add('produk');
        }
        selectedTables.value = BACKUP_TABLES.filter((item) => selected.has(item));
    };

    const loadStats = async () => {
        try {
            const [produk, penjualan, pengeluaran, persediaan, profilToko, kasManual, saldoAwalKas] = await Promise.all([
                db.produk.count(),
                db.penjualan.count(),
                db.pengeluaran.count(),
                db.persediaan.count(),
                db.profilToko.count(),
                db.kasManual.count(),
                db.saldoAwalKas.count()
            ]);
            stats.value = { produk, penjualan, pengeluaran, persediaan, profilToko, kasManual, saldoAwalKas };
        } catch (error) {
            console.error('Gagal menghitung data untuk backup:', error);
        }
        return stats.value;
    };

    const exportData = async () => {
        if (isBusy.value) return null;

        isExporting.value = true;
        try {
            const { json, filename } = await createBackupFile();
            const result = await saveBackupJson(json, filename);

            const exportedAt = new Date().toISOString();
            writeLastBackupAt(exportedAt);
            lastBackupAt.value = exportedAt;

            showToast('Yeay! Backup data berhasil dibuat.', 'success', 4000);
            return result;
        } catch (error) {
            console.error('Gagal membuat backup:', error);
            showToast('Gagal membuat file backup. Silakan coba lagi.', 'error', 4500);
            return null;
        } finally {
            isExporting.value = false;
        }
    };

    const selectBackupFile = async (file) => {
        if (isBusy.value) return null;

        isReadingFile.value = true;
        pendingBackup.value = null;
        try {
            const parsed = await parseBackupFile(file);
            // Pilihan reset ke seluruh tabel setiap kali file baru dipilih.
            selectedTables.value = [...BACKUP_TABLES];
            pendingBackup.value = {
                fileName: parsed.fileName,
                summary: parsed.summary,
                payload: parsed.payload
            };
            showToast('File backup valid. Periksa ringkasan lalu konfirmasi pemulihan.', 'info', 4000);
            return parsed.summary;
        } catch (error) {
            console.warn('File backup ditolak:', error);
            const message = error instanceof BackupValidationError
                ? error.message
                : 'File backup tidak valid atau mengalami kerusakan.';
            showToast(message, 'error', 6000);
            return null;
        } finally {
            isReadingFile.value = false;
        }
    };

    const cancelPendingBackup = () => {
        pendingBackup.value = null;
    };

    const restorePendingBackup = async () => {
        if (isBusy.value || !pendingBackup.value) return false;

        const pending = pendingBackup.value;
        if (selectedTables.value.length === 0) {
            showToast('Pilih minimal satu jenis data yang akan dipulihkan.', 'warning', 4000);
            return false;
        }

        isRestoring.value = true;
        try {
            await restoreBackup(pending.payload, selectedTables.value);

            // Sinkronkan profil toko ke state reaktif + cache localStorage legacy.
            // Hanya jika profilToko benar-benar dipulihkan dan datanya ada.
            if (selectedTables.value.includes('profilToko')) {
                const restoredProfile = pending.payload.data.profilToko?.[0];
                if (restoredProfile && (restoredProfile.namaToko || restoredProfile.alamatToko)) {
                    applyStoreProfile(restoredProfile);
                }
            }

            // Segarkan data produk yang dipakai halaman lain.
            await loadProducts();
            await loadStats();

            pendingBackup.value = null;
            showToast('Berhasil! Seluruh data toko sudah dipulihkan.', 'success', 4500);
            return true;
        } catch (error) {
            console.error('Gagal memulihkan backup:', error);
            showToast('Ups, data gagal dipulihkan. Data sebelumnya tetap aman.', 'error', 5000);
            return false;
        } finally {
            isRestoring.value = false;
        }
    };

    return {
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
    };
}
