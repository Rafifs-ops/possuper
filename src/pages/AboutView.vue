<template>
    <!-- Latar Belakang Utama: Slate kebiruan (Tanpa Putih) -->
    <div class="page-shell">

        <!-- Bagian Header (Curved Bottom & Decorative Blur) -->
        <div
            class="page-header pt-11 pb-11">
            <!-- Container Logo -->
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background p-2 shadow-lg shadow-black/10">
                <img :src="logoMark" alt="Logo POSSuper" class="h-full w-full object-contain" />
            </div>

            <h1 class="page-title">POSSuper</h1>
            <span
                class="mt-3 inline-block rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-soft">
                Versi 1.0.1
            </span>
        </div>

        <!-- Bagian Konten Utama -->
        <div class="flex-grow px-5 pt-6 pb-12 w-full max-w-xl mx-auto flex flex-col gap-4">

            <!-- Deskripsi Aplikasi (Mini Bento Box) -->
            <div
                class="card p-5 text-center">
                <p class="text-sm font-medium leading-relaxed text-ink-secondary">
                    Aplikasi manajemen inventaris yang dirancang untuk mempermudah pelacakan stok barang, perhitungan
                    HPP, serta pencatatan riwayat transaksi secara terpadu dan efisien.
                </p>
            </div>

            <!-- Daftar Menu (Bento Card Group) -->
            <div
                class="mt-1 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

                <!-- Item Bantuan -->
                <button @click="openLink('support')"
                    class="group flex items-center justify-between gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-background focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-hover transition-colors group-hover:bg-primary group-hover:text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span class="text-sm font-bold tracking-wide text-ink">Bantuan & Dukungan</span>
                    </div>
                    <span
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-background text-ink-muted transition-all group-hover:bg-primary-soft group-hover:text-primary-hover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </button>

                <!-- Item Kebijakan Privasi -->
                <button @click="openLink('privacy')"
                    class="group flex items-center justify-between gap-3 border-b border-border px-5 py-4 transition-colors hover:bg-background focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-hover transition-colors group-hover:bg-primary group-hover:text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span class="text-sm font-bold tracking-wide text-ink">Kebijakan Privasi</span>
                    </div>
                    <span
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-background text-ink-muted transition-all group-hover:bg-primary-soft group-hover:text-primary-hover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </button>

                <!-- Item Syarat & Ketentuan -->
                <button @click="openLink('terms')"
                    class="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-background focus:outline-none">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-hover transition-colors group-hover:bg-primary group-hover:text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span class="text-sm font-bold tracking-wide text-ink">Syarat & Ketentuan</span>
                    </div>
                    <span
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-background text-ink-muted transition-all group-hover:bg-primary-soft group-hover:text-primary-hover">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </button>
            </div>

            <!-- Tombol Kembali Ke Beranda -->
            <RouterLink to="/"
                class="btn-secondary mt-2 rounded-2xl">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Menu Utama
            </RouterLink>

        </div>

        <!-- MODAL (Bento Style & Frosted Glass) -->
        <transition enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">

            <div v-if="isModalOpen"
                class="modal-overlay"
                @click="closeModal">

                <div class="modal-panel max-w-[550px] animate-fade-in-up"
                    @click.stop>

                    <!-- Header Modal -->
                    <header
                        class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <h3 class="m-0 text-base font-bold tracking-tight text-ink">
                            {{ modalType === 'privacy' ? 'Kebijakan Privasi' : 'Syarat & Ketentuan' }}
                        </h3>
                        <button
                            class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary transition-colors hover:bg-danger-soft hover:text-danger focus:outline-none"
                            @click="closeModal">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    <!-- Isi Modal -->
                    <div
                        class="custom-scrollbar overflow-y-auto p-5 text-sm leading-relaxed text-ink-secondary">
                        <template v-if="modalType === 'privacy'">
                            <div
                                class="mb-6 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-tint px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-primary-hover">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Terakhir Diperbarui: 8 Juli 2026
                            </div>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                1. Pendahuluan</h4>
                            <p class="mb-4">Kami sebagai <i class="font-semibold text-ink">developer</i> aplikasi ini menghormati
                                privasi Anda dan berkomitmen untuk melindunginya melalui kepatuhan kami terhadap
                                kebijakan ini. Kebijakan Privasi ini menjelaskan jenis informasi yang mungkin kami
                                kumpulkan dari Anda atau yang mungkin Anda berikan saat menggunakan aplikasi POSSuper
                                ("Aplikasi") dan praktik kami dalam mengumpulkan, menggunakan, memelihara, dan
                                melindungi informasi tersebut.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                2. Informasi yang Kami Kumpulkan</h4>
                            <p class="mb-3">Aplikasi kami dirancang untuk berfungsi secara maksimal di perangkat Anda.
                                Informasi yang kami proses meliputi:</p>
                            <ul class="mb-4 pl-5 list-none space-y-3">
                                <li
                                    class="relative before:content-[''] before:absolute before:-left-4 before:top-1.5 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                    <strong class="text-ink">Data Inventaris dan Transaksi:</strong> Data barang,
                                    stok, Harga Pokok Penjualan (HPP), dan riwayat penjualan yang Anda masukkan.
                                    <span class="mt-1 block rounded bg-primary-soft px-1 font-bold text-primary-hover">Catatan
                                        Penting:</span> Data ini disimpan secara lokal di dalam perangkat Anda. Kami
                                    tidak mengunggah, menyalin, atau menyimpan data bisnis Anda di server kami.
                                </li>
                                <li
                                    class="relative before:content-[''] before:absolute before:-left-4 before:top-1.5 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                    <strong class="text-ink">Akses Kamera:</strong> Aplikasi memerlukan izin akses
                                    kamera pada perangkat Anda semata-mata untuk fitur Scan Barcode barang. Kami tidak
                                    merekam, menyimpan, atau mengirimkan gambar atau video apa pun ke luar perangkat
                                    Anda.
                                </li>
                                <li
                                    class="relative before:content-[''] before:absolute before:-left-4 before:top-1.5 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                    <strong class="text-ink">Penyimpanan Perangkat:</strong> Aplikasi mungkin
                                    memerlukan izin akses penyimpanan untuk mengekspor data (seperti PDF struk atau
                                    laporan Excel).
                                </li>
                            </ul>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                3. Penggunaan Informasi</h4>
                            <p class="mb-3">Kami menggunakan informasi yang ada di dalam Aplikasi semata-mata untuk:</p>
                            <ul class="mb-4 pl-5 list-disc space-y-1 marker:text-primary">
                                <li>Menyediakan fitur dan fungsionalitas Aplikasi kepada Anda (pencatatan stok,
                                    perhitungan biaya, dll).</li>
                                <li>Menjalankan fungsi pemindaian barcode secara real-time.</li>
                            </ul>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                4. Berbagi Informasi</h4>
                            <p class="mb-4">Karena data Anda disimpan secara lokal di perangkat Anda, kami tidak
                                menjual, memperdagangkan, atau menyewakan informasi atau data bisnis pengguna kepada
                                pihak ketiga.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                5. Keamanan Data</h4>
                            <p class="mb-4">Keamanan data inventaris Anda bergantung pada keamanan perangkat seluler
                                Anda. Kami sangat menyarankan Anda untuk menggunakan fitur keamanan bawaan perangkat
                                (seperti PIN, sidik jari, atau password) dan secara rutin melakukan backup (pencadangan)
                                data Anda jika Aplikasi menyediakan fitur tersebut. Kami tidak bertanggung jawab atas
                                kehilangan data yang disebabkan oleh kerusakan perangkat atau penghapusan Aplikasi.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                6. Informasi Kontak</h4>
                            <p class="mb-4">Jika Anda memiliki pertanyaan atau komentar tentang Kebijakan Privasi ini,
                                silakan hubungi kami di: <a href="mailto:rafifebrians150206@gmail.com"
                                    class="ml-1 rounded bg-primary-soft px-2 py-0.5 font-bold text-primary-hover hover:underline">windysuyono06@gmail.com</a>.
                            </p>
                        </template>

                        <template v-else-if="modalType === 'terms'">
                            <div
                                class="mb-6 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-tint px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-primary-hover">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Terakhir Diperbarui: 8 Juli 2026
                            </div>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                1. Penerimaan Syarat</h4>
                            <p class="mb-4">Dengan mengunduh, mengakses, atau menggunakan aplikasi POSSuper
                                ("Aplikasi"), Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak
                                setuju dengan ketentuan ini, mohon untuk tidak menggunakan Aplikasi.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                2. Penggunaan Aplikasi</h4>
                            <p class="mb-4">Aplikasi ini disediakan untuk membantu Anda dalam manajemen inventaris,
                                pencatatan stok, perhitungan Harga Pokok Penjualan (HPP), dan pencetakan struk. Anda
                                setuju untuk menggunakan Aplikasi ini hanya untuk tujuan yang sah dan tidak melanggar
                                hukum yang berlaku di yurisdiksi Anda.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                3. Tanggung Jawab Pengguna dan Data</h4>
                            <ul class="mb-4 pl-5 list-none space-y-3">
                                <li
                                    class="relative before:content-[''] before:absolute before:-left-4 before:top-1.5 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                    <strong class="text-ink">Akurasi Data:</strong> Anda bertanggung jawab penuh
                                    atas keakuratan data barang, harga, dan perhitungan yang Anda masukkan ke dalam
                                    Aplikasi.
                                </li>
                                <li
                                    class="relative before:content-[''] before:absolute before:-left-4 before:top-1.5 before:w-2 before:h-2 before:bg-primary before:rounded-full">
                                    <strong class="text-ink">Kehilangan Data:</strong> Data yang Anda masukkan
                                    disimpan secara lokal di perangkat Anda. Anda bertanggung jawab penuh untuk
                                    melakukan pencadangan (backup) data Anda secara mandiri. Kami tidak bertanggung
                                    jawab atas kehilangan data akibat uninstall Aplikasi, kerusakan perangkat, atau
                                    kelalaian pengguna.
                                </li>
                            </ul>
                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                4. Penyangkalan Jaminan</h4>
                            <p class="mb-4">Aplikasi ini disediakan "APA ADANYA" (as is) dan "SEBAGAIMANA TERSEDIA" (as
                                available). Kami tidak memberikan jaminan bahwa Aplikasi akan bebas dari bug, kesalahan
                                (error), atau gangguan. Kami tidak menjamin bahwa perhitungan finansial dalam aplikasi
                                100% sempurna untuk kebutuhan akuntansi resmi; pengguna wajib memverifikasi laporannya
                                sendiri.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                5. Batasan Tanggung Jawab</h4>
                            <p class="mb-4">Sejauh diizinkan oleh hukum, developer dan product owner tidak akan
                                bertanggung jawab atas kerusakan langsung, tidak langsung, insidental, atau
                                konsekuensial, termasuk namun tidak terbatas pada kerugian laba, kerugian bisnis, atau
                                kehilangan data, yang timbul dari penggunaan atau ketidakmampuan Anda menggunakan
                                Aplikasi.</p>

                            <h4
                                class="mt-6 mb-2 border-b border-border pb-2 text-base font-bold text-ink">
                                6. Kontak</h4>
                            <p class="mb-4">Untuk pertanyaan terkait Syarat dan Ketentuan ini, silakan hubungi kami
                                melalui: <a href="mailto:rafifebrians150206@gmail.com"
                                    class="ml-1 rounded bg-primary-soft px-2 py-0.5 font-bold text-primary-hover hover:underline">rafifebrians150206@gmail.com</a>.
                            </p>
                        </template>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
/* Opsional: Mempercantik scrollbar di dalam modal untuk desktop */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: var(--color-surface-muted);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-border-strong);
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--color-ink-muted);
}

/* Animasi simpel saat modal terbuka */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
}
</style>

<script setup>
import { ref } from 'vue'
import logoMark from '/possuper_logo.png'

const isModalOpen = ref(false)
const modalType = ref('')

// Fungsi simulasi untuk membuka tautan eksternal
const openLink = (type) => {
    if (type === 'support') {
        window.open('mailto:windysuyono06@gmail.com', '_blank')
    } else if (type === 'privacy') {
        modalType.value = 'privacy'
        isModalOpen.value = true
    } else if (type === 'terms') {
        modalType.value = 'terms'
        isModalOpen.value = true
    }
}

const closeModal = () => {
    isModalOpen.value = false
    modalType.value = ''
}
</script>