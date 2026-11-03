import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getStoredProfileSync } from '../composables/useStoreProfile';
import { getPenjualanRange, getPengeluaranRange, hitungLaporanKeuntungan } from '../services/profitReportService';
import { EXPENSE_CATEGORY_LABELS } from '../constants/expenseCategories';

function getRentangPeriode(periodeParam) {
    if (periodeParam === 'Seluruh Waktu') {
        return { start: null, end: null, label: 'Seluruh Waktu' };
    }
    if (periodeParam === '1 Semester Terakhir') {
        return {
            start: dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
            end: dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss'),
            label: '1 Semester Terakhir'
        };
    }
    // Asumsi format 'YYYY-MM'
    return {
        start: dayjs(periodeParam).startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        end: dayjs(periodeParam).endOf('month').format('YYYY-MM-DD HH:mm:ss'),
        label: dayjs(periodeParam).format('MMMM YYYY')
    };
}

export const exportLabaRugiExcel = async (periodeParam) => {
    try {
        const { start, end, label: periodeTextStr } = getRentangPeriode(periodeParam);

        // Gunakan service yang sama dengan dashboard agar angka konsisten
        const [penjualanData, rincianPengeluaran] = await Promise.all([
            getPenjualanRange(start, end),
            getPengeluaranRange(start, end)
        ]);

        const laporan = hitungLaporanKeuntungan(penjualanData, rincianPengeluaran);

        const storeProfile = getStoredProfileSync();
        const namaToko = storeProfile.namaToko || 'POSSuper';
        const alamatToko = storeProfile.alamatToko || '';
        const noHp = storeProfile.noHp || '';

        const excelData = [
            [namaToko.toUpperCase()],
            ...(alamatToko ? [[alamatToko]] : []),
            ...(noHp ? [[`Telp/WA: ${noHp}`]] : []),
            [],
            ['LAPORAN ESTIMASI LABA USAHA'],
            ['Periode:', periodeTextStr],
            [],
            ['PENDAPATAN'],
            ['Total Penjualan (Omzet)', laporan.totalPenjualan],
            ['Harga Pokok Penjualan (HPP)', `-${laporan.totalHpp}`],
            ['Keuntungan Kotor', laporan.keuntunganKotor],
            [],
            ['BEBAN / PENGELUARAN OPERASIONAL']
        ];

        // Rincian pengeluaran per kategori
        const perKategori = {};
        rincianPengeluaran.forEach((r) => {
            if (!perKategori[r.jenis]) perKategori[r.jenis] = { total: 0, items: [] };
            perKategori[r.jenis].total += r.nominal;
            perKategori[r.jenis].items.push(r);
        });

        if (Object.keys(perKategori).length > 0) {
            Object.entries(perKategori).forEach(([jenis, data]) => {
                const namaKategori = EXPENSE_CATEGORY_LABELS[jenis] || jenis;
                excelData.push([`  - ${namaKategori}`, data.total]);
                data.items.forEach((k) => {
                    excelData.push([`      * ${k.text || '-'}`, k.nominal]);
                });
            });
        } else {
            excelData.push(['  - Tidak ada pengeluaran', 0]);
        }

        excelData.push(['Total Biaya Operasional', laporan.totalBiayaOperasional]);
        excelData.push([]);
        excelData.push(['ESTIMASI LABA USAHA', laporan.estimasiLabaUsaha]);
        excelData.push([]);
        excelData.push(['Margin Keuntungan', `${laporan.marginKeuntungan.toFixed(1)}%`]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [{ wch: 35 }, { wch: 20 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi');

        const safePeriodeName = periodeParam.replace(/\s+/g, '_');
        const fileName = `Laba_Rugi_${safePeriodeName}.xlsx`;

        if (Capacitor.isNativePlatform()) {
            const base64Data = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const writeResult = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
            });
            await Share.share({
                title: `Laporan Laba Rugi periode ${periodeTextStr}`,
                text: `Berikut adalah laporan laba rugi untuk periode ${periodeTextStr}`,
                url: writeResult.uri,
                dialogTitle: 'Simpan atau Bagikan Laporan'
            });
        } else {
            // Web fallback: unduh lewat Blob
            const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
            } finally {
                setTimeout(() => URL.revokeObjectURL(url), 1500);
            }
        }

        return true;
    } catch (error) {
        console.error('Gagal membuat laporan Excel:', error);
        throw error;
    }
};
