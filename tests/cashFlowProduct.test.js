/**
 * Unit test integrasi produk baru → kas keluar (arus kas) POSSuper.
 * Jalankan: node --experimental-loader ./tests/esm-loader.mjs tests/cashFlowProduct.test.js
 */
import {
    hitungNilaiStokAwal,
    hitungNilaiPersediaan,
    buildPembelianStokAwalEntry,
    buildPenambahanStokEntry,
    kasManualToCashEntries,
    mergeCashFlowEntries,
    hitungTotalArusKas,
    hitungRunningBalance,
    SUMBER_TRANSAKSI
} from '../src/services/cashFlowService.js';
import { hitungLaporanKeuntungan } from '../src/services/profitReportService.js';

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

function assertTrue(val, label) {
    if (val) { passed++; } else { failed++; console.error(`FAIL: ${label}`); }
}

/* ================================================================
   TEST 1: Rumus nilai stok awal (quantity × HPP)
   ================================================================ */
console.log('--- Test: Nilai stok awal ---');

assertEqual(hitungNilaiStokAwal(10, 3000), 30000, '10 unit × Rp3.000 = Rp30.000');
assertEqual(hitungNilaiStokAwal(0, 3000), 0, 'Quantity 0 → tidak ada kas keluar');
assertEqual(hitungNilaiStokAwal(10, 0), 0, 'HPP 0 → tidak ada kas keluar');
assertEqual(hitungNilaiStokAwal(-2, 3000), 0, 'Quantity negatif tidak menghasilkan nominal negatif');
assertEqual(hitungNilaiStokAwal('10', '3000'), 30000, 'Nilai string dari form tetap dihitung');
assertEqual(hitungNilaiStokAwal(3, 1000.4), 3001, 'Nominal dibulatkan ke rupiah');

/* ================================================================
   TEST 2: Record kasManual untuk pembelian stok awal
   ================================================================ */
console.log('--- Test: Record kas pembelian stok awal ---');

const kopi = { id: '8990001', nama: 'Kopi Sachet', harga: 5000, hpp: 3000, quantity: 10 };
const entry = buildPembelianStokAwalEntry(kopi);

assertTrue(entry !== null, 'Record kas dibuat untuk nilai stok awal > 0');
assertEqual(entry.tipe, 'keluar', 'Tipe = keluar');
assertEqual(entry.aktivitas, 'operasi', 'Aktivitas = operasi');
assertEqual(entry.kategori, 'pembelian_persediaan', 'Kategori = pembelian_persediaan');
assertEqual(entry.nominal, 30000, 'Nominal = Rp30.000');
assertEqual(entry.keterangan, 'Pembelian stok awal - Kopi Sachet', 'Keterangan memuat nama produk');
assertEqual(entry.sumber, SUMBER_TRANSAKSI.PRODUK_BARU, 'Sumber = produk_baru');
assertEqual(entry.sumberId, '8990001', 'Sumber menyimpan ID/SKU produk');
assertEqual(entry.metodePembayaran, 'tunai', 'Metode pembayaran = tunai');
assertTrue(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(entry.tanggal), 'Tanggal YYYY-MM-DD HH:mm:ss');

const entryTanpaNilai = buildPembelianStokAwalEntry({ id: 'X', nama: 'Gratis', hpp: 0, quantity: 10 });
assertEqual(entryTanpaNilai, null, 'HPP 0 tidak membuat record kas');

const entryQtyNol = buildPembelianStokAwalEntry({ id: 'Y', nama: 'Kosong', hpp: 3000, quantity: 0 });
assertEqual(entryQtyNol, null, 'Quantity 0 tidak membuat record kas');

const entryTanggal = buildPembelianStokAwalEntry(kopi, '2026-11-10 15:30:00');
assertEqual(entryTanggal.tanggal, '2026-11-10 15:30:00', 'Tanggal mengikuti waktu pencatatan produk');

/* ================================================================
   TEST 3: Terbaca oleh laporan arus kas & sumbernya dikenali
   ================================================================ */
console.log('--- Test: Laporan arus kas ---');

const rows = [{ ...entry, id: 7 }];
const cashEntries = kasManualToCashEntries(rows);
assertEqual(cashEntries.length, 1, 'Satu record kas → satu entry arus kas');
assertEqual(cashEntries[0].nominal, 30000, 'Entry arus kas = Rp30.000');
assertEqual(cashEntries[0].tipe, 'keluar', 'Entry arus kas = kas keluar');
assertEqual(cashEntries[0].sumber, 'produk_baru', 'Entry ditandai sumber produk_baru');
assertEqual(cashEntries[0].sumberId, 7, 'sumberId menunjuk record kasManual');
assertEqual(cashEntries[0].produkId, '8990001', 'produkId menyimpan ID produk');

