<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Kalkulator HPP</h1>
            <p class="page-subtitle">
                Simulasi Harga Pokok & Keuntungan
            </p>
        </header>

        <!-- Bagian Konten Form -->
        <div class="page-body">

            <div class="card flex flex-col gap-5 p-5 sm:p-6">

                <!-- Bagian 1: Input Data -->
                <div class="space-y-4">
                    <!-- Total Biaya Operasional (Readonly) -->
                    <div>
                        <label class="field-label pl-1">Total Biaya Operasional</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="ops" type="number"
                                class="field pl-12 tabular-nums">
                        </div>
                    </div>

                    <!-- Total Biaya Bahan Baku (Readonly) -->
                    <div>
                        <label class="field-label pl-1">Total Biaya Bahan Baku</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="bahan" type="number"
                                class="field pl-12 tabular-nums">
                        </div>
                    </div>

                    <!-- Jumlah Produk Dihasilkan -->
                    <div>
                        <label class="field-label pl-1">Jumlah Produk Dihasilkan</label>
                        <div class="relative">
                            <input v-model="qty" type="number" min="0" placeholder="0"
                                class="field pr-16 tabular-nums">
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-xl border-l border-border bg-surface-muted px-3 pr-4">
                                <span class="text-[11px] font-bold uppercase tracking-wide text-ink-secondary">Unit</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Hasil HPP -->
                <div class="flex flex-row items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary-soft p-4 sm:p-5">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-primary-hover">HPP per Unit</span>
                    <span class="text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
                        Rp {{ hasilHpp.toLocaleString('id-ID') }}
                    </span>
                </div>

                <!-- Divider -->
                <div class="divider-dashed"></div>

                <!-- Bagian 2: Target Keuntungan -->
                <div class="space-y-4">
                    <div>
                        <label class="field-label pl-1">Target Keuntungan</label>
                        <div class="relative w-full sm:w-1/2">
                            <input v-model="margin" type="number" min="0" placeholder="0"
                                class="field pr-12 tabular-nums">
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                <span class="text-base font-bold text-ink-muted">%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Rekomendasi Harga Jual -->
                    <div class="flex flex-col gap-2 rounded-xl bg-accent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <span class="text-[11px] font-bold uppercase tracking-widest text-primary-soft">
                            Rekomendasi Harga Jual
                        </span>
                        <span class="text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
                            Rp {{ hargaJual.toLocaleString('id-ID') }}
                        </span>
                    </div>
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
import { ref, computed } from 'vue';

const ops = ref(0);
const bahan = ref(0);
const qty = ref(1);
const margin = ref(0);

const hasilHpp = computed(() => {
    if (qty.value <= 0) return 0;
    return (Number(ops.value) + Number(bahan.value)) / Number(qty.value);
});

const hargaJual = computed(() => {
    return hasilHpp.value + (hasilHpp.value * (Number(margin.value) / 100));
});
</script>