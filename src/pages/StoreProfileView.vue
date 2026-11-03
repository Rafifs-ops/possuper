<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Identitas Toko</h1>
            <p class="page-subtitle">
                Pengaturan Profil & Informasi Usaha
            </p>
        </header>

        <!-- Bagian Konten Utama -->
        <div class="page-body">

            <!-- Banner Status Identitas -->
            <div v-if="isStoreProfileComplete"
                class="flex items-center gap-3.5 rounded-2xl border border-success/25 bg-success-soft p-4 shadow-sm">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div class="flex-1">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-ink">Identitas Toko Aktif</h2>
                    <p class="mt-0.5 text-[11px] font-medium leading-snug text-ink-secondary">
                        Profil toko telah terisi lengkap. Anda siap melakukan transaksi kasir dan mencetak nota.
                    </p>
                </div>
            </div>

            <div v-else class="flex items-center gap-3.5 rounded-2xl border border-warning/25 bg-warning-soft p-4 shadow-sm">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-ink">Perhatian: Wajib Diisi</h2>
                    <p class="mt-0.5 text-[11px] font-medium leading-snug text-ink-secondary">
                        Harap lengkapi Nama Toko dan Alamat Toko agar fitur Kasir dapat digunakan.
                    </p>
                </div>
            </div>

            <!-- Form Identitas Toko -->
            <form @submit.prevent="simpanProfil" class="card flex flex-col gap-5 p-5 sm:p-6">

                <div class="flex items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                        <h2 class="text-sm font-bold tracking-tight text-ink">Formulir Toko</h2>
                        <p class="text-[11px] font-medium text-ink-muted">Digunakan untuk nota transaksi dan laporan</p>
                    </div>
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-hover">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>

                <!-- Input Nama Toko -->
                <div>
                    <label class="field-label flex items-center gap-1.5 pl-1">
                        <svg class="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Nama Toko <span class="font-bold text-danger">*</span>
                    </label>
                    <input v-model="form.namaToko" type="text" required placeholder="Contoh: Toko Berkah Mandiri"
                        class="field" />
                </div>

                <!-- Input Alamat Toko -->
                <div>
                    <label class="field-label flex items-center gap-1.5 pl-1">
                        <svg class="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Alamat Toko <span class="font-bold text-danger">*</span>
                    </label>
                    <textarea v-model="form.alamatToko" required rows="3"
                        placeholder="Contoh: Jl. Merdeka No. 123, Bandung, Jawa Barat"
                        class="field resize-none"></textarea>
                </div>

                <!-- Input No HP / WhatsApp (Opsional) -->
                <div>
                    <label class="field-label flex items-center gap-1.5 pl-1">
                        <svg class="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        No. HP / WhatsApp <span class="font-normal lowercase text-ink-muted">(opsional)</span>
                    </label>
                    <input v-model="form.noHp" type="tel" placeholder="Contoh: 081234567890" class="field" />
                </div>

                <!-- Tombol Simpan -->
                <button type="submit" class="btn-primary mt-1 w-full rounded-2xl py-4">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Simpan Identitas Toko
                </button>
            </form>

            <!-- Pratinjau Tampilan Pada Nota -->
            <div class="card flex flex-col gap-3 p-5 sm:p-6">
                <div class="flex items-center justify-between gap-3 border-b border-border pb-2.5">
                    <h2 class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-secondary">
                        <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Pratinjau Kertas Nota
                    </h2>
                    <span class="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-hover">
                        Live Preview
                    </span>
                </div>

                <div class="flex flex-col items-center rounded-xl border border-border bg-background p-4 text-center">
                    <h3 class="text-base font-bold tracking-tight text-ink">
                        {{ form.namaToko || 'Nama Toko Anda' }}
                    </h3>
                    <p class="mt-1 max-w-sm text-xs font-medium leading-snug text-ink-secondary">
                        {{ form.alamatToko || 'Alamat Toko Anda akan tertera di sini' }}
                    </p>
                    <p v-if="form.noHp" class="mt-1 text-[11px] font-semibold text-ink-secondary">
                        Telp/WA: {{ form.noHp }}
                    </p>
                    <div class="my-2 w-full border-b border-dashed border-border"></div>
                    <span class="font-mono text-[10px] font-semibold text-ink-muted">INVOICE #0001 • 2026-09-30</span>
                </div>
            </div>

            <!-- Tombol Buka Kasir -->
            <button v-if="isStoreProfileComplete" @click="router.push('/scan')"
                class="btn-primary rounded-2xl py-4">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Menuju Halaman Kasir
            </button>

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
import { reactive, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useStoreProfile } from '../composables/useStoreProfile';
import { useToast } from '../composables/useToast';

const router = useRouter();
const { storeProfile, isStoreProfileComplete, saveProfile, loadStoreProfileFromDb } = useStoreProfile();
const { showToast } = useToast();

const form = reactive({
    namaToko: storeProfile.value.namaToko || '',
    alamatToko: storeProfile.value.alamatToko || '',
    noHp: storeProfile.value.noHp || ''
});

// Sinkronkan form jika storeProfile berubah di tempat lain
watch(storeProfile, (newVal) => {
    form.namaToko = newVal.namaToko || '';
    form.alamatToko = newVal.alamatToko || '';
    form.noHp = newVal.noHp || '';
}, { deep: true });

onMounted(async () => {
    const loaded = await loadStoreProfileFromDb();
    if (loaded) {
        form.namaToko = loaded.namaToko || '';
        form.alamatToko = loaded.alamatToko || '';
        form.noHp = loaded.noHp || '';
    }
});

const simpanProfil = async () => {
    if (!form.namaToko.trim() || !form.alamatToko.trim()) {
        showToast('Nama toko dan alamat toko wajib diisi!', 'warning');
        return;
    }

    try {
        await saveProfile({
            namaToko: form.namaToko,
            alamatToko: form.alamatToko,
            noHp: form.noHp
        });
        showToast('Identitas toko berhasil disimpan di Aplikasi!', 'success');
    } catch (error) {
        console.error('Gagal menyimpan identitas toko:', error);
        showToast('Gagal menyimpan identitas toko ke Aplikasi!', 'error');
    }
};
</script>
