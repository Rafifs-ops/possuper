/**
 * Unit test untuk perhitungan laporan keuntungan & arus kas POSSuper.
 * Jalankan: node --experimental-loader ./tests/esm-loader.mjs tests/financialReport.test.js
 */
import { hitungLaporanKeuntungan, filterPengeluaranByRange, hitungBiayaPerKategori, hitungStatistikProduk } from '../src/services/profitReportService.js';
import {
    TIPE_KAS, penjualanToCashEntries, pengeluaranToCashEntries, kasManualToCashEntries,
    mergeCashFlowEntries, filterCashFlowEntries, hitungTotalArusKas, hitungRunningBalance
} from '../src/services/cashFlowService.js';

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, label) {
    if (actual === expected) {
        passed++;
    } else {
        failed++;
        console.error(`FAIL: ${label}\n  expected: ${expected}\n  actual:   ${actual}`);
    }
}

function assertClose(actual, expected, label, tolerance = 0.001) {
    if (Math.abs(actual - expected) < tolerance) {
        passed++;
    } else {
        failed++;
        console.error(`FAIL: ${label}\n  expected: ~${expected}\n  actual:   ${actual}`);
    }
}

function assertTrue(val, label) {
    if (val) { passed++; } else { failed++; console.error(`FAIL: ${label}`); }
}

/* ================================================================
   TEST 1: Laporan Keuntungan (contoh dari spec)
   Penjualan Rp15.000.000, HPP Rp8.000.000, Biaya Rp2.500.000
   → Kotor Rp7.000.000, Laba Rp4.500.000, Margin 30%
   ================================================================ */
console.log('--- Test: Laporan Keuntungan ---');

const penjualan1 = [
    { id: 1, totalPenjualan: 10000000, totalHpp: 5500000, items: [] },
    { id: 2, totalPenjualan: 5000000, totalHpp: 2500000, items: [] }
];
const rincian1 = [
    { id: 1, text: 'Sewa', nominal: 1000000, jenis: 'sewa', bulanTahun: '2026-10', tanggalEfektif: '2026-10-01 00:00' },
    { id: 2, text: 'Listrik', nominal: 800000, jenis: 'listrik_air_internet', bulanTahun: '2026-10', tanggalEfektif: '2026-10-15 00:00' },
    { id: 3, text: 'Pemasaran', nominal: 700000, jenis: 'pemasaran', bulanTahun: '2026-10', tanggalEfektif: '2026-10-20 00:00' }
];

const hasil1 = hitungLaporanKeuntungan(penjualan1, rincian1);
assertEqual(hasil1.totalPenjualan, 15000000, 'Total penjualan = 15.000.000');
assertEqual(hasil1.totalHpp, 8000000, 'Total HPP = 8.000.000');
assertEqual(hasil1.keuntunganKotor, 7000000, 'Keuntungan kotor = 7.000.000');
assertEqual(hasil1.totalBiayaOperasional, 2500000, 'Biaya operasional = 2.500.000');
assertEqual(hasil1.estimasiLabaUsaha, 4500000, 'Estimasi laba usaha = 4.500.000');
assertClose(hasil1.marginKeuntungan, 30, 'Margin keuntungan = 30%');

/* ================================================================
   TEST 2: Margin dengan penjualan nol (tidak boleh divide by zero)
   ================================================================ */
console.log('--- Test: Margin nol ---');

const hasil2 = hitungLaporanKeuntungan([], []);
assertEqual(hasil2.marginKeuntungan, 0, 'Margin = 0 jika penjualan nol');
assertEqual(hasil2.estimasiLabaUsaha, 0, 'Laba = 0 jika tidak ada data');

/* ================================================================
   TEST 3: Filter pengeluaran by range tanggal
   ================================================================ */
console.log('--- Test: Filter pengeluaran ---');

const recordsPengeluaran = [
    {
        id: 1, bulanTahun: '2026-10', jenis: 'sewa', nominal: 1500000,
        keterangan: [
            { id: 10, text: 'Sewa Oktober', nominal: 1000000, tanggal: '2026-10-01 09:00' },
            { id: 11, text: 'Sewa tambahan', nominal: 500000, tanggal: '2026-10-15 09:00' }
        ]
    },
    {
        id: 2, bulanTahun: '2026-11', jenis: 'pemasaran', nominal: 700000,
        keterangan: [
            { id: 20, text: 'Iklan November', nominal: 700000, tanggal: '2026-11-05 09:00' }
        ]
    },
    {
        // Data lama tanpa tanggal di keterangan — fallback ke bulanTahun
        id: 3, bulanTahun: '2026-10', jenis: 'admin', nominal: 300000,
        keterangan: [
            { id: 30, text: 'Biaya admin', nominal: 300000 }
        ]
    }
];

