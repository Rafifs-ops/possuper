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
import { RouterLink, useRouter } from 'vue-router';
import { useStoreProfile } from '../composables/useStoreProfile';
import { useToast } from '../composables/useToast';
import logoMark from '/possuper_logo.png';

const router = useRouter();
const { isStoreProfileComplete } = useStoreProfile();
const { showToast } = useToast();

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
