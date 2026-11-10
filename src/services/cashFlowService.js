import { db } from '../database/db';
import dayjs from 'dayjs';

/**
 * Cash flow service — arus kas toko (metode langsung).
 *
 * Sumber arus kas otomatis:
 * - Penjualan → kas masuk (asumsi: dibayar pada tanggal transaksi).
 * - Rincian pengeluaran → kas keluar (asumsi: dibayar pada tanggal pencatatan;
 *   fallback ke bulanTahun bila tanggal rincian tidak tersedia).
 *
 * Transaksi kas manual (modal, pembelian stok/aset, pinjaman, dll.) dicatat
 * terpisah di tabel `kasManual` sehingga tidak ada duplikasi.
 */

/* ------------------------------------------------------------------ */
/* Konstanta                                                           */
/* ------------------------------------------------------------------ */

export const TIPE_KAS = { MASUK: 'masuk', KELUAR: 'keluar' };

export const AKTIVITAS_KAS = {
    OPERASI: 'operasi',
    INVESTASI: 'investasi',
    PENDANAAN: 'pendanaan'
};

export const AKTIVITAS_LABELS = {
    operasi: 'Operasi',
    investasi: 'Investasi',
    pendanaan: 'Pendanaan'
};

export const SUMBER_TRANSAKSI = {
    PENJUALAN: 'penjualan',
    PENGELUARAN: 'pengeluaran',
    MANUAL: 'manual',
    PRODUK_BARU: 'produk_baru',
    PENAMBAHAN_STOK: 'penambahan_stok'
};

export const SUMBER_LABELS = {
    penjualan: 'Penjualan',
    pengeluaran: 'Pengeluaran',
    manual: 'Manual',
    produk_baru: 'Pembelian Stok',
    penambahan_stok: 'Penambahan Stok'
};

/** Sumber kas otomatis yang tetap disimpan di tabel kasManual. */
const SUMBER_KAS_OTOMATIS = [SUMBER_TRANSAKSI.PRODUK_BARU, SUMBER_TRANSAKSI.PENAMBAHAN_STOK];

/** Kategori transaksi kas manual per tipe dan aktivitas. */
export const KATEGORI_KAS_MANUAL = {
    masuk: {
        operasi: [
            { value: 'penerimaan_lain', label: 'Penerimaan lain-lain' }
        ],
        investasi: [
            { value: 'penjualan_aset', label: 'Penjualan aset' }
        ],
        pendanaan: [
            { value: 'modal_pemilik', label: 'Tambahan modal pemilik' },
            { value: 'pinjaman_diterima', label: 'Pinjaman diterima' }
        ]
    },
    keluar: {
        operasi: [
            { value: 'pembelian_persediaan', label: 'Pembelian persediaan' },
            { value: 'pengeluaran_lain', label: 'Pengeluaran lainnya' }
        ],
        investasi: [
            { value: 'pembelian_peralatan', label: 'Pembelian peralatan toko' },
            { value: 'pembelian_mesin', label: 'Pembelian mesin' },
            { value: 'pembelian_aset_jangka_panjang', label: 'Pembelian aset jangka panjang' }
        ],
        pendanaan: [
            { value: 'pembayaran_pokok_pinjaman', label: 'Pembayaran pokok pinjaman' },
            { value: 'pengambilan_uang_pemilik', label: 'Pengambilan uang pemilik' }
        ]
    }
};

/* ------------------------------------------------------------------ */
/* Saldo awal kas                                                      */
/* ------------------------------------------------------------------ */

/** Ambil konfigurasi saldo awal kas (id=1). Mengembalikan null bila belum diatur. */
export async function getSaldoAwalKas() {
    try {
        return (await db.saldoAwalKas.get(1)) || null;
    } catch (e) {
        console.error('Gagal membaca saldo awal kas:', e);
        return null;
    }
}

/** Simpan/perbarui saldo awal kas (id selalu 1). */
export async function simpanSaldoAwalKas({ saldoAwal, berlakuSejak }) {
    const payload = {
        id: 1,
        saldoAwal: Number(saldoAwal) || 0,
        berlakuSejak: berlakuSejak || dayjs().format('YYYY-MM-DD'),
        updatedAt: new Date().toISOString()
    };
    await db.saldoAwalKas.put(payload);
    return payload;
}

/* ------------------------------------------------------------------ */
/* Transaksi kas manual (CRUD)                                         */
/* ------------------------------------------------------------------ */