const filteredOkt = filterPengeluaranByRange(recordsPengeluaran, '2026-10-01 00:00:00', '2026-10-31 23:59:59');
assertEqual(filteredOkt.length, 3, 'Filter Oktober: 3 rincian (2 sewa + 1 admin fallback)');
const totalOkt = filteredOkt.reduce((s, r) => s + r.nominal, 0);
assertEqual(totalOkt, 1800000, 'Total Oktober = 1.800.000');

const filteredNov = filterPengeluaranByRange(recordsPengeluaran, '2026-11-01 00:00:00', '2026-11-30 23:59:59');
assertEqual(filteredNov.length, 1, 'Filter November: 1 rincian');
assertEqual(filteredNov[0].nominal, 700000, 'Nominal November = 700.000');

/* ================================================================
   TEST 4: Hitung biaya per kategori
   ================================================================ */
console.log('--- Test: Biaya per kategori ---');

const perKat = hitungBiayaPerKategori(filteredOkt);
assertEqual(perKat.sewa, 1500000, 'Biaya sewa = 1.500.000');
assertEqual(perKat.admin, 300000, 'Biaya admin = 300.000');

/* ================================================================
   TEST 5: Statistik produk
   ================================================================ */
console.log('--- Test: Statistik produk ---');

const penjualanProduk = [
    {
        id: 1, totalPenjualan: 100000, totalHpp: 50000,
        items: [
            { id: 'A', nama: 'Kopi', harga: 10000, quantity: 5 },
            { id: 'B', nama: 'Teh', harga: 5000, quantity: 10 }
        ]
    },
    {
        id: 2, totalPenjualan: 30000, totalHpp: 15000,
        items: [
            { id: 'A', nama: 'Kopi', harga: 10000, quantity: 3 }
        ]
    }
];
const statProduk = hitungStatistikProduk(penjualanProduk);
// A: 5+3=8 qty, nilai 5*10k+3*10k=80k; B: 10 qty, nilai 10*5k=50k
assertEqual(statProduk.terlaris.id, 'B', 'Terlaris = B (qty 10)');
assertEqual(statProduk.palingSepi.id, 'A', 'Paling sepi = A (qty 8)');
assertEqual(statProduk.kontribusiTertinggi.id, 'A', 'Kontribusi tertinggi = A (80.000)');

/* ================================================================
   TEST 6: Konversi penjualan → kas masuk
   ================================================================ */
console.log('--- Test: Konversi penjualan → cash entries ---');

const penjualanCash = penjualanToCashEntries([
    { id: 1, tanggal: '2026-10-15 10:30:00', totalPenjualan: 250000, totalHpp: 100000 }
]);
assertEqual(penjualanCash.length, 1, '1 entry dari 1 penjualan');
assertEqual(penjualanCash[0].tipe, TIPE_KAS.MASUK, 'Tipe = masuk');
assertEqual(penjualanCash[0].nominal, 250000, 'Nominal = 250.000');
assertEqual(penjualanCash[0].sumber, 'penjualan', 'Sumber = penjualan');
assertEqual(penjualanCash[0].aktivitas, 'operasi', 'Aktivitas = operasi');

/* ================================================================
   TEST 7: Konversi pengeluaran → kas keluar
   ================================================================ */
console.log('--- Test: Konversi pengeluaran → cash entries ---');

const pengeluaranCash = pengeluaranToCashEntries([
    { id: 10, text: 'Sewa', nominal: 500000, jenis: 'sewa', bulanTahun: '2026-10', tanggalEfektif: '2026-10-01 09:00' }
]);
assertEqual(pengeluaranCash.length, 1, '1 entry dari 1 rincian pengeluaran');
assertEqual(pengeluaranCash[0].tipe, TIPE_KAS.KELUAR, 'Tipe = keluar');
assertEqual(pengeluaranCash[0].nominal, 500000, 'Nominal = 500.000');
assertEqual(pengeluaranCash[0].aktivitas, 'operasi', 'Aktivitas = operasi');

/* ================================================================
   TEST 8: Konversi kas manual
   ================================================================ */
console.log('--- Test: Konversi kas manual ---');

const manualCash = kasManualToCashEntries([
    { id: 1, tanggal: '2026-10-20 14:00:00', tipe: 'masuk', aktivitas: 'pendanaan', kategori: 'modal_pemilik', keterangan: 'Modal', nominal: 1000000 }
]);
assertEqual(manualCash[0].tipe, 'masuk', 'Tipe = masuk');
assertEqual(manualCash[0].aktivitas, 'pendanaan', 'Aktivitas = pendanaan');
assertEqual(manualCash[0].sumber, 'manual', 'Sumber = manual');

/* ================================================================
   TEST 9: Arus kas — contoh lengkap dari spec
   Saldo awal 2jt, masuk: penjualan 5jt + modal 1jt, keluar: ops 1jt + stok 2jt
   → masuk 6jt, keluar 3jt, bersih +3jt, saldo akhir 5jt
   ================================================================ */
