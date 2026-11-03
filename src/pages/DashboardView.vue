<template>
    <div class="page-shell">

        <!-- Bagian Header -->
        <header class="page-header">
            <h1 class="page-title">
                {{ storeProfile.namaToko || 'Dashboard' }}
            </h1>
            <p v-if="storeProfile.alamatToko" class="mx-auto mt-1 max-w-sm text-[11px] font-medium leading-snug text-primary-soft">
                {{ storeProfile.alamatToko }}
            </p>
            <p class="page-subtitle">
                Ringkasan Kesehatan Bisnis Toko
            </p>

            <!-- Input Periode -->
            <div class="mx-auto mt-5 flex w-full max-w-sm flex-col gap-3 text-left">
                <div>
                    <label class="mb-1.5 block pl-1 text-[10px] font-bold uppercase tracking-widest text-primary-soft">
                        Periode Laporan
                    </label>
                    <select v-model="tipePeriode" @change="muatData"
                        class="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-primary/60">
                        <option value="bulan" class="text-ink">1 Bulan</option>
                        <option value="semester" class="text-ink">1 Semester Terakhir</option>
                        <option value="semua" class="text-ink">Seluruh Waktu</option>
                    </select>
                </div>
                <div v-if="tipePeriode === 'bulan'">
                    <label class="mb-1.5 block pl-1 text-[10px] font-bold uppercase tracking-widest text-primary-soft">
                        Pilih Bulan
                    </label>
                    <input type="month" v-model="filterBulan" @change="muatData"
                        class="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-primary/60" />
                </div>
            </div>
        </header>

        <div class="page-body max-w-3xl">

            <!-- Loading -->
            <div v-if="isLoading" class="empty-state">
                <div class="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary"></div>
                <p class="text-sm font-bold text-ink">Memuat data laporan...</p>
            </div>

            <template v-else>

                <!-- ===== SECTION 1: Ringkasan Bisnis ===== -->
                <section aria-labelledby="ringkasan-title">
                    <h2 id="ringkasan-title" class="section-title">Ringkasan Bisnis</h2>
                    <p class="section-desc">Angka utama yang menunjukkan kondisi usahamu pada periode ini.</p>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <!-- Total Penjualan -->
                        <div class="card p-4 sm:p-5">
                            <div class="mb-3 flex items-center gap-2.5">
                                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total Penjualan (Omzet)</p>
                            </div>
                            <p class="text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
                                Rp {{ fmtRingkas(ringkasan.totalPenjualan) }}
                            </p>
                            <p class="mt-1.5 text-[11px] font-medium text-ink-muted">Total nilai penjualan yang tercatat pada periode ini.</p>
                            <p v-if="bandingkanPenjualan !== null" class="mt-1.5 text-[11px] font-semibold tabular-nums"
                                :class="bandingkanPenjualan >= 0 ? 'text-success' : 'text-danger'">
                                {{ bandingkanPenjualan >= 0 ? '▲' : '▼' }} {{ Math.abs(bandingkanPenjualan).toFixed(1) }}% vs periode sebelumnya
                            </p>
                        </div>

                        <!-- Keuntungan Kotor -->
                        <div class="card p-4 sm:p-5">
                            <div class="mb-3 flex items-center gap-2.5">
                                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Keuntungan Kotor</p>
                            </div>
                            <p class="text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                                :class="ringkasan.keuntunganKotor < 0 ? 'text-danger' : 'text-ink'">
                                Rp {{ fmtRingkas(ringkasan.keuntunganKotor) }}
                            </p>
                            <p class="mt-1.5 text-[11px] font-medium text-ink-muted">Sisa penjualan setelah dikurangi modal barang yang terjual.</p>
                            <p v-if="bandingkanKotor !== null" class="mt-1.5 text-[11px] font-semibold tabular-nums"
                                :class="bandingkanKotor >= 0 ? 'text-success' : 'text-danger'">
                                {{ bandingkanKotor >= 0 ? '▲' : '▼' }} {{ Math.abs(bandingkanKotor).toFixed(1) }}% vs periode sebelumnya
                            </p>
                        </div>

                        <!-- Biaya Operasional -->
                        <div class="card p-4 sm:p-5">
                            <div class="mb-3 flex items-center gap-2.5">
                                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Biaya Operasional</p>
                            </div>
                            <p class="text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">
                                Rp {{ fmtRingkas(ringkasan.totalBiayaOperasional) }}
                            </p>
                            <p class="mt-1.5 text-[11px] font-medium text-ink-muted">Total biaya operasional yang tercatat.</p>
                        </div>

                        <!-- Estimasi Laba Usaha -->
                        <div class="rounded-2xl border border-primary/25 bg-primary-soft p-4 shadow-sm sm:p-5">
                            <div class="mb-3 flex items-center gap-2.5">
                                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-primary-hover">Estimasi Laba Usaha</p>
                            </div>
                            <p class="text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                                :class="ringkasan.estimasiLabaUsaha < 0 ? 'text-danger' : 'text-ink'">
                                Rp {{ fmtRingkas(ringkasan.estimasiLabaUsaha) }}
                            </p>
                            <p class="mt-1.5 text-[11px] font-medium text-ink-muted">Hasil penjualan setelah dikurangi HPP dan biaya operasional.</p>
                            <p v-if="ringkasan.totalPenjualan > 0" class="mt-1.5 text-[11px] font-semibold tabular-nums text-primary-hover">
                                Margin: {{ ringkasan.marginKeuntungan.toFixed(1) }}%
                            </p>
                        </div>
                    </div>
                </section>

                <!-- ===== SECTION 2: Laporan Keuntungan ===== -->
                <section aria-labelledby="keuntungan-title">
                    <h2 id="keuntungan-title" class="section-title">Keuntungan Bisnis</h2>
                    <p class="section-desc">Yuk, lihat berapa keuntungan yang dihasilkan toko dari aktivitas penjualan dan biaya operasional.</p>

                    <!-- Alur perhitungan -->
                    <div class="card p-4 sm:p-5">
                        <div class="flex flex-col gap-0">
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">1</span>
                                    <span class="text-sm font-semibold text-ink">Total Penjualan (Omzet)</span>
                                </div>
                                <span class="text-sm font-bold tabular-nums text-ink">Rp {{ fmtLengkap(ringkasan.totalPenjualan) }}</span>
                            </div>
                            <div class="ml-3 border-l-2 border-dashed border-border pl-4 text-[11px] text-ink-muted">↓ Dikurangi HPP</div>
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent">2</span>
                                    <span class="text-sm font-semibold text-ink">Keuntungan Kotor</span>
                                </div>
                                <span class="text-sm font-bold tabular-nums"
                                    :class="ringkasan.keuntunganKotor < 0 ? 'text-danger' : 'text-ink'">
                                    Rp {{ fmtLengkap(ringkasan.keuntunganKotor) }}
                                </span>
                            </div>
                            <div class="ml-3 border-l-2 border-dashed border-border pl-4 text-[11px] text-ink-muted">↓ Dikurangi Biaya Operasional</div>
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">3</span>
                                    <span class="text-sm font-bold text-ink">Estimasi Laba Usaha</span>
                                </div>
                                <span class="text-base font-bold tabular-nums"
                                    :class="ringkasan.estimasiLabaUsaha < 0 ? 'text-danger' : 'text-primary-hover'">
                                    Rp {{ fmtLengkap(ringkasan.estimasiLabaUsaha) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Tabel rincian -->
                    <div class="card mt-3 overflow-hidden p-0 sm:mt-4">
                        <table class="w-full text-left text-sm">
                            <tbody class="divide-y divide-border">
                                <tr>
                                    <td class="px-4 py-2.5 font-medium text-ink">Total penjualan</td>
                                    <td class="px-4 py-2.5 text-right tabular-nums text-ink">Rp {{ fmtLengkap(ringkasan.totalPenjualan) }}</td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-2.5 font-medium text-ink">
                                        <span class="cursor-help border-b border-dotted border-ink-muted" title="Modal barang yang benar-benar terjual, diambil dari record transaksi.">HPP</span>
                                    </td>
                                    <td class="px-4 py-2.5 text-right tabular-nums text-ink">− Rp {{ fmtLengkap(ringkasan.totalHpp) }}</td>
                                </tr>
                                <tr class="bg-primary-tint">
                                    <td class="px-4 py-2.5 font-bold text-ink">Keuntungan kotor</td>
                                    <td class="px-4 py-2.5 text-right font-bold tabular-nums"
                                        :class="ringkasan.keuntunganKotor < 0 ? 'text-danger' : 'text-ink'">
                                        Rp {{ fmtLengkap(ringkasan.keuntunganKotor) }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-4 py-2.5 font-medium text-ink">
                                        <span class="cursor-help border-b border-dotted border-ink-muted" title="Biaya yang tercatat pada periode tersebut (pemasaran, listrik, sewa, dll).">Biaya operasional</span>
                                    </td>
                                    <td class="px-4 py-2.5 text-right tabular-nums text-ink">− Rp {{ fmtLengkap(ringkasan.totalBiayaOperasional) }}</td>
                                </tr>
                                <tr class="bg-primary-soft">
                                    <td class="px-4 py-3 font-bold text-ink">Estimasi laba usaha</td>
                                    <td class="px-4 py-3 text-right font-bold tabular-nums"
                                        :class="ringkasan.estimasiLabaUsaha < 0 ? 'text-danger' : 'text-primary-hover'">
                                        Rp {{ fmtLengkap(ringkasan.estimasiLabaUsaha) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- ===== SECTION 3: Tren Keuntungan ===== -->
                <section aria-labelledby="tren-title">
                    <h2 id="tren-title" class="section-title">Tren Keuntungan</h2>
                    <p class="section-desc">Bagaimana perkembangan penjualan dan laba dari waktu ke waktu.</p>

                    <div class="card p-4 sm:p-5">
                        <!-- Granularity -->
                        <div class="mb-4 flex gap-2">
                            <button v-for="g in granularitas" :key="g.value" @click="granularityTren = g.value; muatData()"
                                class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                                :class="granularityTren === g.value
                                    ? 'bg-primary-strong text-white'
                                    : 'bg-surface-muted text-ink-secondary hover:bg-primary-soft'">
                                {{ g.label }}
                            </button>
                        </div>

                        <!-- Empty state -->
                        <div v-if="trenKeuntungan.length === 0" class="py-8 text-center">
                            <p class="text-sm font-semibold text-ink">Belum ada data tren</p>
                            <p class="mt-1 text-xs text-ink-muted">Data penjualan atau pengeluaran pada periode ini masih kosong.</p>
                        </div>

                        <!-- Grafik batang sederhana -->
                        <div v-else class="overflow-x-auto">
                            <div class="flex min-w-full items-end gap-1.5" style="min-height: 180px;">
                                <div v-for="row in trenKeuntungan" :key="row.periode"
                                    class="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                                    <!-- Bar laba -->
                                    <div class="flex w-full flex-col items-center gap-0.5" :style="{ height: tinggiBar(row) }">
                                        <div v-if="row.estimasiLabaUsaha > 0"
                                            class="w-full rounded-t bg-primary transition-all"
                                            :style="{ height: barHeight(row.estimasiLabaUsaha) }"
                                            :title="`Laba: Rp${row.estimasiLabaUsaha.toLocaleString('id-ID')}`"></div>
                                        <div v-if="row.estimasiLabaUsaha < 0"
                                            class="w-full rounded-t bg-danger transition-all"
                                            :style="{ height: barHeight(Math.abs(row.estimasiLabaUsaha)) }"
                                            :title="`Rugi: Rp${Math.abs(row.estimasiLabaUsaha).toLocaleString('id-ID')}`"></div>
                                    </div>
                                    <!-- Label periode -->
                                    <span class="text-[9px] font-semibold text-ink-muted">{{ formatPeriode(row.periode) }}</span>
                                </div>
                            </div>
                            <!-- Legend -->
                            <div class="mt-3 flex items-center justify-center gap-4 text-[10px] font-medium text-ink-muted">
                                <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-primary"></span> Estimasi Laba</span>
                                <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-danger"></span> Rugi</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ===== SECTION 4: Rincian Pengeluaran ===== -->
                <section aria-labelledby="pengeluaran-title">
                    <h2 id="pengeluaran-title" class="section-title">Rincian Pengeluaran</h2>
                    <p class="section-desc">Ke mana saja uang bisnis digunakan untuk biaya operasional.</p>

                    <div class="card p-4 sm:p-5">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total Biaya Operasional</p>
                                <p class="text-xl font-bold tabular-nums text-ink">Rp {{ fmtRingkas(ringkasan.totalBiayaOperasional) }}</p>
                            </div>
                            <div v-if="kategoriTerbesar" class="text-right">
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Terbesar</p>
                                <p class="text-sm font-bold text-ink">{{ labelJenis(kategoriTerbesar.jenis) }}</p>
                                <p class="text-[11px] font-semibold tabular-nums text-danger">Rp {{ fmtRingkas(kategoriTerbesar.total) }}</p>
                            </div>
                        </div>

                        <div v-if="daftarKategoriBiaya.length === 0" class="py-6 text-center">
                            <p class="text-sm font-semibold text-ink">Belum ada pengeluaran tercatat</p>
                            <p class="mt-1 text-xs text-ink-muted">Pengeluaran operasional pada periode ini masih kosong.</p>
                        </div>

                        <div v-else class="space-y-3">
                            <div v-for="kat in daftarKategoriBiaya" :key="kat.jenis">
                                <div class="mb-1 flex items-center justify-between text-xs">
                                    <span class="font-semibold text-ink">{{ labelJenis(kat.jenis) }}</span>
                                    <span class="font-bold tabular-nums text-ink">Rp {{ fmtRingkas(kat.total) }}</span>
                                </div>
                                <div class="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                                    <div class="h-full rounded-full bg-primary transition-all"
                                        :style="{ width: kat.persentase + '%' }"></div>
                                </div>
                                <p class="mt-0.5 text-[10px] font-medium tabular-nums text-ink-muted">{{ kat.persentase.toFixed(1) }}%</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ===== SECTION 5: Analisis Produk ===== -->
                <section v-if="statistikProduk.terlaris || statistikProduk.palingSepi" aria-labelledby="produk-title">
                    <h2 id="produk-title" class="section-title">Analisis Produk</h2>
                    <p class="section-desc">Produk mana yang paling laku dan mana yang kurang diminati.</p>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <!-- Paling banyak terjual -->
                        <div v-if="statistikProduk.terlaris" class="card p-4 sm:p-5">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-xs">🏆</span>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Paling Banyak Terjual</p>
                            </div>
                            <p class="text-base font-bold text-ink">{{ statistikProduk.terlaris.nama }}</p>
                            <p class="mt-1 text-sm font-semibold tabular-nums text-primary-hover">{{ statistikProduk.terlaris.qty }} unit terjual</p>
                        </div>

                        <!-- Kontribusi penjualan terbesar -->
                        <div v-if="statistikProduk.kontribusiTertinggi" class="card p-4 sm:p-5">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-xs">💰</span>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Kontribusi Penjualan Terbesar</p>
                            </div>
                            <p class="text-base font-bold text-ink">{{ statistikProduk.kontribusiTertinggi.nama }}</p>
                            <p class="mt-1 text-sm font-semibold tabular-nums text-primary-hover">Rp {{ fmtRingkas(statistikProduk.kontribusiTertinggi.nilaiPenjualan) }}</p>
                        </div>

                        <!-- Paling sepi -->
                        <div v-if="statistikProduk.palingSepi && statistikProduk.palingSepi.id !== statistikProduk.terlaris?.id" class="card p-4 sm:p-5 sm:col-span-2">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-soft text-xs">📉</span>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Penjualan Paling Rendah</p>
                            </div>
                            <p class="text-base font-bold text-ink">{{ statistikProduk.palingSepi.nama }}</p>
                            <p class="mt-1 text-sm font-semibold tabular-nums text-warning">{{ statistikProduk.palingSepi.qty }} unit terjual</p>
                        </div>
                    </div>
                </section>

                <!-- ===== SECTION 6: Widget Arus Kas ===== -->
                <section aria-labelledby="kas-title">
                    <h2 id="kas-title" class="section-title">Arus Kas Toko</h2>
                    <p class="section-desc">Lihat berapa uang yang masuk dan keluar dari bisnismu.</p>

                    <div class="rounded-2xl border border-accent/20 bg-accent-tint p-4 shadow-sm sm:p-5">
                        <div class="mb-4 grid grid-cols-3 gap-3">
                            <!-- Kas Masuk -->
                            <div class="text-center">
                                <p class="text-[10px] font-bold uppercase tracking-widest text-success">Kas Masuk</p>
                                <p class="mt-1 text-sm font-bold tabular-nums text-success sm:text-base">
                                    Rp {{ fmtRingkas(arusKas.totals.kasMasuk) }}
                                </p>
                                <span class="mt-1 inline-block text-success">▲</span>
                            </div>
                            <!-- Kas Keluar -->
                            <div class="text-center">
                                <p class="text-[10px] font-bold uppercase tracking-widest text-danger">Kas Keluar</p>
                                <p class="mt-1 text-sm font-bold tabular-nums text-danger sm:text-base">
                                    Rp {{ fmtRingkas(arusKas.totals.kasKeluar) }}
                                </p>
                                <span class="mt-1 inline-block text-danger">▼</span>
                            </div>
                            <!-- Arus Kas Bersih -->
                            <div class="text-center">
                                <p class="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Arus Kas Bersih</p>
                                <p class="mt-1 text-sm font-bold tabular-nums sm:text-base"
                                    :class="arusKas.totals.arusKasBersih > 0 ? 'text-success'
                                        : arusKas.totals.arusKasBersih < 0 ? 'text-danger' : 'text-ink-muted'">
                                    {{ arusKas.totals.arusKasBersih >= 0 ? '+' : '−' }}Rp {{ fmtRingkas(Math.abs(arusKas.totals.arusKasBersih)) }}
                                </p>
                            </div>
                        </div>

                        <p class="mb-4 text-center text-xs font-medium"
                            :class="arusKas.totals.arusKasBersih > 0 ? 'text-success'
                                : arusKas.totals.arusKasBersih < 0 ? 'text-danger' : 'text-ink-muted'">
                            {{ pesanArusKas }}
                        </p>

                        <!-- Saldo ringkas -->
                        <div v-if="arusKas.totals.saldoAwalTersedia" class="space-y-1.5 border-t border-accent/15 pt-3 text-xs">
                            <div class="flex justify-between">
                                <span class="text-ink-secondary">Saldo awal</span>
                                <span class="font-semibold tabular-nums text-ink">Rp {{ fmtLengkap(arusKas.totals.saldoAwal) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-ink-secondary">Estimasi saldo akhir</span>
                                <span class="font-bold tabular-nums"
                                    :class="arusKas.totals.saldoAkhir >= 0 ? 'text-ink' : 'text-danger'">
                                    Rp {{ fmtLengkap(arusKas.totals.saldoAkhir) }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="border-t border-accent/15 pt-3 text-center text-[11px] font-medium text-ink-muted">
                            Atur saldo awal untuk mengetahui estimasi saldo kas toko.
                        </div>

                        <!-- Link riwayat -->
                        <RouterLink to="/cash-flow"
                            class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-hover active:scale-[0.99]">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Lihat Riwayat Kas
                        </RouterLink>
                    </div>
                </section>

                <!-- ===== Tombol Export ===== -->
                <div class="mt-2 grid grid-cols-2 gap-3 sm:gap-4">
                    <button @click="eksporLabaRugi" :disabled="isLoading" class="btn-secondary rounded-2xl">
                        <svg class="h-5 w-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Unduh PDF</span>
                    </button>
                    <button @click="downloadExcel" :disabled="isLoading" class="btn-primary rounded-2xl">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Unduh Excel</span>
                    </button>
                </div>

                <!-- Disclaimer arus kas -->
                <p class="mt-2 text-center text-[10px] leading-relaxed text-ink-muted">
                    Catatan arus kas direkonstruksi dari pencatatan penjualan & pengeluaran dengan asumsi telah dibayar
                    pada tanggal transaksi. Ini bukan rekonsiliasi rekening bank.
                </p>

            </template>

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
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAndSharePDF } from '../utils/pdfHandler';
import { exportLabaRugiExcel } from '../utils/excelHandler';
import { useToast } from '../composables/useToast';
import { useStoreProfile } from '../composables/useStoreProfile';
import { getRingkasanKeuntungan, getTrenKeuntungan, hitungStatistikProduk, getPenjualanRange } from '../services/profitReportService';
import { getArusKasPeriode } from '../services/cashFlowService';
import { EXPENSE_CATEGORY_LABELS } from '../constants/expenseCategories';

const { storeProfile } = useStoreProfile();
const tipePeriode = ref('bulan');
const filterBulan = ref(dayjs().format('YYYY-MM'));
const { showToast } = useToast();
const isLoading = ref(true);

const ringkasan = ref({
    totalPenjualan: 0, totalHpp: 0, keuntunganKotor: 0,
    totalBiayaOperasional: 0, estimasiLabaUsaha: 0, marginKeuntungan: 0,
    biayaPerKategori: {}
});
const ringkasanSebelumnya = ref(null);
const trenKeuntungan = ref([]);
const granularityTren = ref('bulan');
const granularitas = [
    { value: 'hari', label: 'Harian' },
    { value: 'minggu', label: 'Mingguan' },
    { value: 'bulan', label: 'Bulanan' }
];
const statistikProduk = ref({ terlaris: null, kontribusiTertinggi: null, palingSepi: null });
const arusKas = ref({
    entries: [],
    totals: { kasMasuk: 0, kasKeluar: 0, arusKasBersih: 0, saldoAwal: 0, saldoAkhir: null, saldoAwalTersedia: false }
});

/* ---- Format helpers ---- */
const fmtRingkas = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
    if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' jt';
    if (abs >= 1_000) return Math.round(n / 1_000) + ' rb';
    return Math.round(n).toLocaleString('id-ID');
};
const fmtLengkap = (n) => Math.round(n).toLocaleString('id-ID');

const labelJenis = (jenis) => EXPENSE_CATEGORY_LABELS[jenis] || jenis;

const formatPeriode = (p) => {
    if (p.length === 7) return dayjs(p + '-01').format('MMM YY');
    if (p.length === 10) return dayjs(p).format('DD/MM');
    return p;
};

/* ---- Derived ---- */
const kategoriBiayaArr = computed(() =>
    Object.entries(ringkasan.value.biayaPerKategori || {})
        .map(([jenis, total]) => ({
            jenis, total,
            persentase: ringkasan.value.totalBiayaOperasional > 0
                ? (total / ringkasan.value.totalBiayaOperasional) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
);
const daftarKategoriBiaya = computed(() => kategoriBiayaArr.value);
const kategoriTerbesar = computed(() => kategoriBiayaArr.value[0] || null);

const bandingkanPenjualan = computed(() => {
    const prev = ringkasanSebelumnya.value;
    if (!prev || prev.totalPenjualan <= 0) return null;
    return ((ringkasan.value.totalPenjualan - prev.totalPenjualan) / prev.totalPenjualan) * 100;
});
const bandingkanKotor = computed(() => {
    const prev = ringkasanSebelumnya.value;
    if (!prev || prev.keuntunganKotor <= 0) return null;
    return ((ringkasan.value.keuntunganKotor - prev.keuntunganKotor) / prev.keuntunganKotor) * 100;
});

const pesanArusKas = computed(() => {
    const n = arusKas.value.totals.arusKasBersih;
    if (n > 0) return 'Kas toko bertambah pada periode ini.';
    if (n < 0) return 'Kas toko berkurang pada periode ini.';
    return 'Kas masuk dan keluar seimbang.';
});

/* ---- Tren chart ---- */
const maxTren = computed(() => {
    if (trenKeuntungan.value.length === 0) return 1;
    return Math.max(...trenKeuntungan.value.map((r) => Math.abs(r.estimasiLabaUsaha)), 1);
});
const barHeight = (nilai) => `${Math.max(4, (Math.abs(nilai) / maxTren.value) * 140)}px`;
const tinggiBar = (row) => '160px';

/* ---- Periode helpers ---- */
function getRentangPeriode(tipe, bulan) {
    if (tipe === 'bulan') {
        const start = dayjs(bulan).startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const end = dayjs(bulan).endOf('month').format('YYYY-MM-DD HH:mm:ss');
        return { start, end };
    }
    if (tipe === 'semester') {
        const start = dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const end = dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        return { start, end };
    }
    return { start: null, end: null };
}

function getRentangSebelumnya(tipe, bulan) {
    if (tipe === 'bulan') {
        const prev = dayjs(bulan).subtract(1, 'month');
        return {
            start: prev.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
            end: prev.endOf('month').format('YYYY-MM-DD HH:mm:ss')
        };
    }
    if (tipe === 'semester') {
        const start = dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const end = dayjs().subtract(6, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');
        return { start, end };
    }
    return null;
}

/* ---- Load data ---- */
const muatData = async () => {
    isLoading.value = true;
    try {
        const { start, end } = getRentangPeriode(tipePeriode.value, filterBulan.value);

        const [ringkasanBaru, tren, kas, penjualanUntukProduk] = await Promise.all([
            getRingkasanKeuntungan(start, end),
            getTrenKeuntungan(granularityTren.value, start, end),
            getArusKasPeriode(start, end),
            getPenjualanRange(start, end)
        ]);

        ringkasan.value = ringkasanBaru;
        trenKeuntungan.value = tren;
        arusKas.value = kas;
        statistikProduk.value = hitungStatistikProduk(penjualanUntukProduk);

        // Periode sebelumnya untuk perbandingan
        const rentangPrev = getRentangSebelumnya(tipePeriode.value, filterBulan.value);
        if (rentangPrev) {
            ringkasanSebelumnya.value = await getRingkasanKeuntungan(rentangPrev.start, rentangPrev.end);
        } else {
            ringkasanSebelumnya.value = null;
        }
    } catch (e) {
        console.error('Gagal memuat data dashboard:', e);
        showToast('Gagal memuat data laporan. Silakan coba lagi.', 'error');
    } finally {
        isLoading.value = false;
    }
};

/* ---- Export PDF ---- */
const eksporLabaRugi = async () => {
    const doc = new jsPDF();
    const storeName = storeProfile.value.namaToko || 'POSSuper';
    const storeAddress = storeProfile.value.alamatToko || '';
    const storePhone = storeProfile.value.noHp || '';

    let periodeText = filterBulan.value;
    if (tipePeriode.value === 'semester') periodeText = '1 Semester Terakhir';
    if (tipePeriode.value === 'semua') periodeText = 'Seluruh Waktu';

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(38, 70, 83);
    doc.text(storeName, 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 102, 97);
    let startY = 32;
    if (storeAddress) {
        doc.text(storeAddress + (storePhone ? ` | Telp/WA: ${storePhone}` : ''), 14, 24);
        startY = 40;
    }
    doc.setLineWidth(0.5);
    doc.setDrawColor(217, 230, 225);
    doc.line(14, startY - 8, 196, startY - 8);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 45, 42);
    doc.text('LAPORAN ESTIMASI LABA USAHA', 14, startY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 102, 97);
    doc.text(`Periode: ${periodeText}`, 14, startY + 6);

    const r = ringkasan.value;
    autoTable(doc, {
        startY: startY + 12,
        body: [
            ['Total Penjualan (Omzet)', `Rp ${fmtLengkap(r.totalPenjualan)}`],
            ['Dikurangi: HPP (Modal Barang Terjual)', `(Rp ${fmtLengkap(r.totalHpp)})`],
            ['Keuntungan Kotor', `Rp ${fmtLengkap(r.keuntunganKotor)}`],
            ['', ''],
            ['Dikurangi: Biaya Operasional', `(Rp ${fmtLengkap(r.totalBiayaOperasional)})`],
            ['', ''],
            ['ESTIMASI LABA USAHA', `Rp ${fmtLengkap(r.estimasiLabaUsaha)}`],
            ['', ''],
            ['Margin Keuntungan', `${r.marginKeuntungan.toFixed(1)}%`]
        ],
        theme: 'grid',
        styles: { fontSize: 12 },
        willDrawCell: (data) => {
            if (data.row.index === 6) {
                doc.setFont(undefined, 'bold');
                doc.setTextColor(r.estimasiLabaUsaha >= 0 ? 0 : 255, r.estimasiLabaUsaha >= 0 ? 128 : 0, 0);
            }
        }
    });

    const safeStore = storeName.replace(/[^a-zA-Z0-9]/g, '_');
    let filename = `Laporan_Laba_${safeStore}_${filterBulan.value}.pdf`;
    if (tipePeriode.value === 'semester') filename = `Laporan_Laba_${safeStore}_1_Semester.pdf`;
    if (tipePeriode.value === 'semua') filename = `Laporan_Laba_${safeStore}_Seluruh_Waktu.pdf`;
    await saveAndSharePDF(doc, filename);
};

const downloadExcel = async () => {
    if (tipePeriode.value === 'bulan' && !filterBulan.value) {
        showToast('Pilih bulan terlebih dahulu', 'warning');
        return;
    }
    isLoading.value = true;
    try {
        let periodeArg = filterBulan.value;
        if (tipePeriode.value === 'semester') periodeArg = '1 Semester Terakhir';
        if (tipePeriode.value === 'semua') periodeArg = 'Seluruh Waktu';
        await exportLabaRugiExcel(periodeArg);
    } catch (error) {
        showToast('Terjadi kesalahan saat mengunduh laporan.', 'error');
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => { muatData(); });
</script>
