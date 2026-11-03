<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header pt-10 pb-12">
            <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <svg class="h-5 w-5 text-primary-soft" fill="none" stroke="currentColor" stroke-width="2"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <h1 class="page-title">Panduan Aplikasi</h1>
            <p class="page-subtitle">
                Kamus & Istilah Keuangan Bisnis
            </p>
        </header>

        <!-- Bagian Konten Utama -->
        <div class="page-body">

            <!-- Daftar Accordion -->
            <div class="flex flex-col gap-3">
                <div v-for="(item, index) in guides" :key="index"
                    class="overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all duration-300"
                    :class="item.isOpen ? 'border-primary/40' : 'border-border hover:border-primary/25'">

                    <!-- Header Tombol Accordion -->
                    <button @click="toggle(index)"
                        class="flex w-full items-center justify-between gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset sm:p-5">
                        <span class="text-sm font-bold leading-tight text-ink">
                            {{ item.title }}
                        </span>
                        <!-- Ikon Indikator Buka/Tutup -->
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300"
                            :class="item.isOpen ? 'rotate-180 bg-primary text-white' : 'bg-primary-soft text-primary-hover'">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    <!-- Isi Definisi -->
                    <transition
                        enter-active-class="transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden"
                        leave-active-class="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
                        enter-from-class="max-h-0 opacity-0" enter-to-class="max-h-[500px] opacity-100"
                        leave-from-class="max-h-[500px] opacity-100" leave-to-class="max-h-0 opacity-0">
                        <div v-show="item.isOpen" class="px-4 pb-4 sm:px-5 sm:pb-5">
                            <div class="rounded-xl border border-border bg-background p-4 text-sm font-medium leading-relaxed text-ink-secondary">
                                {{ item.content }}
                            </div>
                        </div>
                    </transition>
                </div>
            </div>

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
import { ref } from 'vue';

const guides = ref([
    {
        title: 'HPP (Harga Pokok Penjualan)',
        content: 'HPP adalah total keseluruhan biaya yang dikeluarkan secara langsung oleh bisnis untuk memproduksi barang atau jasa yang dijual. Ini biasanya mencakup biaya bahan baku dan biaya operasional pembuatan produk.',
        isOpen: false
    },
    {
        title: 'Biaya Pemasaran',
        content: 'Semua biaya yang dikeluarkan untuk tujuan mempromosikan, mengiklankan, dan mendistribusikan produk atau layanan kepada pelanggan. Contohnya termasuk iklan media sosial, cetak brosur, dan komisi penjualan.',
        isOpen: false
    },
    {
        title: 'Biaya Admin',
        content: 'Biaya yang berkaitan dengan manajemen dan administrasi bisnis sehari-hari. Contoh pengeluaran ini meliputi gaji staf admin, alat tulis kantor (ATK), biaya internet, dan biaya administrasi bank.',
        isOpen: false
    },
    {
        title: 'Biaya Sewa',
        content: 'Biaya tetap yang dibayarkan secara berkala untuk penggunaan properti atau fasilitas fisik. Contohnya adalah biaya sewa ruko, gudang, kantor, atau peralatan untuk kegiatan usaha.',
        isOpen: false
    },
    {
        title: 'Biaya Listrik, Air, dan Internet',
        content: 'Biaya tagihan listrik, air, dan internet bulanan yang menunjang operasional bisnis Anda.',
        isOpen: false
    },
    {
        title: 'Biaya Perlengkapan',
        content: 'Pengeluaran untuk barang-barang pendukung usaha yang biasanya cepat habis terpakai, tapi bukan bahan baku utama produk. Contohnya kardus packaging, bubble wrap, kantong belanja, stiker, atau nota kasir.',
        isOpen: false
    },
    {
        title: 'Biaya Pajak',
        content: 'Kewajiban finansial yang harus disetorkan ke negara dari hasil usahamu. Untuk pengusaha atau UMKM, biasanya berupa Pajak Penghasilan (PPh) Final. Pastikan selalu disisihkan dari awal agar tidak mengganggu arus kas bisnis nanti.',
        isOpen: false
    },
    {
        title: 'Biaya Lain-lain',
        content: 'Pengeluaran insidental, tak terduga, atau biaya bernilai kecil yang tidak dapat diklasifikasikan secara spesifik ke dalam kategori biaya utama (Pemasaran, Admin, atau Sewa).',
        isOpen: false
    },
    {
        title: 'Pendapatan (Omset)',
        content: 'Total uang yang masuk dari hasil penjualan kamu sebelum dipotong biaya apa pun. Ibaratnya, ini adalah uang kotor yang masuk ke laci kasir atau rekening bisnis.',
        isOpen: false
    },
    {
        title: 'Laba Kotor (Gross Profit)',
        content: 'Keuntungan awal dari jualan Anda setelah dikurangi modal pembuatan atau pembelian barang (HPP). Keuntungan ini belum bersih karena belum dipotong pengeluaran lainnya seperti pemasaran, admin, dan lain-lain.',
        isOpen: false
    },
    {
        title: 'Laba Bersih (Net Profit)',
        content: 'Nah, ini dia cuan atau keuntungan murni yang benar-benar masuk kantong Anda! Angka ini didapat dari Laba Kotor yang sudah dikurangi dengan Total Biaya lainnya seperti pemasaran, admin, dan lain-lain.',
        isOpen: false
    },
    {
        title: 'Laporan Laba Rugi',
        content: 'Laporan keuangan yang menyajikan ringkasan pendapatan, biaya, dan pengeluaran perusahaan dalam suatu periode tertentu. Laporan ini berfungsi untuk menunjukkan apakah bisnis Anda sedang menghasilkan keuntungan (laba) atau mengalami kerugian.',
        isOpen: false
    }
]);

// Fungsi untuk membuka/menutup dropdown accordion
const toggle = (index) => {
    guides.value.forEach((g, i) => { if (i !== index) g.isOpen = false });

    guides.value[index].isOpen = !guides.value[index].isOpen;
};
</script>