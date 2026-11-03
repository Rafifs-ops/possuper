<template>
  <div v-if="isOpen" class="modal-overlay transition-opacity">
    <div class="modal-panel max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border bg-surface px-4 py-4 sm:px-5">
        <h3 class="text-base font-bold text-ink">Cari Produk</h3>
        <button @click="$emit('close')" class="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search Input -->
      <div class="border-b border-border px-4 py-4 sm:px-5">
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg class="h-5 w-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama atau ID produk..."
            class="field pl-10"
          />
        </div>
      </div>

      <!-- Product List -->
      <div class="flex-1 space-y-3 overflow-y-auto bg-background p-4 sm:p-5">
        <div v-if="filteredProducts.length === 0" class="py-8 text-center">
          <svg class="mx-auto mb-3 h-12 w-12 text-border-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="text-sm font-medium text-ink-muted">Tidak ada produk ditemukan.</p>
        </div>

        <div
          v-else
          v-for="produk in filteredProducts"
          :key="produk.id"
          @click="selectProduct(produk)"
          class="cursor-pointer rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
        >
          <div class="mb-1.5 flex items-start justify-between gap-2">
            <h4 class="font-bold leading-tight text-ink">{{ produk.nama }}</h4>
            <span class="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px] font-medium text-ink-muted">
              {{ produk.id }}
            </span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-sm font-bold text-primary tabular-nums">
              Rp {{ produk.harga?.toLocaleString('id-ID') }}
            </p>
            <span class="rounded-md px-2 py-1 text-xs font-semibold"
                  :class="produk.quantity > 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'">
              Stok: {{ produk.quantity || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useProducts } from '../composables/useProduct';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'select']);

const { productList, loadProducts } = useProducts();
const searchQuery = ref('');

onMounted(() => {
    loadProducts();
});

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        loadProducts(); // Refresh list tiap kali modal dibuka
        searchQuery.value = ''; // Reset pencarian
    }
});

const filteredProducts = computed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return productList.value;

    return productList.value.filter(p =>
        (p.nama && p.nama.toLowerCase().includes(query)) ||
        (p.id && p.id.toLowerCase().includes(query))
    );
});

const selectProduct = (produk) => {
    emit('select', produk.id);
};
</script>
