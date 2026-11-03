import Dexie from 'dexie';
import dayjs from 'dayjs';

export const db = new Dexie('SmartPosUmkmDb');

db.version(1).stores({
    produk: 'id, nama, harga, hpp, quantity, createdAt',
    penjualan: '++id, tanggal, totalPenjualan, totalHpp, *items',
    pengeluaran: '++id, &[bulanTahun+jenis], bulanTahun, jenis, nominal', // non-indexed: keterangan (array of object). jenis: pemasaran, admin, sewa, operasional, ...
    persediaan: 'bulanTahun, totalNilai' // snapshot persediaan akhir bulan
});

// Versi 2: Tambahkan tabel profilToko untuk menyimpan identitas toko tanpa menghapus data tabel lainnya
db.version(2).stores({
    profilToko: 'id'
});

// Versi 3: Tambah tabel kasManual & saldoAwalKas untuk fitur arus kas.
// Tabel lama diwariskan otomatis dari versi sebelumnya; tidak ada data yang dihapus.
db.version(3).stores({
    kasManual: '++id, tanggal, tipe, aktivitas, kategori',
    saldoAwalKas: 'id'
});

// Snapshot persediaan dihitung dari mutasi tabel produk. Saat restore backup,
// nilai snapshot diambil langsung dari file, sehingga hook harus dihentikan
// sementara. Scope ini selalu di-reset lewat try/finally agar operasi normal
// tidak pernah kehilangan pencatatan snapshot.
let snapshotTrackingPaused = false;

export function isSnapshotTrackingPaused() {
    return snapshotTrackingPaused;
}

export async function withSnapshotTrackingPaused(fn) {
    if (snapshotTrackingPaused) {
        return fn();
    }

    snapshotTrackingPaused = true;
    try {
        return await fn();
    } finally {
        snapshotTrackingPaused = false;
    }
}

// Fungsi helper untuk update persediaan secara inkremental
async function updateSnapshot(diff) {
    if (diff === 0) return;
    const bulanIni = dayjs().format('YYYY-MM');
    try {
        await db.transaction('rw', db.persediaan, async () => {
            const existing = await db.persediaan.get(bulanIni);
            const newTotal = Math.max(0, (existing?.totalNilai || 0) + diff);
            await db.persediaan.put({ bulanTahun: bulanIni, totalNilai: newTotal });
        });
    } catch (error) {
        console.error('Failed to update persediaan snapshot:', error);
    }
}

// Hooks Dexie untuk tabel produk
db.produk.hook('creating', function (primKey, obj, transaction) {
    if (snapshotTrackingPaused) return;

    const diff = (obj.quantity || 0) * (obj.hpp || 0);
    if (diff !== 0) {
        transaction.on('complete', () => {
            updateSnapshot(diff);
        });
    }
});

db.produk.hook('updating', function (modifications, primKey, obj, transaction) {
    if (snapshotTrackingPaused) return;

    const oldQty = obj.quantity || 0;
    const oldHpp = obj.hpp || 0;
    
    const newQty = modifications.hasOwnProperty('quantity') ? modifications.quantity : oldQty;
    const newHpp = modifications.hasOwnProperty('hpp') ? modifications.hpp : oldHpp;
    
    const oldVal = oldQty * oldHpp;
    const newVal = newQty * newHpp;
    const diff = newVal - oldVal;
    
    if (diff !== 0) {
        transaction.on('complete', () => {
            updateSnapshot(diff);
        });
    }
});

db.produk.hook('deleting', function (primKey, obj, transaction) {
    if (snapshotTrackingPaused) return;

    const diff = -((obj.quantity || 0) * (obj.hpp || 0));
    if (diff !== 0) {
        transaction.on('complete', () => {
            updateSnapshot(diff);
        });
    }
});

// Helper fungsi untuk kelola rincian biaya pengeluaran
async function getRecordPengeluaran(bulanTahun, jenis) {
    let record = await db.pengeluaran.where('[bulanTahun+jenis]').equals([bulanTahun, jenis]).first();
    if (!record) {
        record = await db.pengeluaran.where({ bulanTahun, jenis }).first();
    }
    return record;
}

export async function getPengeluaranKategoriBulan(bulanTahun, jenis) {
    const record = await getRecordPengeluaran(bulanTahun, jenis);
    return record || { bulanTahun, jenis, nominal: 0, keterangan: [] };
}

export async function tambahRincianBiaya(bulanTahun, jenis, text, nominal) {
    const record = await getRecordPengeluaran(bulanTahun, jenis);
    const itemBaru = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        text: text || 'Pengeluaran',
        nominal: Number(nominal) || 0,
        tanggal: dayjs().format('YYYY-MM-DD HH:mm')
    };

    if (record) {
        if (!Array.isArray(record.keterangan)) {
            record.keterangan = [];
        }
        record.keterangan.push(itemBaru);
        record.nominal = record.keterangan.reduce((sum, k) => sum + (Number(k.nominal) || 0), 0);
        await db.pengeluaran.put(record);
        return record;
    } else {
        const newRecord = {
            bulanTahun,
            jenis,
            nominal: Number(nominal) || 0,
            keterangan: [itemBaru]
        };
        const id = await db.pengeluaran.add(newRecord);
        return { ...newRecord, id };
    }
}

export async function updateRincianBiaya(bulanTahun, jenis, itemId, textBaru, nominalBaru) {
    const record = await getRecordPengeluaran(bulanTahun, jenis);
    if (!record || !Array.isArray(record.keterangan)) return null;

    const itemIdx = record.keterangan.findIndex(k => k.id === itemId);
    if (itemIdx === -1) return null;

    record.keterangan[itemIdx].text = textBaru;
    record.keterangan[itemIdx].nominal = Number(nominalBaru) || 0;
    record.nominal = record.keterangan.reduce((sum, k) => sum + (Number(k.nominal) || 0), 0);
    await db.pengeluaran.put(record);
    return record;
}

export async function hapusRincianBiaya(bulanTahun, jenis, itemId) {
    const record = await getRecordPengeluaran(bulanTahun, jenis);
    if (!record || !Array.isArray(record.keterangan)) return null;

    record.keterangan = record.keterangan.filter(k => k.id !== itemId);
    if (record.keterangan.length === 0) {
        await db.pengeluaran.delete(record.id);
        return null;
    } else {
        record.nominal = record.keterangan.reduce((sum, k) => sum + (Number(k.nominal) || 0), 0);
        await db.pengeluaran.put(record);
        return record;
    }
}

// Helper untuk identitas toko di Dexie.js
export async function getIdentitasToko() {
    try {
        const profil = await db.profilToko.get(1);
        if (profil) {
            return {
                namaToko: (profil.namaToko || '').trim(),
                alamatToko: (profil.alamatToko || '').trim(),
                noHp: (profil.noHp || '').trim()
            };
        }
    } catch (e) {
        console.error('Gagal mengambil identitas toko dari Dexie:', e);
    }
    return null;
}

export async function simpanIdentitasToko(data) {
    try {
        const payload = {
            id: 1,
            namaToko: (data.namaToko || '').trim(),
            alamatToko: (data.alamatToko || '').trim(),
            noHp: (data.noHp || '').trim(),
            updatedAt: new Date().toISOString()
        };
        await db.profilToko.put(payload);
        return payload;
    } catch (e) {
        console.error('Gagal menyimpan identitas toko ke Dexie:', e);
        throw e;
    }
}
