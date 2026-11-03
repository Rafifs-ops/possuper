<template>
    <div class="grid grid-cols-2 gap-3 sm:gap-4">

        <!-- Kartu 1: Total Penjualan -->
        <div class="flex flex-col justify-center rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <div class="mb-1.5 flex items-center gap-1.5 text-ink-secondary">
                <svg class="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="text-[10px] font-bold uppercase tracking-widest sm:text-[11px]">
                    Total Penjualan
                </p>
            </div>
            <p class="truncate text-lg font-bold tracking-tight text-ink tabular-nums sm:text-xl">
                Rp {{ totalPenjualan.toLocaleString('id-ID') }}
            </p>
        </div>

        <!-- Kartu 2: Est. Keuntungan (highlight primary) -->
        <div class="flex flex-col justify-center rounded-2xl border border-primary/25 bg-primary-soft p-4 shadow-sm sm:p-5">
            <div class="mb-1.5 flex items-center gap-1.5 text-primary-hover">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-[10px] font-bold uppercase tracking-widest sm:text-[11px]">
                    Est. Keuntungan
                </p>
            </div>
            <p class="truncate text-lg font-bold tracking-tight text-ink tabular-nums sm:text-xl">
                Rp {{ totalKeuntungan.toLocaleString('id-ID') }}
            </p>
        </div>

    </div>
</template>

<script setup>
defineProps({
    totalPenjualan: {
        type: Number,
        required: true,
        default: 0
    },
    totalKeuntungan: {
        type: Number,
        required: true,
        default: 0
    }
});
</script>