const legacyManual = kasManualToCashEntries([
    { id: 8, tanggal: '2026-11-01 09:00:00', tipe: 'masuk', aktivitas: 'pendanaan', kategori: 'modal_pemilik', keterangan: 'Modal', nominal: 500000 }
]);
assertEqual(legacyManual[0].sumber, 'manual', 'Transaksi kas manual existing tetap bersumber manual');

const merged = mergeCashFlowEntries({
    penjualanEntries: [],
    pengeluaranEntries: [],
    manualEntries: cashEntries,
    saldoAwal: { saldoAwal: 100000 }
});
const totals = hitungTotalArusKas(merged);
assertEqual(totals.kasMasuk, 0, 'Kas masuk = 0');
assertEqual(totals.kasKeluar, 30000, 'Kas keluar = Rp30.000');
assertEqual(totals.arusKasBersih, -30000, 'Arus kas bersih = −Rp30.000');

const withBalance = hitungRunningBalance(merged, 100000);
assertEqual(withBalance[0].runningBalance, 70000, 'Saldo berjalan = Rp70.000');

/* ================================================================
   TEST 4: Penambahan stok produk lama
   ================================================================ */
console.log('--- Test: Penambahan stok produk lama ---');

assertEqual(hitungNilaiPersediaan(5, 3000), 15000, '5 unit × Rp3.000 = Rp15.000');

const penambahan = buildPenambahanStokEntry(kopi, 5);
assertTrue(penambahan !== null, 'Record kas dibuat untuk penambahan stok > 0');
assertEqual(penambahan.tipe, 'keluar', 'Penambahan stok: tipe keluar');
assertEqual(penambahan.aktivitas, 'operasi', 'Penambahan stok: aktivitas operasi');
assertEqual(penambahan.kategori, 'pembelian_persediaan', 'Penambahan stok: kategori pembelian_persediaan');
assertEqual(penambahan.nominal, 15000, 'Penambahan stok: nominal Rp15.000');
assertEqual(penambahan.keterangan, 'Penambahan stok 5 - Kopi Sachet', 'Penambahan stok: keterangan memuat jumlah & nama');
assertEqual(penambahan.sumber, SUMBER_TRANSAKSI.PENAMBAHAN_STOK, 'Penambahan stok: sumber penambahan_stok');
assertEqual(penambahan.sumberId, '8990001', 'Penambahan stok: sumberId = SKU');
assertEqual(buildPenambahanStokEntry(kopi, 0), null, 'Penambahan 0 tidak membuat kas keluar');
assertEqual(buildPenambahanStokEntry(kopi, -1), null, 'Pengurangan stok tidak membuat kas keluar');
assertEqual(buildPenambahanStokEntry({ ...kopi, hpp: 0 }, 5), null, 'HPP 0 tidak membuat kas keluar');

const penambahanCash = kasManualToCashEntries([{ ...penambahan, id: 9 }]);
assertEqual(penambahanCash[0].sumber, 'penambahan_stok', 'Entry penambahan stok dikenali di arus kas');
assertEqual(penambahanCash[0].nominal, 15000, 'Entry penambahan stok = Rp15.000');

const gabungan = mergeCashFlowEntries({
    penjualanEntries: [],
    pengeluaranEntries: [],
    manualEntries: [...cashEntries, ...penambahanCash],
    saldoAwal: null
});
const totalGabungan = hitungTotalArusKas(gabungan);
assertEqual(totalGabungan.kasKeluar, 45000, 'Kas keluar gabungan produk baru + tambah stok = Rp45.000');

/* ================================================================
   TEST 5: Pembelian stok tidak mengurangi laba
   ================================================================ */
console.log('--- Test: Laba vs kas ---');

const laba = hitungLaporanKeuntungan([], []);
assertEqual(laba.totalHpp, 0, 'HPP laporan keuntungan tetap 0 (belum ada penjualan)');
assertEqual(laba.estimasiLabaUsaha, 0, 'Pembelian stok awal tidak mengurangi laba usaha');
assertEqual(totals.kasKeluar, 30000, 'Pembelian stok tetap tercatat sebagai kas keluar');

/* ================================================================
   Ringkasan
   ================================================================ */
console.log(`\n=== HASIL: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
