<template>
    <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5">

        <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
                <div class="mb-1.5 flex flex-wrap items-center gap-2">
                    <h4 class="text-base font-bold leading-tight text-ink">
                        {{ produk.nama }}
                        <span class="ml-1 text-sm font-semibold text-primary">x{{ produk.quantity }}</span>
                    </h4>
                    <span class="rounded-md bg-success-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                        Berhasil
                    </span>
                </div>
                <p class="text-sm font-bold text-ink tabular-nums">
                    Rp {{ (produk.harga * produk.quantity).toLocaleString('id-ID') }}
                    <span class="ml-1 text-xs font-medium text-ink-muted">
                        (@Rp {{ produk.harga.toLocaleString('id-ID') }})
                    </span>
                </p>
            </div>
        </div>

        <!-- Kontrol Kuantitas -->
        <div class="mt-3.5 flex items-center justify-between border-t border-border pt-3.5">
            <span class="text-[11px] font-bold uppercase tracking-widest text-ink-secondary">Kuantitas</span>

            <div class="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1.5">
                <button @click="$emit('kurang', produk.id)"
                    class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-secondary shadow-sm transition-colors hover:bg-danger-soft hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
                    title="Kurangi Kuantitas">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                </button>

                <span class="min-w-[3rem] text-center text-sm font-bold text-ink tabular-nums">{{ produk.quantity || 0 }}</span>

                <button @click="$emit('tambah', produk.id)"
                    class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
                    title="Tambah Kuantitas">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs sm:mt-4 sm:pt-4">
            <div class="flex items-center gap-2">
                <span class="rounded-md border border-border bg-background px-2 py-1 font-mono font-medium text-ink-muted">
                    ID: {{ produk.id }}
                </span>
                <button @click="$emit('hapus', produk.id)"
                    class="rounded-md bg-danger-soft px-2 py-1 font-bold text-danger transition hover:bg-danger/15">
                    Batal
                </button>
            </div>

            <span class="flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 font-bold text-success tabular-nums">
                Margin Rp {{ (((produk.harga - (produk.hpp || 0)) *
                    produk.quantity)).toLocaleString('id-ID')
                }}
            </span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    produk: {
        type: Object,
        required: true
    }
});

defineEmits(['hapus', 'tambah', 'kurang']);
</script>
