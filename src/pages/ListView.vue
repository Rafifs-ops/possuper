<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">Daftar Inventaris</h1>
            <p class="page-subtitle">
                Kelola & Pantau Stok Barang
            </p>
        </header>

        <!-- Bagian Daftar Produk -->
        <div class="page-body">

            <!-- Search Bar -->
            <div class="card p-4">
                <div class="relative">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <svg class="h-5 w-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input v-model="searchTerm" type="text" placeholder="Cari produk berdasarkan nama, ID, atau harga..."
                        class="field pl-12" />
                    <button v-if="searchTerm" @click="searchTerm = ''"
                        class="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg class="h-5 w-5 text-ink-muted hover:text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Menampilkan {{ paginatedProducts.length }} dari {{ filteredProducts.length }} produk
                </div>
            </div>

            <!-- Card Item Looping -->
            <div v-for="item in paginatedProducts" :key="item.id"
                class="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-5">

                <!-- Action Buttons -->
                <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <!-- Tombol Edit -->
                    <button @click="bukaEditModal(item)"
                        class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary shadow-sm transition-all hover:border-primary/40 hover:bg-primary-tint hover:text-primary-hover active:scale-95"
                        title="Edit Barang">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                            </path>
                        </svg>
                    </button>
                    <!-- Tombol Hapus -->
                    <button @click="konfirmasiHapus(item)"
                        class="flex h-9 w-9 items-center justify-center rounded-lg border border-danger/20 bg-danger-soft text-danger shadow-sm transition-all hover:bg-danger hover:text-white active:scale-95"
                        title="Hapus Barang">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                            </path>
                        </svg>
                    </button>
                </div>

                <!-- Info Produk (Nama & ID) -->
                <div class="relative z-10 pr-14">
                    <h3 class="mb-2 text-base font-bold leading-tight text-ink">{{ item.nama }}</h3>
                    <span class="inline-block rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        ID: {{ item.id }}
                    </span>
                </div>

                <!-- Info Harga -->
                <div class="relative z-10 grid grid-cols-2 gap-4 rounded-xl border border-border bg-background p-4">
                    <div>
                        <span class="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-ink-muted">Harga Jual</span>
                        <span class="font-bold tracking-tight text-ink tabular-nums whitespace-nowrap">Rp {{
                            item.harga.toLocaleString('id-ID') }}</span>
                    </div>
                    <div class="border-l border-border pl-4">
                        <span class="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-ink-muted">HPP</span>
                        <span class="font-bold tracking-tight text-ink tabular-nums whitespace-nowrap">Rp {{ (item.hpp
                            || 0).toLocaleString('id-ID') }}</span>
                    </div>
                </div>

                <!-- Stok Control -->
                <div class="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <span class="text-[11px] font-bold uppercase tracking-widest text-ink-secondary">Stok Tersedia</span>

                    <div class="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1.5">
                        <button @click="kurangiStok(item)"
                            class="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-ink-secondary shadow-sm transition-colors hover:bg-danger-soft hover:text-danger focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-ink-secondary"
                            :disabled="(item.quantity || 0) <= 0" title="Kurangi Stok">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                        </button>

                        <span class="min-w-[2.5rem] text-center text-sm font-bold text-ink tabular-nums">{{ item.quantity || 0 }}</span>

                        <button @click="tambahStok(item)"
                            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
                            title="Tambah Stok">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="productList.length === 0" class="empty-state">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 class="text-base font-bold tracking-tight text-ink">Belum ada data barang</h3>
                <p class="mt-2 max-w-[260px] text-[11px] font-medium leading-relaxed text-ink-muted">
                    Tidak ada produk yang terdaftar saat ini. Silakan masuk ke menu Catat Produk untuk menambahkan.
                </p>
            </div>

            <!-- Pagination Controls -->
            <div v-if="filteredProducts.length > 0" class="card p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                        Halaman {{ currentPage }} dari {{ totalPages || 1 }}
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button @click="goToFirstPage()" :disabled="currentPage === 1"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Halaman Pertama">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <button @click="prevPage()" :disabled="currentPage === 1"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Halaman Sebelumnya">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        <div class="flex items-center gap-1 px-2">
                            <button v-for="(page, idx) in getPageNumbers" :key="typeof page === 'number' ? page : 'ellipsis-' + idx"
                                @click="typeof page === 'number' ? goToPage(page) : null"
                                :disabled="typeof page !== 'number'"
                                :class="`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${page === currentPage ? 'bg-primary-strong text-white shadow-sm' : 'bg-surface text-ink-secondary border border-border hover:border-primary/40 hover:text-primary'} ${typeof page !== 'number' ? 'cursor-default' : ''}`">
                                {{ page }}
                            </button>
                        </div>

                        <button @click="nextPage()" :disabled="currentPage === totalPages"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Halaman Berikutnya">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7m0 0l-7 7m7-7H6" />
                            </svg>
                        </button>
                        <button @click="goToLastPage()" :disabled="currentPage === totalPages"
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Halaman Terakhir">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5l7 7m0 0l-7 7m7-7H6" />
                            </svg>
                        </button>
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

        <!-- Edit Modal -->
        <div v-if="showEditModal" class="modal-overlay">
            <div class="modal-panel max-w-sm">
                <!-- Modal Header -->
                <div class="flex items-center justify-between border-b border-border px-6 py-5">
                    <h3 class="text-base font-bold tracking-tight text-ink">Edit Produk</h3>
                    <button @click="showEditModal = false"
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary transition-colors hover:bg-danger-soft hover:text-danger">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Modal Form -->
                <form @submit.prevent="simpanEdit" class="space-y-4 overflow-y-auto p-6">
                    <div>
                        <label class="field-label pl-1">Nama Barang</label>
                        <input v-model="editForm.nama" type="text" required class="field rounded-2xl">
                    </div>
                    <div>
                        <label class="field-label pl-1">Harga Jual</label>
                        <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="editForm.harga" type="number" required class="field rounded-2xl pl-12 tabular-nums">
                        </div>
                    </div>
                    <div>
                        <label class="field-label pl-1">HPP</label>
                        <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span class="text-sm font-bold text-ink-muted">Rp</span>
                            </div>
                            <input v-model="editForm.hpp" type="number" required class="field rounded-2xl pl-12 tabular-nums">
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" @click="showEditModal = false" class="btn-secondary rounded-xl px-5 py-3 text-sm">
                            Batal
                        </button>
                        <button type="submit" class="btn-primary rounded-xl px-5 py-3 text-sm">
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useProducts } from '../composables/useProduct';
import { useToast } from '../composables/useToast';