console.log('--- Test: Arus kas lengkap ---');

const penjualanEntries = penjualanToCashEntries([
    { id: 1, tanggal: '2026-10-05 10:00:00', totalPenjualan: 5000000, totalHpp: 2000000 }
]);
const pengeluaranEntries = pengeluaranToCashEntries([
    { id: 1, text: 'Listrik', nominal: 1000000, jenis: 'listrik_air_internet', bulanTahun: '2026-10', tanggalEfektif: '2026-10-10 09:00' }
]);
const manualEntries = kasManualToCashEntries([
    { id: 1, tanggal: '2026-10-15 14:00:00', tipe: 'masuk', aktivitas: 'pendanaan', kategori: 'modal_pemilik', keterangan: 'Modal', nominal: 1000000 },
    { id: 2, tanggal: '2026-10-20 11:00:00', tipe: 'keluar', aktivitas: 'operasi', kategori: 'pembelian_persediaan', keterangan: 'Beli stok', nominal: 2000000 }
]);

const merged = mergeCashFlowEntries({
    penjualanEntries,
    pengeluaranEntries,
    manualEntries,
    saldoAwal: { saldoAwal: 2000000 }
});
assertEqual(merged.length, 4, 'Total 4 entry');
const totals = hitungTotalArusKas(merged);
assertEqual(totals.kasMasuk, 6000000, 'Kas masuk = 6.000.000');
assertEqual(totals.kasKeluar, 3000000, 'Kas keluar = 3.000.000');
assertEqual(totals.arusKasBersih, 3000000, 'Arus kas bersih = +3.000.000');

const saldoAkhir = 2000000 + totals.arusKasBersih;
assertEqual(saldoAkhir, 5000000, 'Estimasi saldo akhir = 5.000.000');

/* ================================================================
   TEST 10: Running balance
   ================================================================ */
console.log('--- Test: Running balance ---');

const withBalance = hitungRunningBalance(merged, 2000000);
// Urutan kronologis: 5 Okt (+5jt), 10 Okt (-1jt), 15 Okt (+1jt), 20 Okt (-2jt)
// Running: 7jt, 6jt, 7jt, 5jt
assertEqual(withBalance[0].runningBalance, 7000000, 'Balance setelah penjualan = 7.000.000');
assertEqual(withBalance[1].runningBalance, 6000000, 'Balance setelah listrik = 6.000.000');
assertEqual(withBalance[2].runningBalance, 7000000, 'Balance setelah modal = 7.000.000');
assertEqual(withBalance[3].runningBalance, 5000000, 'Balance setelah beli stok = 5.000.000');

/* ================================================================
   TEST 11: Filter cash flow
   ================================================================ */
console.log('--- Test: Filter cash flow ---');

const filteredMasuk = filterCashFlowEntries(merged, { tipe: 'masuk' });
assertEqual(filteredMasuk.length, 2, 'Filter masuk: 2 entry');

const filteredOperasi = filterCashFlowEntries(merged, { aktivitas: 'operasi' });
assertEqual(filteredOperasi.length, 3, 'Filter operasi: 3 entry (penjualan + listrik + beli stok)');

const filteredSearch = filterCashFlowEntries(merged, { search: 'stok' });
assertEqual(filteredSearch.length, 1, 'Search "stok": 1 entry');

/* ================================================================
   TEST 12: Perbedaan laba vs kas — pembelian stok belum terjual
   ================================================================ */
console.log('--- Test: Laba ≠ Kas ---');

// Pembelian stok Rp2jt, barang belum terjual, tidak ada penjualan
const penjualanKosong = [];
const rincianKosong = [];
const manualBeliStok = kasManualToCashEntries([
    { id: 1, tanggal: '2026-10-20 11:00:00', tipe: 'keluar', aktivitas: 'operasi', kategori: 'pembelian_persediaan', keterangan: 'Beli stok', nominal: 2000000 }
]);

const labaKosong = hitungLaporanKeuntungan(penjualanKosong, rincianKosong);
assertEqual(labaKosong.estimasiLabaUsaha, 0, 'Laba = 0 (tidak ada penjualan)');

const kasBeliStok = hitungTotalArusKas(manualBeliStok);
assertEqual(kasBeliStok.kasKeluar, 2000000, 'Kas keluar = 2.000.000 (pembelian stok)');
assertEqual(kasBeliStok.arusKasBersih, -2000000, 'Arus kas bersih = -2.000.000');
// Laba tidak otomatis berkurang 2jt sebagai HPP
assertEqual(labaKosong.estimasiLabaUsaha, 0, 'Laba tidak berkurang oleh pembelian stok yang belum terjual');

/* ================================================================
   Ringkasan
   ================================================================ */
console.log(`\n=== HASIL: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
