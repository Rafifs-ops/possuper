<template>
    <div class="relative z-10 flex flex-col">

        <!-- Tombol Scan Barcode Utama -->
        <button @click="$emit('scan')" class="btn-primary w-full rounded-2xl py-4 text-sm">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Mulai Pindai Barcode
        </button>

        <!-- Divider -->
        <div class="my-5 flex items-center gap-3">
            <div class="h-px flex-1 bg-border"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Atau</span>
            <div class="h-px flex-1 bg-border"></div>
        </div>

        <!-- Area Input Manual & Cari Produk -->
        <div class="flex flex-col gap-3">

            <!-- Group Input Manual -->
            <div class="flex w-full gap-2">
                <input v-model="manualId" @keyup.enter="handleTambahManual" type="text" placeholder="Masukkan ID..."
                    class="field min-w-0 flex-1 rounded-2xl" />

                <button @click="handleTambahManual" class="btn-primary shrink-0 rounded-2xl px-6">
                    Tambah
                </button>
            </div>

            <!-- Tombol Cari Produk -->
            <button @click="$emit('buka-pencarian')"
                class="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold text-ink-secondary transition hover:border-primary/40 hover:bg-primary-tint hover:text-primary-hover active:scale-[0.99]">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari Produk Berdasarkan Nama
            </button>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['scan', 'tambah-manual', 'buka-pencarian']);

const manualId = ref('');

const handleTambahManual = () => {
    if (manualId.value.trim() === '') return;
    emit('tambah-manual', manualId.value.trim());
    manualId.value = ''; // Reset input after adding
};
</script>