export async function getKasManualList() {
    return db.kasManual.toArray();
}

export async function tambahKasManual(data) {
    const payload = {
        tanggal: data.tanggal || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipe: data.tipe === TIPE_KAS.MASUK ? TIPE_KAS.MASUK : TIPE_KAS.KELUAR,
        aktivitas: data.aktivitas || AKTIVITAS_KAS.OPERASI,
        kategori: data.kategori || 'pengeluaran_lain',
        keterangan: (data.keterangan || '').trim() || 'Transaksi kas',
        nominal: Number(data.nominal) || 0,
        metodePembayaran: (data.metodePembayaran || '').trim(),
        catatan: (data.catatan || '').trim(),
        createdAt: new Date().toISOString()
    };
    if (payload.nominal <= 0) throw new Error('Nominal harus lebih besar dari nol.');
    const id = await db.kasManual.add(payload);
    return { ...payload, id };
}

export async function updateKasManual(id, data) {
    const existing = await db.kasManual.get(id);
    if (!existing) throw new Error('Transaksi kas tidak ditemukan.');
    const payload = {
        ...existing,
        tanggal: data.tanggal || existing.tanggal,
        tipe: data.tipe === TIPE_KAS.MASUK ? TIPE_KAS.MASUK : TIPE_KAS.KELUAR,
        aktivitas: data.aktivitas || existing.aktivitas,
        kategori: data.kategori || existing.kategori,
        keterangan: (data.keterangan ?? existing.keterangan ?? '').trim(),
        nominal: data.nominal !== undefined ? Number(data.nominal) : existing.nominal,
        metodePembayaran: data.metodePembayaran ?? existing.metodePembayaran,
        catatan: data.catatan ?? existing.catatan,
        updatedAt: new Date().toISOString()
    };
    if (payload.nominal <= 0) throw new Error('Nominal harus lebih besar dari nol.');
    await db.kasManual.put(payload);
    return payload;
}

export async function hapusKasManual(id) {
    const existing = await db.kasManual.get(id);
    if (!existing) throw new Error('Transaksi kas tidak ditemukan.');
    await db.kasManual.delete(id);
    return true;
}

/* ------------------------------------------------------------------ */
/* Konversi record → entry arus kas (pure, untuk unit test)            */
/* ------------------------------------------------------------------ */

function normalizeTanggal(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
    // Normalisasi ke 'YYYY-MM-DD HH:mm:ss' agar bisa dibandingkan lexical
    if (s.length === 10) return `${s} 00:00:00`;
    if (s.length === 16) return `${s}:00`;
    return s;
}

/** Konversi record penjualan menjadi entry kas masuk. */
export function penjualanToCashEntries(penjualanList) {
    return (penjualanList || []).map((p) => {
        const nominal = Number(p.totalPenjualan) || 0;
        return {
            id: `penjualan-${p.id}`,
            tanggal: normalizeTanggal(p.tanggal) || dayjs().format('YYYY-MM-DD HH:mm:ss'),
            tipe: TIPE_KAS.MASUK,
            aktivitas: AKTIVITAS_KAS.OPERASI,
            kategori: 'penjualan',
            keterangan: `Penjualan #${p.id}`,
            nominal,
            sumber: SUMBER_TRANSAKSI.PENJUALAN,
            sumberId: p.id,
            deskripsi: 'Penerimaan dari penjualan'
        };
    });
}

/** Konversi rincian pengeluaran menjadi entry kas keluar. */
export function pengeluaranToCashEntries(rincianList) {
    return (rincianList || []).map((r) => ({
        id: `pengeluaran-${r.bulanTahun}-${r.jenis}-${r.id}`,
        tanggal: normalizeTanggal(r.tanggalEfektif || r.tanggal)
            || normalizeTanggal(`${r.bulanTahun}-01`)
            || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipe: TIPE_KAS.KELUAR,
        aktivitas: AKTIVITAS_KAS.OPERASI,
        kategori: r.jenis,
        keterangan: r.text || 'Pengeluaran',
        nominal: Number(r.nominal) || 0,
        sumber: SUMBER_TRANSAKSI.PENGELUARAN,
        sumberId: r.id,
        deskripsi: 'Biaya operasional'
    }));
}

