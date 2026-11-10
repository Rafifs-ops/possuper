<template>
    <div class="page-shell">

        <!-- Bagian Header (Curved Bottom & Decorative Blur) -->
        <header class="page-header rounded-b-[2.5rem] pt-10 pb-12">
            <!-- Container Logo -->
            <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-background p-2 shadow-lg shadow-black/10">
                <img :src="logoMark" alt="Logo POSSuper" class="h-full w-full object-contain" />
            </div>

            <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                POS<span class="text-primary-soft">Super</span>
            </h1>

            <p class="page-subtitle mt-4">
                Sistem Point of Sale Terpadu untuk UMKM
            </p>
        </header>

        <!-- Bagian Daftar Menu -->
        <div class="mx-auto w-full max-w-xl flex-grow px-5 pt-7 pb-12">
            <div class="grid grid-cols-2 gap-3">

                <!-- Menu Utama: Kasir -->
                <button v-for="menu in menuUtama" :key="menu.path" @click="navigasiKe(menu.path)"
                    class="group relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-left shadow-sm transition-all duration-300 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99]"
                    :class="menu.variant === 'primary' ? 'bg-primary-strong text-white hover:bg-primary-strong-hover' : 'bg-accent text-white hover:bg-accent-hover'">

                    <!-- Dekorasi -->
                    <div class="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125"></div>

                    <div class="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"
                        v-html="menu.icon"></div>

                    <div class="relative z-10 flex-grow">
                        <h3 class="text-base font-bold leading-tight tracking-tight">{{ menu.title }}</h3>
                        <p class="mt-1 text-xs font-medium text-white">{{ menu.desc }}</p>
                    </div>

                    <svg class="relative z-10 h-5 w-5 shrink-0 text-white/70 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <!-- Menu Pendukung -->
                <button v-for="menu in menuPendukung" :key="menu.path" @click="navigasiKe(menu.path)"
                    class="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99]">

                    <div class="icon-tile h-10 w-10 rounded-xl transition-colors duration-300 group-hover:bg-primary group-hover:text-white"
                        v-html="menu.icon"></div>

                    <div>
                        <h3 class="text-sm font-bold leading-tight text-ink">{{ menu.title }}</h3>
                        <p class="mt-1 text-[11px] font-medium leading-snug text-ink-muted">{{ menu.desc }}</p>
                    </div>
                </button>

            </div>

            <!-- Install PWA (hanya web, belum terinstall) -->
            <section v-if="canShowInstall" aria-labelledby="install-pwa-title"
                class="mt-4 rounded-2xl border border-primary/25 bg-primary-tint p-4 shadow-sm sm:p-5">
                <div class="flex items-start gap-3">
                    <img :src="logoMark" alt=""
                        class="h-11 w-11 shrink-0 rounded-xl bg-background object-contain p-1.5 shadow-sm" />
                    <div class="min-w-0 flex-grow">
                        <h3 id="install-pwa-title" class="text-sm font-bold leading-tight text-ink">Install POSSuper</h3>
                        <p class="mt-1 text-[11px] font-medium leading-relaxed text-ink-muted">
                            Akses POSSuper lebih praktis langsung dari layar perangkatmu. Install sebagai aplikasi dan
                            gunakan kembali tanpa harus membuka tab browser.
                        </p>

                        <button v-if="canPromptInstall" type="button" @click="installPwa" :disabled="isInstalling"
                            class="btn-primary mt-3 w-full rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                            </svg>
                            {{ isInstalling ? 'Memulai instalasi...' : 'Install' }}
                        </button>
                        <button v-else type="button" @click="toggleManualInstallHint"
                            class="btn-secondary mt-3 w-full rounded-xl py-2.5 text-sm">
                            {{ showManualInstallHint ? 'Tutup petunjuk' : 'Lihat cara install' }}
                        </button>

                        <p v-if="!canPromptInstall && showManualInstallHint"
                            class="mt-2.5 rounded-xl bg-background/70 p-3 text-[11px] font-medium leading-relaxed text-ink-secondary">
                            {{ installHint }}
                        </p>
                        <p v-if="installError" class="mt-2 text-[11px] font-semibold text-danger">{{ installError }}</p>
                    </div>
                </div>
            </section>

            <!-- Promosi aplikasi Android (hanya di web/PWA, bukan aplikasi native) -->
            <section v-if="showAndroidDownload" aria-labelledby="android-app-title"
                class="relative mt-4 overflow-hidden rounded-2xl bg-accent p-4 text-white shadow-sm sm:p-5">
                <div class="pointer-events-none absolute -right-10 -bottom-12 h-32 w-32 rounded-full bg-white/10"></div>
                <div class="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M17.6 9.48l1.84-3.18a.38.38 0 10-.66-.38l-1.86 3.22A11.4 11.4 0 0012 8.2c-1.79 0-3.48.36-4.92.94L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.9 10.9 0 001 18h22a10.9 10.9 0 00-5.4-8.52zM7 15.25a1.05 1.05 0 110-2.1 1.05 1.05 0 010 2.1zm10 0a1.05 1.05 0 110-2.1 1.05 1.05 0 010 2.1z" />
                        </svg>
                    </div>
                    <div class="min-w-0 flex-grow">
                        <h3 id="android-app-title" class="text-sm font-bold leading-tight">Sudah tersedia aplikasi Android POSSuper!</h3>
                        <p class="mt-1 text-[11px] font-medium leading-relaxed text-white/85">
                            Gunakan POSSuper lebih praktis melalui smartphone Android. Download aplikasi Android dan
                            nikmati kemudahan mengelola bisnis langsung dari perangkatmu.
                        </p>
                    </div>
                    <a :href="ANDROID_APK_URL" target="_blank" rel="noopener noreferrer"
                        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-background px-4 py-2.5 text-xs font-bold text-accent shadow-sm transition hover:bg-white active:scale-[0.99] sm:self-center">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Android APK
                    </a>
                </div>
            </section>

            <!-- Tentang aplikasi (tautan footer) -->
            <RouterLink to="/about"
                class="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99]">
                <div class="icon-tile h-10 w-10 rounded-xl">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div class="flex-grow">
                    <h3 class="text-sm font-bold leading-tight text-ink">Tentang Aplikasi</h3>
                    <p class="mt-1 text-[11px] font-medium leading-snug text-ink-muted">Developer & kebijakan privasi</p>
                </div>
                <svg class="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </RouterLink>
        </div>

    </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { useStoreProfile } from '../composables/useStoreProfile';
