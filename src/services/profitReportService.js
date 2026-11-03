import { db } from '../database/db';
import dayjs from 'dayjs';

/**
 * Profit report service — perhitungan laporan keuntungan POSSuper.
 *
 * Prinsip:
 * - HPP diambil dari record transaksi (totalHpp) yang tersimpan saat checkout,
 *   BUKAN dihitung ulang dengan harga modal produk saat ini.
 * - Pengeluaran dihitung dari keterangan[] nominal (rincian), dengan fallback
 *   ke record bulanTahun bila keterangan tidak memiliki tanggal.
 * - Istilah "Estimasi Laba Usaha" dipakai, bukan "Laba Bersih".
 */

/** Ambil data penjualan pada rentang tanggal (string 'YYYY-MM-DD HH:mm:ss'). */
export async function getPenjualanRange(start, end) {
    if (!start || !end) return db.penjualan.toArray();
    return db.penjualan.where('tanggal').between(start, end, true, true).toArray();
}

/**
 * Ambil rincian pengeluaran pada rentang tanggal.
 * - Rincian dengan tanggal valid difilter berdasarkan tanggal rincian.
 * - Rincian tanpa tanggal jatuh ke fallback berdasarkan bulanTahun record induk.
 */
export async function getPengeluaranRange(start, end) {
    const records = await db.pengeluaran.toArray();
    return filterPengeluaranByRange(records, start, end);
}

/** Filter array pengeluaran berdasarkan rentang tanggal (pure, untuk unit test). */
export function filterPengeluaranByRange(records, start, end) {
    if (!start || !end) {
        return records.flatMap((r) =>
            (r.keterangan || []).map((k) => ({
                id: k.id,
                text: k.text,
                nominal: Number(k.nominal) || 0,
                tanggal: k.tanggal || null,
                jenis: r.jenis,
                bulanTahun: r.bulanTahun,
                tanggalEfektif: k.tanggal || `${r.bulanTahun}-01 00:00`
            }))
        );
    }

    const startDay = dayjs(start);
    const endDay = dayjs(end);
    const startMonth = startDay.format('YYYY-MM');
    const endMonth = endDay.format('YYYY-MM');

    const hasil = [];
    records.forEach((r) => {
        const items = Array.isArray(r.keterangan) ? r.keterangan : [];
        items.forEach((k) => {
            let tanggalEfektif = null;
            if (k.tanggal && /^\d{4}-\d{2}-\d{2}/.test(String(k.tanggal))) {
                const t = dayjs(String(k.tanggal).trim().slice(0, 16));
                if (t.isValid()) tanggalEfektif = t;
            }
            // Fallback: gunakan bulanTahun record induk bila tanggal rincian tidak valid
            if (!tanggalEfektif) {
                if (r.bulanTahun >= startMonth && r.bulanTahun <= endMonth) {
                    tanggalEfektif = dayjs(`${r.bulanTahun}-01`);
                }
            }
            if (!tanggalEfektif) return;
            if (tanggalEfektif.isBefore(startDay) || tanggalEfektif.isAfter(endDay)) return;
            hasil.push({
                id: k.id,
                text: k.text,
                nominal: Number(k.nominal) || 0,
                tanggal: k.tanggal || null,
                jenis: r.jenis,
                bulanTahun: r.bulanTahun,
                tanggalEfektif: tanggalEfektif.format('YYYY-MM-DD HH:mm:ss')
            });
        });
    });
    return hasil;
}

/** Hitung total per kategori pengeluaran dari array rincian (pure). */
export function hitungBiayaPerKategori(rincianList) {
    const totals = {};
    rincianList.forEach((r) => {
        totals[r.jenis] = (totals[r.jenis] || 0) + (Number(r.nominal) || 0);
    });
    return totals;
}

/**
 * Hitung seluruh metrik laporan keuntungan.
 * @param {Array} penjualanData — record penjualan pada periode
 * @param {Array} rincianPengeluaran — rincian pengeluaran pada periode
 */