/** Konversi record kasManual menjadi entry arus kas. */
export function kasManualToCashEntries(manualList) {
    return (manualList || []).map((m) => ({
        id: `manual-${m.id}`,
        tanggal: normalizeTanggal(m.tanggal) || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipe: m.tipe === TIPE_KAS.MASUK ? TIPE_KAS.MASUK : TIPE_KAS.KELUAR,
        aktivitas: m.aktivitas || AKTIVITAS_KAS.OPERASI,
        kategori: m.kategori || 'pengeluaran_lain',
        keterangan: m.keterangan || 'Transaksi kas',
        nominal: Number(m.nominal) || 0,
        // Transaksi otomatis (produk baru / penambahan stok) tetap disimpan di
        // kasManual, tetapi sumbernya ditandai agar bisa dibedakan (dan tidak
        // bisa diedit/dihapus sebagai transaksi manual biasa).
        sumber: SUMBER_KAS_OTOMATIS.includes(m.sumber)
            ? m.sumber
            : SUMBER_TRANSAKSI.MANUAL,
        sumberId: m.id,
        produkId: m.sumberId || null,
        deskripsi: m.catatan || 'Catatan kas manual',
        metodePembayaran: m.metodePembayaran || ''
    }));
}

/* ------------------------------------------------------------------ */
/* Pembelian stok awal dari produk baru                                */
/* ------------------------------------------------------------------ */

/**
 * Nilai persediaan = quantity × hpp per unit.
 * Nilai nol/negatif tidak dicatat sebagai kas keluar.
 */
export function hitungNilaiPersediaan(quantity, hpp) {
    const qty = Number(quantity) || 0;
    const hppPerUnit = Number(hpp) || 0;
    if (qty <= 0 || hppPerUnit <= 0) return 0;
    return Math.round(qty * hppPerUnit);
}

/** Alias lama untuk nilai stok awal produk baru. */
export const hitungNilaiStokAwal = hitungNilaiPersediaan;

/**
 * Susun record kasManual untuk pembelian stok awal produk baru.
 * Mengembalikan null bila nilai stok awal 0 (tidak ada kas keluar).
 *
 * Catatan: HPP pembelian persediaan TIDAK masuk laporan keuntungan; laporan
 * keuntungan tetap memakai HPP dari barang yang benar-benar terjual.
 */
export function buildPembelianStokAwalEntry(produk, tanggal = null) {
    const nominal = hitungNilaiPersediaan(produk?.quantity, produk?.hpp);
    if (nominal <= 0) return null;

    const nama = (produk?.nama || '').trim();
    return {
        tanggal: normalizeTanggal(tanggal) || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipe: TIPE_KAS.KELUAR,
        aktivitas: AKTIVITAS_KAS.OPERASI,
        kategori: 'pembelian_persediaan',
        keterangan: nama ? `Pembelian stok awal - ${nama}` : 'Pembelian stok awal produk baru',
        nominal,
        metodePembayaran: 'tunai',
        catatan: 'Otomatis dari pencatatan produk baru',
        sumber: SUMBER_TRANSAKSI.PRODUK_BARU,
        sumberId: produk?.id ?? null,
        createdAt: new Date().toISOString()
    };
}

/**
 * Susun record kasManual untuk penambahan stok produk lama.
 * Hanya penambahan (jumlah > 0) yang dicatat; koreksi/pengurangan stok tidak.
 * Mengembalikan null bila jumlah atau HPP tidak valid.
 */
export function buildPenambahanStokEntry(produk, jumlah, tanggal = null) {
    const tambahan = Number(jumlah) || 0;
    const nominal = hitungNilaiPersediaan(tambahan, produk?.hpp);
    if (tambahan <= 0 || nominal <= 0) return null;

    const nama = (produk?.nama || '').trim();
    return {
        tanggal: normalizeTanggal(tanggal) || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tipe: TIPE_KAS.KELUAR,
        aktivitas: AKTIVITAS_KAS.OPERASI,
        kategori: 'pembelian_persediaan',
        keterangan: nama ? `Penambahan stok ${tambahan} - ${nama}` : `Penambahan stok ${tambahan}`,
        nominal,
        metodePembayaran: 'tunai',
        catatan: 'Otomatis dari penambahan stok produk',
        sumber: SUMBER_TRANSAKSI.PENAMBAHAN_STOK,
        sumberId: produk?.id ?? null,
        createdAt: new Date().toISOString()
    };
}