import { useToast } from '../composables/useToast';
import { usePwaInstall } from '../composables/usePwaInstall';
import logoMark from '/possuper_logo.png';

// Folder Google Drive berisi APK Android POSSuper (link resmi, jangan diubah).
const ANDROID_APK_URL = 'https://drive.google.com/drive/folders/1-weQy7-INxHfwsDavmZi8SxbSjBtOaZZ?usp=sharing';

const router = useRouter();
const { isStoreProfileComplete } = useStoreProfile();
const { showToast } = useToast();
const {
    isStandalone,
    canShowInstall,
    canPromptInstall,
    isInstalling,
    installError,
    installHint,
    showManualInstallHint,
    toggleManualInstallHint,
    promptInstall
} = usePwaInstall();

// Banner download APK hanya untuk pengunjung web di tab browser. Disembunyikan
// di aplikasi Android native dan saat POSSuper sudah berjalan sebagai PWA
// standalone (pengguna sudah memakai aplikasi web terpasang, bukan APK).
const showAndroidDownload = computed(
    () => !Capacitor.isNativePlatform() && !isStandalone.value
);

const installPwa = async () => {
    const { outcome } = await promptInstall();
    if (outcome === 'dismissed') {
        showToast('Instalasi dibatalkan. Kamu bisa mencoba lagi kapan saja.', 'info', 3500);
    } else if (outcome === 'error') {
        showToast(installError.value || 'Instalasi tidak dapat dimulai.', 'error', 4000);
    }
};

const navigasiKe = (path) => {
    if (path === '/scan' && !isStoreProfileComplete.value) {
        showToast('Harap lengkapi nama dan alamat toko terlebih dahulu sebelum membuka kasir!', 'warning', 4000);
        router.push('/store-profile');
        return;
    }
    router.push(path);
};

const iconKasir = '<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>';

const menuUtama = [
    {
        title: 'Kasir & Transaksi',
        desc: 'Proses penjualan cepat dengan scan barcode',
        path: '/scan',
        variant: 'primary',
        icon: iconKasir
    },
    {
        title: 'Dashboard & Laporan',
        desc: 'Statistik penjualan, laba rugi, dan ranking produk',
        path: '/dashboard',
        variant: 'accent',
        icon: '<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>'
    }
];

const menuPendukung = [
    {
        title: 'Identitas Toko',
        desc: 'Nama & alamat untuk nota',
        path: '/store-profile',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
    },
    {
        title: 'Backup & Restore',
        desc: 'Pindahkan data ke perangkat lain',
        path: '/backup',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>'
    },
    {
        title: 'Riwayat Jual',
        desc: 'Riwayat nota transaksi',
        path: '/history',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>'
    },
    {
        title: 'Riwayat Kas',
        desc: 'Uang masuk & keluar toko',
        path: '/cash-flow',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>'
    },
    {
        title: 'Catat Produk',
        desc: 'Entri produk baru',
        path: '/input',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>'
    },
    {
        title: 'Daftar Produk',
        desc: 'Edit, tambah stok & hapus',
        path: '/list',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>'
    },
    {
        title: 'Input Biaya',
        desc: 'Biaya marketing, admin, dll',
        path: '/biaya',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
    },
    {
        title: 'Pengaturan Printer',
        desc: 'Thermal printer Bluetooth',
        path: '/printer-settings',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>'
    },
    {
        title: 'Kalkulator HPP',
        desc: 'Hitung HPP & harga jual',
        path: '/hpp',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>'
    },
    {
        title: 'Panduan',
        desc: 'Penjelasan istilah keuangan',
        path: '/guide',
        icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>'
    }
];
</script>
