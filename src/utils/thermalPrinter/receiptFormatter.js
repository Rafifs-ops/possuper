/**
 * Format struk thermal (model layout) terpisah dari encoder ESC/POS.
 *
 * Alurnya:
 *   record transaksi  ->  buildReceiptModel()  ->  array blok layout
 *                                          |
 *                     +--------------------+--------------------+
 *                     |                                         |
 *             renderEscPos(model)                      modelToPrintItems(model)
 *             -> Uint8Array (item `raw`)                -> item printText plugin
 *
 * Dengan begitu business logic transaksi tidak bercampur dengan perintah printer,
 * dan tersedia dua jalur kirim (byte mentah / item terstruktur) sebagai fallback.
 */

import {
    getPaperProfile,
    NOTE_VIEWER_BASE_URL
} from './printerConstants';
import * as escpos from './escposCommands';

/** Format rupiah deterministik (tanpa ketergantungan locale runtime). */
export function formatRupiah(value) {
    const amount = Math.round(Number(value) || 0);
    const negative = amount < 0;
    const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${negative ? '-' : ''}Rp${digits}`;
}

/** Pecah teks menjadi baris sepanjang maksimal `max` karakter. */
export function wrapText(value, max) {
    const width = Math.max(1, Math.floor(max));
    const source = String(value ?? '').trim();
    if (!source) return [''];

    const words = source.split(/\s+/);
    const lines = [];
    let current = '';

    words.forEach((word) => {
        let piece = word;
        // Pecah kata yang lebih panjang dari satu baris (nama produk panjang).
        while (piece.length > width) {
            if (current) {
                lines.push(current);
                current = '';
            }
            lines.push(piece.slice(0, width));
            piece = piece.slice(width);
        }
        if (!current) {
            current = piece;
        } else if (current.length + 1 + piece.length <= width) {
            current += ` ${piece}`;
        } else {
            lines.push(current);
            current = piece;
        }
    });

    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
}

/** Satu baris dua kolom: teks kiri + nominal rata kanan. */
export function twoColumn(left, right, columns) {
    const leftText = String(left ?? '');
    const rightText = String(right ?? '');
    const maxLeft = Math.max(1, columns - rightText.length - 1);
    const trimmedLeft = leftText.length > maxLeft ? leftText.slice(0, maxLeft) : leftText;
    const gap = Math.max(1, columns - trimmedLeft.length - rightText.length);
    return `${trimmedLeft}${' '.repeat(gap)}${rightText}`;
}

const text = (value, options = {}) => ({ type: 'text', value, ...options });

function pushWrapped(blocks, value, columns, options = {}) {
    const widthMultiplier = options.size?.width || 1;
    const usable = Math.floor(columns / widthMultiplier);
    wrapText(value, usable).forEach((row) => blocks.push(text(row, options)));
}

/**
 * Susun layout struk dari record transaksi + identitas toko.
 *
 * @param {object} params
 * @param {object} params.transaksi record `penjualan` dari IndexedDB (tidak diubah)
 * @param {object} params.profile   `profilToko`
 * @param {number} params.paperWidthMm 58 | 80
 * @param {boolean} params.includeQr sertakan QR verifikasi nota
 * @param {boolean} params.includeCut akhiri dengan feed + potong kertas
 */
export function buildReceiptModel({
    transaksi,
    profile = {},
    paperWidthMm = 80,
    includeQr = true,
    includeCut = true
} = {}) {
    if (!transaksi) {
        throw new Error('Transaksi wajib tersedia untuk membuat struk.');
    }

    const paper = getPaperProfile(paperWidthMm);
    const columns = paper.columns;
    const blocks = [];

    // A. Header toko
    const namaToko = (profile.namaToko || 'POSSuper').trim();
    pushWrapped(blocks, namaToko, columns, { align: 'center', bold: true, size: { width: 2, height: 2 } });
    if (profile.alamatToko) {
        pushWrapped(blocks, profile.alamatToko, columns, { align: 'center' });
    }
    if (profile.noHp) {
        pushWrapped(blocks, `Telp/WA: ${profile.noHp}`, columns, { align: 'center' });
    }
    blocks.push({ type: 'divider' });

    // B. Informasi transaksi (ID transaksi dari database sebagai nomor transaksi)
    blocks.push(text(`Transaksi #${transaksi.id ?? '-'}`, { bold: true }));
    pushWrapped(blocks, transaksi.tanggal || '-', columns);

    // C. Detail produk
    blocks.push({ type: 'divider' });
    const items = Array.isArray(transaksi.items) ? transaksi.items : [];
    items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const harga = Number(item.harga) || 0;
        const subtotal = qty * harga;
        pushWrapped(blocks, String(item.nama ?? 'Produk'), columns);
        blocks.push(text(
            twoColumn(`${qty} x ${formatRupiah(harga)}`, formatRupiah(subtotal), columns)
        ));
    });
    blocks.push({ type: 'divider' });

    // D. Total (nilai resmi dari record transaksi)
    blocks.push(text(
        twoColumn('TOTAL', formatRupiah(transaksi.totalPenjualan), columns),
        { bold: true }
    ));

    // E. Footer
    blocks.push({ type: 'feed', lines: 1 });
    pushWrapped(blocks, 'Terima kasih telah berbelanja!', columns, { align: 'center' });
    pushWrapped(blocks, 'Powered by POSSuper', columns, { align: 'center' });

    // F. QR verifikasi nota (tokenNota asli dari record)
    if (includeQr && transaksi.tokenNota) {
        blocks.push({ type: 'feed', lines: 1 });
        blocks.push({
            type: 'qr',
            value: `${NOTE_VIEWER_BASE_URL}${transaksi.tokenNota}`,
            size: paper.widthMm === 58 ? 5 : 6,
            align: 'center'
        });
        pushWrapped(blocks, 'Pindai QR untuk verifikasi nota', columns, { align: 'center' });
    }

    // G. Feed & cut (aman untuk printer tanpa auto-cutter)
    blocks.push({ type: 'feed', lines: includeCut ? 3 : 2 });
    if (includeCut) {
        blocks.push({ type: 'cut', mode: 'partial' });
    }

    return { paper, columns, blocks };
}