export function hitungLaporanKeuntungan(penjualanData, rincianPengeluaran) {
    const totalPenjualan = (penjualanData || []).reduce(
        (sum, p) => sum + (Number(p.totalPenjualan) || 0), 0
    );
    const totalHpp = (penjualanData || []).reduce(
        (sum, p) => sum + (Number(p.totalHpp) || 0), 0
    );
    const keuntunganKotor = totalPenjualan - totalHpp;
    const totalBiayaOperasional = (rincianPengeluaran || []).reduce(
        (sum, r) => sum + (Number(r.nominal) || 0), 0
    );
    const estimasiLabaUsaha = keuntunganKotor - totalBiayaOperasional;
    const marginKeuntungan = totalPenjualan > 0
        ? (estimasiLabaUsaha / totalPenjualan) * 100
        : 0;

    return {
        totalPenjualan,
        totalHpp,
        keuntunganKotor,
        totalBiayaOperasional,
        estimasiLabaUsaha,
        marginKeuntungan,
        biayaPerKategori: hitungBiayaPerKategori(rincianPengeluaran)
    };
}

/**
 * Ambil ringkasan keuntungan lengkap untuk periode tertentu.
 * @param {string} start — 'YYYY-MM-DD HH:mm:ss' atau null (seluruh waktu)
 * @param {string} end — 'YYYY-MM-DD HH:mm:ss' atau null
 */
export async function getRingkasanKeuntungan(start, end) {
    const [penjualanData, rincianPengeluaran] = await Promise.all([
        getPenjualanRange(start, end),
        getPengeluaranRange(start, end)
    ]);
    return hitungLaporanKeuntungan(penjualanData, rincianPengeluaran);
}

/** Statistik produk: terlaris (qty), kontribusi tertinggi (nilai), paling sepi (qty). */
export function hitungStatistikProduk(penjualanData) {
    if (!penjualanData || penjualanData.length === 0) {
        return { terlaris: null, kontribusiTertinggi: null, palingSepi: null };
    }
    const rekap = {};
    penjualanData.forEach((t) => {
        (t.items || []).forEach((item) => {
            if (!rekap[item.id]) {
                rekap[item.id] = {
                    id: item.id,
                    nama: item.nama,
                    qty: 0,
                    nilaiPenjualan: 0
                };
            }
            rekap[item.id].qty += Number(item.quantity) || 0;
            rekap[item.id].nilaiPenjualan += (Number(item.harga) || 0) * (Number(item.quantity) || 0);
        });
    });
    const arr = Object.values(rekap);
    const byQty = [...arr].sort((a, b) => b.qty - a.qty);
    const byNilai = [...arr].sort((a, b) => b.nilaiPenjualan - a.nilaiPenjualan);
    return {
        terlaris: byQty[0] || null,
        kontribusiTertinggi: byNilai[0] || null,
        palingSepi: byQty[byQty.length - 1] || null
    };
}

/**
 * Bangun deret tren keuntungan per periode (harian/mingguan/bulanan).
 * @param {string} granularity — 'hari' | 'minggu' | 'bulan'
 * @param {string} start — batas bawah (opsional)
 * @param {string} end — batas atas (opsional)
 */
export async function getTrenKeuntungan(granularity = 'bulan', start = null, end = null) {
    const [penjualanData, rincianPengeluaran] = await Promise.all([
        getPenjualanRange(start, end),
        getPengeluaranRange(start, end)
    ]);

    const map = {};
    const getKey = (tanggalStr) => {
        const t = dayjs(tanggalStr);
        if (!t.isValid()) return null;
        if (granularity === 'hari') return t.format('YYYY-MM-DD');
        if (granularity === 'minggu') return t.startOf('week').format('YYYY-MM-DD');
        return t.format('YYYY-MM');
    };

    penjualanData.forEach((p) => {
        const key = getKey(p.tanggal);
        if (!key) return;
        if (!map[key]) map[key] = { periode: key, penjualan: 0, hpp: 0, biayaOperasional: 0 };
        map[key].penjualan += Number(p.totalPenjualan) || 0;
        map[key].hpp += Number(p.totalHpp) || 0;
    });

    rincianPengeluaran.forEach((r) => {
        const key = getKey(r.tanggalEfektif);
        if (!key) return;
        if (!map[key]) map[key] = { periode: key, penjualan: 0, hpp: 0, biayaOperasional: 0 };
        map[key].biayaOperasional += Number(r.nominal) || 0;
    });

    return Object.values(map)
        .map((row) => ({
            ...row,
            keuntunganKotor: row.penjualan - row.hpp,
            estimasiLabaUsaha: row.penjualan - row.hpp - row.biayaOperasional
        }))
        .sort((a, b) => (a.periode > b.periode ? 1 : -1));
}
