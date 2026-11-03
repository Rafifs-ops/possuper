import { ref, computed } from 'vue';
import { getIdentitasToko, simpanIdentitasToko } from '../database/db';

const STORAGE_KEY = 'smartpos_store_profile';

const defaultProfile = {
    namaToko: '',
    alamatToko: '',
    noHp: ''
};

// Fungsi pembacaan murni dari localStorage untuk inisialisasi awal aman dari TDZ
function readProfileFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                namaToko: (parsed.namaToko || '').trim(),
                alamatToko: (parsed.alamatToko || '').trim(),
                noHp: (parsed.noHp || '').trim()
            };
        }
    } catch (e) {
        console.error('Gagal membaca profil toko dari cache:', e);
    }
    return { ...defaultProfile };
}

// State reaktif tunggal diinisialisasi dari cache lokal
const storeProfile = ref(readProfileFromLocalStorage());

// Fungsi pembacaan sinkron dari state reaktif atau fallback ke cache untuk export PDF & Excel
export function getStoredProfileSync() {
    if (storeProfile.value && (storeProfile.value.namaToko || storeProfile.value.alamatToko)) {
        return { ...storeProfile.value };
    }
    return readProfileFromLocalStorage();
}
let isInitialized = false;

// Fungsi untuk memuat data dari database Dexie.js
export async function loadStoreProfileFromDb() {
    try {
        const fromDexie = await getIdentitasToko();
        if (fromDexie && (fromDexie.namaToko || fromDexie.alamatToko)) {
            storeProfile.value = {
                namaToko: fromDexie.namaToko,
                alamatToko: fromDexie.alamatToko,
                noHp: fromDexie.noHp || ''
            };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(storeProfile.value));
            } catch (e) { }
        } else {
            // Migrasi otomatis: jika di Dexie belum ada tapi di cache localStorage ada
            const cache = getStoredProfileSync();
            if (cache.namaToko || cache.alamatToko) {
                await simpanIdentitasToko(cache);
            }
        }
    } catch (e) {
        console.error('Gagal memuat profil toko dari Dexie:', e);
    } finally {
        isInitialized = true;
    }
    return storeProfile.value;
}

// Jalankan pemuatan dari Dexie saat modul di-load
loadStoreProfileFromDb();

const isStoreProfileComplete = computed(() => {
    const nama = storeProfile.value.namaToko?.trim() || '';
    const alamat = storeProfile.value.alamatToko?.trim() || '';
    return nama.length > 0 && alamat.length > 0;
});

// Menuliskan profil hasil restore ke state reaktif + cache localStorage tanpa
// menyentuh tabel Dexie (restore sudah menulis profilToko di dalam transaksi).
export function applyStoreProfile(profile) {
    const next = {
        namaToko: (profile?.namaToko || '').trim(),
        alamatToko: (profile?.alamatToko || '').trim(),
        noHp: (profile?.noHp || '').trim()
    };

    storeProfile.value = next;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
        console.error('Gagal menyinkronkan cache profil toko:', e);
    }

    isInitialized = true;
    return next;
}

export function useStoreProfile() {
    const saveProfile = async (newProfile) => {
        const updated = {
            namaToko: (newProfile.namaToko || '').trim(),
            alamatToko: (newProfile.alamatToko || '').trim(),
            noHp: (newProfile.noHp || '').trim()
        };

        // 1. Simpan ke database Dexie.js secara persisten
        await simpanIdentitasToko(updated);

        // 2. Update state reaktif
        storeProfile.value = updated;

        // 3. Update cache sinkron
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Gagal mengupdate cache profil toko:', e);
        }

        return updated;
    };

    return {
        storeProfile,
        isStoreProfileComplete,
        saveProfile,
        loadStoreProfileFromDb
    };
}