/** Gabungkan semua sumber, urutkan terbaru, tambahkan running balance. */
export function mergeCashFlowEntries({ penjualanEntries, pengeluaranEntries, manualEntries, saldoAwal }) {
    const semua = [
        ...(penjualanEntries || []),
        ...(pengeluaranEntries || []),
        ...(manualEntries || [])
    ].sort((a, b) => (a.tanggal > b.tanggal ? 1 : a.tanggal < b.tanggal ? -1 : 0));

    let saldoAwalAngka = 0;
    if (saldoAwal && saldoAwal.saldoAwal !== undefined && saldoAwal.saldoAwal !== null) {
        saldoAwalAngka = Number(saldoAwal.saldoAwal) || 0;
    }
    let running = saldoAwalAngka;
    return semua.map((e) => {
        running += e.tipe === TIPE_KAS.MASUK ? e.nominal : -e.nominal;
        return { ...e, runningBalance: running };
    });
}

/** Filter entries berdasarkan parameter (pure). */
export function filterCashFlowEntries(entries, {
    start = null, end = null, tipe = null, aktivitas = null, search = ''
} = {}) {
    const q = String(search || '').trim().toLowerCase();
    return (entries || []).filter((e) => {
        if (start && e.tanggal < start) return false;
        if (end && e.tanggal > end) return false;
        if (tipe && tipe !== 'semua' && e.tipe !== tipe) return false;
        if (aktivitas && aktivitas !== 'semua' && e.aktivitas !== aktivitas) return false;
        if (q) {
            const hay = `${e.keterangan} ${e.kategori} ${e.deskripsi}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

/** Hitung total kas masuk, kas keluar, dan arus kas bersih dari entries (pure). */
export function hitungTotalArusKas(entries) {
    let kasMasuk = 0;
    let kasKeluar = 0;
    (entries || []).forEach((e) => {
        if (e.tipe === TIPE_KAS.MASUK) kasMasuk += e.nominal;
        else kasKeluar += e.nominal;
    });
    return {
        kasMasuk,
        kasKeluar,
        arusKasBersih: kasMasuk - kasKeluar
    };
}

/**
 * Hitung running balance entries dengan saldo awal tertentu (pure).
 * Running balance dihitung kronologis dari saldoAwal.
 */
export function hitungRunningBalance(entries, saldoAwal = 0) {
    const sorted = [...(entries || [])].sort((a, b) =>
        a.tanggal > b.tanggal ? 1 : a.tanggal < b.tanggal ? -1 : 0
    );
    let running = Number(saldoAwal) || 0;
    return sorted.map((e) => {
        running += e.tipe === TIPE_KAS.MASUK ? e.nominal : -e.nominal;
        return { ...e, runningBalance: running };
    });
}

/**
 * Hitung saldo awal periode: saldoAwalKas + seluruh transaksi setelah
 * berlakuSejak dan sebelum awal periode.
 */
export async function hitungSaldoAwalPeriode(startTanggal) {
    const config = await getSaldoAwalKas();
    if (!config || config.saldoAwal === undefined || config.saldoAwal === null) {
        return { tersedia: false, saldoAwal: 0, config: null };
    }

    const berlakuSejak = normalizeTanggal(config.berlakuSejak) || `${config.berlakuSejak} 00:00:00`;
    let saldo = Number(config.saldoAwal) || 0;

    // Ambil semua transaksi setelah berlakuSejak dan sebelum awal periode
    const semuaEntry = await getSemuaCashFlowEntries();
    semuaEntry.forEach((e) => {
        if (e.tanggal >= berlakuSejak && e.tanggal < startTanggal) {
            saldo += e.tipe === TIPE_KAS.MASUK ? e.nominal : -e.nominal;
        }
    });

    return { tersedia: true, saldoAwal: saldo, config };
}

/* ------------------------------------------------------------------ */
/* Load data dari database                                             */
/* ------------------------------------------------------------------ */

async function getRincianPengeluaranForCashFlow() {
    const records = await db.pengeluaran.toArray();
    const hasil = [];
    records.forEach((r) => {
        const items = Array.isArray(r.keterangan) ? r.keterangan : [];
        items.forEach((k) => {
            hasil.push({
                id: k.id,
                text: k.text,
                nominal: Number(k.nominal) || 0,
                tanggal: k.tanggal || null,
                jenis: r.jenis,
                bulanTahun: r.bulanTahun,
                tanggalEfektif: k.tanggal || `${r.bulanTahun}-01 00:00`
            });
        });
    });
    return hasil;
}

/** Load semua entry arus kas (otomatis + manual), diurutkan terbaru. */
export async function getSemuaCashFlowEntries() {
    const [penjualanData, rincianPengeluaran, manualList] = await Promise.all([
        db.penjualan.toArray(),
        getRincianPengeluaranForCashFlow(),
        db.kasManual.toArray()
    ]);

    const penjualanEntries = penjualanToCashEntries(penjualanData);
    const pengeluaranEntries = pengeluaranToCashEntries(rincianPengeluaran);
    const manualEntries = kasManualToCashEntries(manualList);

    return mergeCashFlowEntries({
        penjualanEntries,
        pengeluaranEntries,
        manualEntries,
        saldoAwal: null
    });
}

/**
 * Load arus kas lengkap untuk periode tertentu, termasuk running balance
 * yang memperhitungkan saldo awal periode.
 *
 * @param {string|null} start — 'YYYY-MM-DD HH:mm:ss' (null = dari awal)
 * @param {string|null} end — 'YYYY-MM-DD HH:mm:ss' (null = sampai sekarang)
 */
export async function getArusKasPeriode(start = null, end = null) {
    const [penjualanData, rincianPengeluaran, manualList] = await Promise.all([
        db.penjualan.toArray(),
        getRincianPengeluaranForCashFlow(),
        db.kasManual.toArray()
    ]);

    const penjualanEntries = penjualanToCashEntries(penjualanData);
    const pengeluaranEntries = pengeluaranToCashEntries(rincianPengeluaran);
    const manualEntries = kasManualToCashEntries(manualList);

    // Saldo awal periode (hanya jika start ditentukan)
    let saldoAwalPeriode = 0;
    let saldoAwalTersedia = false;
    let saldoAwalConfig = null;
    if (start) {
        const hasil = await hitungSaldoAwalPeriode(start);
        saldoAwalPeriode = hasil.saldoAwal;
        saldoAwalTersedia = hasil.tersedia;
        saldoAwalConfig = hasil.config;
    } else {
        // Seluruh waktu: gunakan saldo awal config langsung
        saldoAwalConfig = await getSaldoAwalKas();
        if (saldoAwalConfig && saldoAwalConfig.saldoAwal !== undefined) {
            saldoAwalPeriode = Number(saldoAwalConfig.saldoAwal) || 0;
            saldoAwalTersedia = true;
        }
    }

    // Filter entries pada periode
    const semua = [
        ...penjualanEntries,
        ...pengeluaranEntries,
        ...manualEntries
    ];

    const periodeEntries = semua.filter((e) => {
        if (start && e.tanggal < start) return false;
        if (end && e.tanggal > end) return false;
        return true;
    });

    const entriesWithBalance = hitungRunningBalance(periodeEntries, saldoAwalPeriode);
    const entriesTerbaru = [...entriesWithBalance].reverse();

    const totals = hitungTotalArusKas(periodeEntries);
    const saldoAkhir = saldoAwalPeriode + totals.arusKasBersih;

    return {
        entries: entriesTerbaru,
        totals: {
            ...totals,
            saldoAwal: saldoAwalPeriode,
            saldoAkhir: saldoAwalTersedia ? saldoAkhir : null,
            saldoAwalTersedia
        },
        saldoAwalConfig
    };
}

/**
 * Bangun deret tren arus kas per periode (harian/mingguan/bulanan).
 */
export async function getTrenArusKas(granularity = 'bulan', start = null, end = null) {
    const semua = await getSemuaCashFlowEntries();
    const map = {};
    const getKey = (tanggalStr) => {
        const t = dayjs(tanggalStr);
        if (!t.isValid()) return null;
        if (granularity === 'hari') return t.format('YYYY-MM-DD');
        if (granularity === 'minggu') return t.startOf('week').format('YYYY-MM-DD');
        return t.format('YYYY-MM');
    };

    semua.forEach((e) => {
        if (start && e.tanggal < start) return;
        if (end && e.tanggal > end) return;
        const key = getKey(e.tanggal);
        if (!key) return;
        if (!map[key]) map[key] = { periode: key, kasMasuk: 0, kasKeluar: 0 };
        if (e.tipe === TIPE_KAS.MASUK) map[key].kasMasuk += e.nominal;
        else map[key].kasKeluar += e.nominal;
    });

    return Object.values(map)
        .map((row) => ({ ...row, arusKasBersih: row.kasMasuk - row.kasKeluar }))
        .sort((a, b) => (a.periode > b.periode ? 1 : -1));
}
