import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../composables/useToast';
import { getStoredProfileSync } from '../composables/useStoreProfile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import dayjs from 'dayjs';

const { showToast } = useToast();

export const saveAndSharePDF = async (doc, filename) => {
    try {
        // 1. Sanitasi: Hilangkan karakter yang dilarang pada sistem file (seperti / \ : * ? " < > |)
        let safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '-');

        // 2. Pastikan file selalu memiliki ekstensi .pdf di akhirnya
        if (!safeFilename.toLowerCase().endsWith('.pdf')) {
            safeFilename += '.pdf';
        }

        if (Capacitor.isNativePlatform()) {
            // Dapatkan output PDF
            const pdfDataUri = doc.output('datauristring');

            // 3. Ekstrak base64 dengan mencari indeks yang pasti (menghindari error karena tanda koma)
            const base64Index = pdfDataUri.indexOf('base64,') + 7;
            const pdfBase64 = pdfDataUri.substring(base64Index);

            // Simpan sementara ke folder Cache
            const savedFile = await Filesystem.writeFile({
                path: safeFilename,
                data: pdfBase64,
                directory: Directory.Cache,
            });

            // Munculkan dialog native untuk membagikan/membuka/menyimpan file
            await Share.share({
                title: safeFilename,
                url: savedFile.uri,
                dialogTitle: 'Buka atau Simpan PDF'
            });
        } else {
            // Fallback untuk web browser
            doc.save(safeFilename);
        }
    } catch (error) {
        console.error('Error saat menyimpan atau membagikan PDF:', error);
        showToast('Gagal menyimpan dokumen. Pastikan penyimpanan perangkat Anda cukup dan coba kembali.', 'error');
    }
};

export const generateAndDownloadReceiptPDF = async (transaksi, preGeneratedQrBase64 = null) => {
    if (!transaksi) return;

    const doc = new jsPDF();
    const warnaUtama = [38, 70, 83]; // accent #264653
    const warnaAksen = [42, 157, 143]; // primary #2A9D8F
    const abuAbu = [80, 102, 97]; // ink-secondary #506661
    const textDark = [29, 45, 42]; // ink #1D2D2A

    const storeProfile = getStoredProfileSync();
    const namaToko = storeProfile.namaToko || 'POSSuper';
    const alamatToko = storeProfile.alamatToko || '';
    const noHp = storeProfile.noHp || '';

    // --- HEADER ---
    doc.setFillColor(warnaUtama[0], warnaUtama[1], warnaUtama[2]);
    doc.rect(0, 0, 210, 48, 'F'); // Background Header

    // Judul / Nama Toko Kiri
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(namaToko, 14, 18);

    // Alamat Toko Kiri
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(215, 238, 233); // primary-soft #D7EEE9
    if (alamatToko) {
        const splitAlamat = doc.splitTextToSize(alamatToko, 115);
        doc.text(splitAlamat, 14, 25);
        if (noHp) {
            const nextY = 25 + (splitAlamat.length * 4.5);
            doc.text(`Telp/WA: ${noHp}`, 14, Math.min(nextY, 44));
        }
    } else if (noHp) {
        doc.text(`Telp/WA: ${noHp}`, 14, 25);
    }

    // Tulisan INVOICE Kanan
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("NOTA TRANSAKSI", 196, 22, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(215, 238, 233); // primary-soft #D7EEE9
    doc.text("POSSuper", 196, 28, { align: 'right' });

    // --- INFORMASI TRANSAKSI ---
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont("helvetica", "bold");
    doc.text("DETAIL TRANSAKSI", 14, 62);

    doc.setLineWidth(0.5);
    doc.setDrawColor(217, 230, 225); // border #D9E6E1
    doc.line(14, 65, 85, 65);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(abuAbu[0], abuAbu[1], abuAbu[2]);
    doc.text(`ID Transaksi`, 14, 73);
    doc.text(`: ${transaksi.id ? '#' + transaksi.id : '-'}`, 40, 73);

    doc.text(`Tanggal`, 14, 79);
    doc.text(`: ${transaksi.tanggal}`, 40, 79);

    // --- TABEL PRODUK ---
    const tableData = transaksi.items.map((p, index) => [
        index + 1,
        p.nama,
        `Rp ${Number(p.harga).toLocaleString('id-ID')}`,
        p.quantity,
        `Rp ${(Number(p.harga) * p.quantity).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
        startY: 92,
        head: [['No', 'Deskripsi Produk', 'Harga Satuan', 'Qty', 'Subtotal']],
        body: tableData,
        foot: [['', 'TOTAL KESELURUHAN', '', '', `Rp ${Number(transaksi.totalPenjualan).toLocaleString('id-ID')}`]],
        theme: 'striped',
        headStyles: {
            fillColor: warnaUtama,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            textColor: textDark,
        },
        alternateRowStyles: {
            fillColor: [244, 249, 246] // background #F4F9F6
        },
        footStyles: {
            fillColor: warnaAksen,
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center' }
        }
    });

    const finalY = doc.lastAutoTable.finalY;

    // --- FOOTER & QR CODE ---
    let footerY = finalY + 20;

    // Garis Pemisah Footer
    doc.setLineWidth(0.5);
    doc.setDrawColor(217, 230, 225); // border #D9E6E1
    doc.line(14, footerY - 8, 196, footerY - 8);

    // Pesan Terima Kasih
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(warnaUtama[0], warnaUtama[1], warnaUtama[2]);
    doc.text(`Terima Kasih atas Pembelian Anda di ${namaToko}!`, 14, footerY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(abuAbu[0], abuAbu[1], abuAbu[2]);
    doc.text("Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.", 14, footerY + 6);
    doc.text("Simpan nota ini sebagai bukti pembayaran yang sah.", 14, footerY + 11);

    // Handle QR Code
    let qrData = preGeneratedQrBase64;

    if (!qrData && transaksi.tokenNota) {
        const urlTujuan = `https://rafifs-ops.github.io/note-viewer-smartpos/?t=${transaksi.tokenNota}`;
        qrData = await QRCode.toDataURL(urlTujuan, { margin: 4, width: 500, errorCorrectionLevel: 'L', scale: 4 });
    }

    if (qrData) {
        const qrSize = 100;
        const posX = (210 - qrSize) / 2; // Rata tengah
        let posY = footerY + 20; // Letakkan di bawah teks footer agar tidak bertabrakan

        const pageHeight = doc.internal.pageSize.getHeight();
        if (posY + qrSize + 15 > pageHeight - 15) { // 15mm extra padding
            doc.addPage();
            posY = 20; // Reset Y ke atas halaman baru
        }

        // Background putih untuk QR code agar rapi
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(217, 230, 225); // border #D9E6E1
        doc.setLineWidth(0.5);
        doc.roundedRect(posX - 2, posY - 2, qrSize + 4, qrSize + 4, 2, 2, 'FD');

        doc.addImage(qrData, 'PNG', posX, posY, qrSize, qrSize);

        doc.setFontSize(8);
        doc.setTextColor(abuAbu[0], abuAbu[1], abuAbu[2]);
        doc.text('Scan Bukti Online', posX + (qrSize / 2), posY + qrSize + 7, { align: 'center' });
    }

    await saveAndSharePDF(doc, `Nota_${dayjs(transaksi.tanggal).format('YYYYMMDD_HHmmss')}.pdf`);
};