/** Struk uji coba untuk memastikan printer benar-benar bekerja. */
export function buildTestModel({
    storeName = 'POSSuper',
    printerName = '',
    paperWidthMm = 80,
    printedAt = new Date()
} = {}) {
    const paper = getPaperProfile(paperWidthMm);
    const columns = paper.columns;
    const dateText = printedAt instanceof Date && !Number.isNaN(printedAt.getTime())
        ? printedAt.toISOString().slice(0, 19).replace('T', ' ')
        : String(printedAt);
    const blocks = [];

    pushWrapped(blocks, storeName || 'POSSuper', columns, {
        align: 'center', bold: true, size: { width: 2, height: 2 }
    });
    blocks.push({ type: 'divider' });
    blocks.push(text('TEST PRINT', { align: 'center', bold: true, size: { width: 2, height: 2 } }));
    blocks.push({ type: 'feed', lines: 1 });
    pushWrapped(blocks, `Printer: ${printerName || 'Tidak diketahui'}`, columns, { align: 'center' });
    pushWrapped(blocks, `Ukuran kertas: ${paper.widthMm} mm`, columns, { align: 'center' });
    pushWrapped(blocks, `Waktu: ${dateText}`, columns, { align: 'center' });
    blocks.push({ type: 'feed', lines: 1 });
    blocks.push(text(twoColumn('Status', 'BERHASIL', columns), { bold: true }));
    blocks.push({ type: 'divider' });
    pushWrapped(blocks, 'Cetak uji POSSuper', columns, { align: 'center' });
    blocks.push({ type: 'feed', lines: 3 });
    blocks.push({ type: 'cut', mode: 'partial' });

    return { paper, columns, blocks };
}

/** Render model layout menjadi byte ESC/POS siap kirim. */
export function renderEscPos(model) {
    const { blocks, columns } = model;
    const chunks = [escpos.init()];

    blocks.forEach((block) => {
        switch (block.type) {
            case 'text':
                chunks.push(escpos.align(block.align || 'left'));
                chunks.push(escpos.bold(!!block.bold));
                chunks.push(escpos.characterSize(block.size || { width: 1, height: 1 }));
                chunks.push(escpos.line(block.value));
                break;
            case 'divider':
                chunks.push(escpos.align('left'));
                chunks.push(escpos.bold(false));
                chunks.push(escpos.characterSize({ width: 1, height: 1 }));
                chunks.push(escpos.divider(columns, block.char || '-'));
                break;
            case 'qr':
                chunks.push(escpos.align(block.align || 'center'));
                chunks.push(escpos.qrCode(block.value, { size: block.size, ec: block.errorCorrection || 'M' }));
                chunks.push(escpos.newline());
                break;
            case 'feed':
                chunks.push(escpos.feed(block.lines || 1));
                break;
            case 'cut':
                chunks.push(escpos.cut(block.mode || 'partial'));
                break;
            default:
                break;
        }
    });

    chunks.push(escpos.bold(false));
    chunks.push(escpos.align('left'));
    chunks.push(escpos.characterSize({ width: 1, height: 1 }));
    return escpos.concat(chunks);
}

/**
 * Render model layout menjadi item `printText` milik plugin
 * (fallback bila jalur byte mentah `raw` tidak didukung adapter printer).
 */
export function modelToPrintItems(model) {
    return model.blocks.map((block) => {
        switch (block.type) {
            case 'text':
                return {
                    type: 'text',
                    value: block.value,
                    style: {
                        align: block.align || 'left',
                        bold: !!block.bold,
                        widthMultiplier: block.size?.width || 1,
                        heightMultiplier: block.size?.height || 1
                    }
                };
            case 'divider':
                return { type: 'divider', char: block.char || '-', columns: model.columns };
            case 'qr':
                return {
                    type: 'qrcode',
                    value: block.value,
                    size: block.size,
                    errorCorrection: block.errorCorrection || 'M',
                    align: block.align || 'center'
                };
            case 'feed':
                return { type: 'feed', lines: block.lines || 1 };
            case 'cut':
                return { type: 'cut', mode: block.mode || 'partial', feedBefore: 0 };
            default:
                return { type: 'feed', lines: 1 };
        }
    });
}

/** Representasi baris teks dari model — dipakai unit test & preview. */
export function modelToLines(model) {
    return model.blocks.map((block) => {
        if (block.type === 'text') return block.value;
        if (block.type === 'divider') return '-'.repeat(model.columns);
        if (block.type === 'qr') return `[QR:${block.value}]`;
        if (block.type === 'feed') return `[FEED:${block.lines}]`;
        if (block.type === 'cut') return '[CUT]';
        return '';
    });
}