// Import deleteProduct dan updateProductStock dari composable
const { productList, loadProducts, deleteProduct, ubahStokAman, updateProductDetails } = useProducts();
const { showToast } = useToast();

// State untuk search dan pagination
const searchTerm = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Computed properties untuk search dan pagination
const filteredProducts = computed(() => {
  if (!searchTerm.value) return productList.value;
  
  const term = searchTerm.value.toLowerCase();
  return productList.value.filter(item => 
    item.nama.toLowerCase().includes(term) ||
    item.id.toString().includes(term) ||
    item.harga.toString().includes(term)
  );
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

// Clamp currentPage agar tidak melebihi totalPages (misal setelah search)
watch(totalPages, (tp) => {
  if (tp > 0 && currentPage.value > tp) {
    currentPage.value = tp;
  } else if (tp === 0) {
    currentPage.value = 1;
  }
});

// Reset ke halaman 1 setiap kali search berubah
watch(searchTerm, () => {
  currentPage.value = 1;
});

// Fungsi helper untuk pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToFirstPage = () => {
  currentPage.value = 1;
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
};

const getPageNumbers = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 3; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
});

const showEditModal = ref(false);
const editForm = ref({ id: '', nama: '', harga: '', hpp: '' });

const bukaEditModal = (item) => {
    editForm.value = {
        id: item.id,
        nama: item.nama,
        harga: item.harga,
        hpp: item.hpp || 0
    };
    showEditModal.value = true;
};

const simpanEdit = async () => {
    try {
        await updateProductDetails(editForm.value.id, {
            nama: editForm.value.nama,
            harga: Number(editForm.value.harga),
            hpp: Number(editForm.value.hpp)
        });
        showToast('Produk berhasil diperbarui.', 'success');
        showEditModal.value = false;
    } catch (e) {
        console.error('Gagal menyimpan edit produk:', e);
        showToast('Gagal menyimpan perubahan produk.', 'error');
    }
};

const tambahStok = async (item) => {
    try {
        await ubahStokAman(item.id, 1);
    } catch (e) {
        console.error('Gagal menambah stok:', e);
        showToast('Gagal menambah stok.', 'error');
    }
};

const kurangiStok = async (item) => {
    if ((item.quantity || 0) > 0) {
        try {
            await ubahStokAman(item.id, -1);
        } catch (e) {
            console.error('Gagal mengurangi stok:', e);
            showToast('Gagal mengurangi stok.', 'error');
        }
    }
};

onMounted(async () => {
    await loadProducts();
});

// Fungsi untuk memunculkan peringatan sebelum menghapus
const konfirmasiHapus = async (item) => {
    if (item.quantity > 0) {
        showToast(`Gagal! Produk "${item.nama}" masih memiliki stok ${item.quantity}. Kosongkan stok terlebih dahulu agar tidak merusak laporan HPP.`, 'error');
        return;
    }

    const yakin = window.confirm(`Apakah Anda yakin ingin menghapus "${item.nama}" dari sistem?`);
    if (yakin) {
        try {
            await deleteProduct(item.id);
            showToast(`Produk "${item.nama}" berhasil dihapus.`, 'success');
        } catch (e) {
            console.error('Gagal menghapus produk:', e);
            showToast('Gagal menghapus produk.', 'error');
        }
    }
};
</script>