/**
 * Unit test untuk modul thermal printer POSSuper.
 * Jalankan: node tests/thermalPrinter.test.js
 *
 * Mengimpor modul murni (tanpa DOM / localStorage) untuk menguji
 * encoder ESC/POS dan receipt formatter.
 */

import { strict as assert } from 'node:assert';

// ---------------------------------------------------------------------------
// Impor modul yang diuji
// ---------------------------------------------------------------------------

import {
    encodeText,
    concat,
    init,
    align,
    bold,
    characterSize,
    fontFace,
    newline,
    feed,
    cut,
    line,
    divider,
    qrCode,
    toBase64,
    hexDump
} from '../src/utils/thermalPrinter/escposCommands.js';

import {
    formatRupiah,
    wrapText,
    twoColumn,
    buildReceiptModel,
    buildTestModel,
    renderEscPos,
    modelToPrintItems,
    modelToLines
} from '../src/utils/thermalPrinter/receiptFormatter.js';

import {
    getPaperProfile,
    PAPER_SIZES,
    CONNECTION_STATUS,
    ERROR_MESSAGES
} from '../src/utils/thermalPrinter/printerConstants.js';

// ---------------------------------------------------------------------------
// Test runner sederhana
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed += 1;
        console.log(`  PASS  ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`  FAIL  ${name}`);
        console.error(`        ${error.message}`);
    }
}

function eq(actual, expected, label = '') {
    const a = typeof actual === 'string' ? actual : JSON.stringify(actual);
    const e = typeof expected === 'string' ? expected : JSON.stringify(expected);
    assert.equal(a, e, `${label}\n  actual:   ${a}\n  expected: ${e}`);
}

function ok(value, label = 'expected truthy') {
    assert.ok(value, label);
}

// ===========================================================================
console.log('\n=== ESC/POS Encoder ===');
// ===========================================================================

test('init() menghasilkan 1B 40', () => {
    eq(hexDump(init()), '1b 40');
});

test('align(left) = 1B 61 00', () => {
    eq(hexDump(align('left')), '1b 61 00');
});

test('align(center) = 1B 61 01', () => {
    eq(hexDump(align('center')), '1b 61 01');
});

test('align(right) = 1B 61 02', () => {
    eq(hexDump(align('right')), '1b 61 02');
});

test('align(tidak dikenal) fallback ke left', () => {
    eq(hexDump(align('xyz')), '1b 61 00');
});

test('bold(true) = 1B 45 01', () => {
    eq(hexDump(bold(true)), '1b 45 01');
});

test('bold(false) = 1B 45 00', () => {
    eq(hexDump(bold(false)), '1b 45 00');
});

test('characterSize(1,1) = 1D 21 00', () => {
    eq(hexDump(characterSize({ width: 1, height: 1 })), '1d 21 00');
});

test('characterSize(2,2) = 1D 21 11', () => {
    eq(hexDump(characterSize({ width: 2, height: 2 })), '1d 21 11');
});

test('characterSize clamp ke 1..8', () => {
    // 0 -> 1, 99 -> 8
    const zero = characterSize({ width: 0, height: 0 });
    eq(hexDump(zero), '1d 21 00');
    const big = characterSize({ width: 99, height: 99 });
    eq(hexDump(big), '1d 21 77');
});

test('fontFace(A) = 1B 4D 00', () => {
    eq(hexDump(fontFace('A')), '1b 4d 00');
});

test('fontFace(B) = 1B 4D 01', () => {
    eq(hexDump(fontFace('B')), '1b 4d 01');
});

test('newline() = 0A', () => {
    eq(hexDump(newline()), '0a');
});

test('feed(1) = 1B 64 01', () => {
    eq(hexDump(feed(1)), '1b 64 01');
});

test('feed(5) = 1B 64 05', () => {
    eq(hexDump(feed(5)), '1b 64 05');
});

test('feed clamp 0..127', () => {
    eq(hexDump(feed(-5)), '1b 64 00');
    eq(hexDump(feed(999)), '1b 64 7f');
});

test('cut(partial) = 1D 56 01', () => {
    eq(hexDump(cut('partial')), '1d 56 01');
});

test('cut(full) = 1D 56 00', () => {
    eq(hexDump(cut('full')), '1d 56 00');
});

test('line("ABC") menghasilkan teks + newline', () => {
    const result = line('ABC');
    // 41 42 43 0A
    eq(hexDump(result), '41 42 43 0a');
});

test('line("ABC", { end: false }) tanpa newline', () => {
    eq(hexDump(line('ABC', { end: false })), '41 42 43');
});

test('divider(32) menghasilkan 32 strip + newline', () => {
    const result = divider(32);
    // 32 x '-' (0x2d) + 0A = 33 bytes
    eq(result.length, 33);
    ok(result[0] === 0x2d, 'harus diawali strip');
    ok(result[32] === 0x0a, 'harus diakhiri newline');
});

test('encodeText: karakter Latin-1', () => {
    const result = encodeText('ABC');
    eq(hexDump(result), '41 42 43');
});

test('encodeText: karakter di luar Latin-1 -> "?"', () => {
    const result = encodeText('你好');
    eq(hexDump(result), '3f 3f');
});

test('encodeText: null/undefined -> string kosong', () => {
    eq(encodeText(null).length, 0);
    eq(encodeText(undefined).length, 0);
});

test('encodeText: karakter khusus CP1252', () => {
    // '€' = 0x80 di Windows-1252
    eq(encodeText('€')[0], 0x80);
});

test('concat: gabung beberapa chunk', () => {
    const a = Uint8Array.from([1, 2]);
    const b = Uint8Array.from([3, 4]);
    const result = concat([a, b]);
    eq(hexDump(result), '01 02 03 04');
});

test('concat: skip null/undefined', () => {
    const a = Uint8Array.from([1, 2]);
    const result = concat([a, null, undefined]);
    eq(hexDump(result), '01 02');
});

test('qrCode: menghasilkan perintah GS ( k', () => {
    const result = qrCode('https://example.com', { size: 6, ec: 'M' });
    // Harus diawali 1D 28 6B (GS ( k)
    ok(result[0] === 0x1d, 'byte pertama = GS');
    ok(result[1] === 0x28, 'byte kedua = (');
    ok(result[2] === 0x6b, 'byte ketiga = k');
    ok(result.length > 10, 'panjang wajar');
});

test('toBase64: konversi Uint8Array ke base64', () => {
    const data = Uint8Array.from([72, 101, 108, 108, 111]); // "Hello"
    eq(toBase64(data), 'SGVsbG8=');
});

test('toBase64: data kosong', () => {
    eq(toBase64(new Uint8Array(0)), '');
});

// ===========================================================================
console.log('\n=== Printer Constants ===');
// ===========================================================================

test('getPaperProfile(58) = 32 kolom', () => {
    const p = getPaperProfile(58);
    eq(p.columns, 32);
    eq(p.dots, 384);
    eq(p.widthMm, 58);
});

test('getPaperProfile(80) = 48 kolom', () => {
    const p = getPaperProfile(80);
    eq(p.columns, 48);
    eq(p.dots, 576);
    eq(p.widthMm, 80);
});

test('getPaperProfile(null) fallback ke 80', () => {
    const p = getPaperProfile(null);
    eq(p.widthMm, 80);
});

test('getPaperProfile(100) fallback ke 80', () => {
    const p = getPaperProfile(100);
    eq(p.widthMm, 80);
});

test('CONNECTION_STATUS memiliki semua status', () => {
    ok(CONNECTION_STATUS.IDLE);
    ok(CONNECTION_STATUS.CONNECTING);
    ok(CONNECTION_STATUS.CONNECTED);
    ok(CONNECTION_STATUS.DISCONNECTED);
    ok(CONNECTION_STATUS.ERROR);
    ok(CONNECTION_STATUS.SCANNING);
});

test('ERROR_MESSAGES memiliki semua kode error', () => {
    const codes = [
        'PRINTER_NOT_FOUND', 'CONNECTION_FAILED', 'PERMISSION_DENIED',
        'BLUETOOTH_DISABLED', 'PRINT_FAILED', 'PAPER_EMPTY', 'COVER_OPEN',
        'SDK_NOT_AVAILABLE', 'TIMEOUT'
    ];
    codes.forEach(code => {
        ok(ERROR_MESSAGES[code], `ERROR_MESSAGES[${code}] harus ada`);
    });
});

// ===========================================================================
console.log('\n=== Receipt Formatter: formatRupiah ===');
// ===========================================================================

test('formatRupiah(10000) = Rp10.000', () => {
    eq(formatRupiah(10000), 'Rp10.000');
});

test('formatRupiah(5000) = Rp5.000', () => {
    eq(formatRupiah(5000), 'Rp5.000');
});

test('formatRupiah(0) = Rp0', () => {
    eq(formatRupiah(0), 'Rp0');
});

test('formatRupiah(150000) = Rp150.000', () => {
    eq(formatRupiah(150000), 'Rp150.000');
});

test('formatRupiah(1000000) = Rp1.000.000', () => {
    eq(formatRupiah(1000000), 'Rp1.000.000');
});

test('formatRupiah(1234567) = Rp1.234.567', () => {
    eq(formatRupiah(1234567), 'Rp1.234.567');
});

test('formatRupiah(null) = Rp0', () => {
    eq(formatRupiah(null), 'Rp0');
});

test('formatRupiah(undefined) = Rp0', () => {
    eq(formatRupiah(undefined), 'Rp0');
});

test('formatRupiah("abc") = Rp0', () => {
    eq(formatRupiah('abc'), 'Rp0');
});

test('formatRupiah(-5000) = -Rp5.000', () => {
    eq(formatRupiah(-5000), '-Rp5.000');
});

test('formatRupiah(100) = Rp100 (tanpa pemisah)', () => {
    eq(formatRupiah(100), 'Rp100');
});

test('formatRupiah(999) = Rp999', () => {
    eq(formatRupiah(999), 'Rp999');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: wrapText ===');
// ===========================================================================

test('wrapText: teks pendek tidak dipecah', () => {
    const result = wrapText('Kopi', 20);
    eq(result.length, 1);
    eq(result[0], 'Kopi');
});

test('wrapText: teks panjang dipecah', () => {
    const result = wrapText('Kopi Sachet Spesial Premium Arabica', 20);
    ok(result.length > 1, 'harus lebih dari 1 baris');
    result.forEach(line => {
        ok(line.length <= 20, `baris "${line}" panjang ${line.length} > 20`);
    });
});

test('wrapText: kata lebih panjang dari lebar', () => {
    const result = wrapText('Supercalifragilisticexpialidocious', 10);
    ok(result.length > 1, 'harus dipecah');
    result.forEach(line => {
        ok(line.length <= 10, `baris "${line}" panjang ${line.length} > 10`);
    });
});

test('wrapText: string kosong', () => {
    const result = wrapText('', 20);
    eq(result.length, 1);
    eq(result[0], '');
});

test('wrapText: null', () => {
    const result = wrapText(null, 20);
    eq(result.length, 1);
});

test('wrapText: lebar 1', () => {
    const result = wrapText('ABC', 1);
    eq(result.length, 3);
    eq(result[0], 'A');
    eq(result[1], 'B');
    eq(result[2], 'C');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: twoColumn ===');
// ===========================================================================

test('twoColumn: teks kiri + nominal rata kanan', () => {
    const result = twoColumn('TOTAL', 'Rp10.000', 32);
    eq(result.length, 32);
    ok(result.startsWith('TOTAL'), 'diawali TOTAL');
    ok(result.endsWith('Rp10.000'), 'diakhiri Rp10.000');
});

test('twoColumn: teks kiri terlalu panjang dipotong', () => {
    const left = 'A'.repeat(40);
    const result = twoColumn(left, 'Rp10.000', 32);
    eq(result.length, 32);
    ok(!result.includes('A'.repeat(33)), 'tidak boleh ada 33 A');
});

test('twoColumn: nominal kosong', () => {
    const result = twoColumn('Item', '', 32);
    eq(result.length, 32);
    ok(result.startsWith('Item'));
});

test('twoColumn: lebar sangat kecil', () => {
    const result = twoColumn('A', 'B', 1);
    ok(result.length >= 1, 'panjang minimal 1');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: buildReceiptModel ===');
// ===========================================================================

const sampleTransaksi = {
    id: 1024,
    tanggal: '2026-10-30 15:20:11',
    totalPenjualan: 18000,
    totalHpp: 12000,
    items: [
        { id: '8990001', nama: 'Kopi Sachet', harga: 5000, hpp: 3000, quantity: 2 },
        { id: '8990002', nama: 'Roti Coklat', harga: 8000, hpp: 6000, quantity: 1 }
    ],
    tokenNota: 'eyJhbGciOiJIUzI1NiJ9.payload.signature'
};

const sampleProfile = {
    namaToko: 'Warung POSSuper',
    alamatToko: 'Jl. Melati No. 10, Bandung',
    noHp: '081234567890'
};

test('buildReceiptModel: transaksi normal menghasilkan blok', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    ok(model.blocks.length > 0, 'harus ada blok');
    eq(model.columns, 48);
    eq(model.paper.widthMm, 80);
});

test('buildReceiptModel: tanpa transaksi melempar error', () => {
    assert.throws(() => {
        buildReceiptModel({ transaksi: null });
    }, /Transaksi wajib/);
});

test('buildReceiptModel: nama toko muncul di blok', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    const hasToko = lines.some(l => l.includes('Warung POSSuper'));
    ok(hasToko, 'nama toko harus muncul');
});

test('buildReceiptModel: alamat toko muncul', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('Jl. Melati')), 'alamat harus muncul');
});

test('buildReceiptModel: noHp muncul jika tersedia', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('081234567890')), 'noHp harus muncul');
});

test('buildReceiptModel: tanpa noHp tidak menampilkan Telp', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: { namaToko: 'Toko', alamatToko: 'Alamat' },
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(!lines.some(l => l.includes('Telp/WA')), 'tidak boleh ada Telp/WA');
});

test('buildReceiptModel: nomor transaksi muncul', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('#1024')), 'nomor transaksi harus muncul');
});

test('buildReceiptModel: total dari totalPenjualan', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('Rp18.000')), 'total harus Rp18.000');
});

test('buildReceiptModel: item muncul di struk', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('Kopi Sachet')), 'Kopi Sachet harus muncul');
    ok(lines.some(l => l.includes('Roti Coklat')), 'Roti Coklat harus muncul');
});

test('buildReceiptModel: QR tokenNota dipertahankan', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    const qrLine = lines.find(l => l.startsWith('[QR:'));
    ok(qrLine, 'harus ada blok QR');
    ok(qrLine.includes(sampleTransaksi.tokenNota), 'tokenNota harus ada di QR');
});

test('buildReceiptModel: includeQr=false tidak menampilkan QR', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80,
        includeQr: false
    });
    const lines = modelToLines(model);
    ok(!lines.some(l => l.startsWith('[QR:')), 'tidak boleh ada QR');
});

test('buildReceiptModel: 58mm = 32 kolom', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 58
    });
    eq(model.columns, 32);
});

test('buildReceiptModel: 80mm = 48 kolom', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    eq(model.columns, 48);
});

test('buildReceiptModel: nama produk panjang di-wrap', () => {
    const longName = 'Kopi Arabika Premium Special Blend Gayo Highland Coffee';
    const model = buildReceiptModel({
        transaksi: {
            ...sampleTransaksi,
            items: [{ id: '1', nama: longName, harga: 50000, hpp: 30000, quantity: 1 }]
        },
        profile: sampleProfile,
        paperWidthMm: 58
    });
    const lines = modelToLines(model);
    // Tidak ada baris teks yang melebihi kolom (kecuali blok QR/FEED/CUT)
    lines.forEach(l => {
        if (l.startsWith('[')) return;
        ok(l.length <= 32, `baris "${l}" panjang ${l.length} > 32`);
    });
});

test('buildReceiptModel: banyak item tetap valid', () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        nama: `Produk ${i + 1}`,
        harga: 1000 * (i + 1),
        hpp: 500 * (i + 1),
        quantity: i + 1
    }));
    const model = buildReceiptModel({
        transaksi: { ...sampleTransaksi, items: manyItems, totalPenjualan: 210000 },
        profile: sampleProfile,
        paperWidthMm: 80
    });
    ok(model.blocks.length > 20, 'harus ada banyak blok');
});

test('buildReceiptModel: total konsisten dengan record', () => {
    // Formatter harus menggunakan totalPenjualan yang tersimpan, bukan hitung ulang
    const transaksi = {
        id: 1,
        tanggal: '2026-01-01 10:00:00',
        totalPenjualan: 99999,
        items: [{ id: 'x', nama: 'X', harga: 1000, hpp: 500, quantity: 1 }],
        tokenNota: 'tok'
    };
    const model = buildReceiptModel({
        transaksi,
        profile: {},
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('Rp99.999')), 'total harus Rp99.999 dari record');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: buildTestModel ===');
// ===========================================================================

test('buildTestModel: menghasilkan blok test', () => {
    const model = buildTestModel({
        storeName: 'Warung Test',
        printerName: 'Printer-01',
        paperWidthMm: 58
    });
    const lines = modelToLines(model);
    ok(lines.some(l => l.includes('TEST PRINT')), 'harus ada TEST PRINT');
    ok(lines.some(l => l.includes('Warung Test')), 'nama toko harus muncul');
    ok(lines.some(l => l.includes('Printer-01')), 'nama printer harus muncul');
    eq(model.columns, 32);
});

test('buildTestModel: default 80mm', () => {
    const model = buildTestModel();
    eq(model.paper.widthMm, 80);
});

// ===========================================================================
console.log('\n=== Receipt Formatter: renderEscPos ===');
// ===========================================================================

test('renderEscPos: output adalah Uint8Array', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const bytes = renderEscPos(model);
    ok(bytes instanceof Uint8Array, 'harus Uint8Array');
    ok(bytes.length > 10, 'panjang wajar');
});

test('renderEscPos: diawali init (ESC @)', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const bytes = renderEscPos(model);
    eq(bytes[0], 0x1b);
    eq(bytes[1], 0x40);
});

test('renderEscPos: mengandung perintah newline', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const bytes = renderEscPos(model);
    ok(bytes.includes(0x0a), 'harus ada byte LF');
});

test('renderEscPos: test model mengandung QR command', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80,
        includeQr: true
    });
    const bytes = renderEscPos(model);
    // GS ( k = 1D 28 6B
    let found = false;
    for (let i = 0; i < bytes.length - 2; i++) {
        if (bytes[i] === 0x1d && bytes[i + 1] === 0x28 && bytes[i + 2] === 0x6b) {
            found = true;
            break;
        }
    }
    ok(found, 'harus ada perintah GS ( k untuk QR');
});

test('renderEscPos: mengandung cut command', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80,
        includeCut: true
    });
    const bytes = renderEscPos(model);
    // GS V = 1D 56
    let found = false;
    for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0x1d && bytes[i + 1] === 0x56) {
            found = true;
            break;
        }
    }
    ok(found, 'harus ada perintah GS V untuk cut');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: modelToPrintItems ===');
// ===========================================================================

test('modelToPrintItems: menghasilkan item untuk plugin', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const items = modelToPrintItems(model);
    ok(Array.isArray(items), 'harus array');
    ok(items.length > 0, 'tidak kosong');
    items.forEach(item => {
        ok(item.type, 'setiap item harus punya type');
    });
});

test('modelToPrintItems: item text memiliki style', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const items = modelToPrintItems(model);
    const textItems = items.filter(i => i.type === 'text');
    ok(textItems.length > 0, 'harus ada item text');
    textItems.forEach(item => {
        ok(item.style, 'item text harus punya style');
        ok(typeof item.value === 'string', 'item text harus punya value string');
    });
});

test('modelToPrintItems: item qrcode memiliki value', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80,
        includeQr: true
    });
    const items = modelToPrintItems(model);
    const qrItems = items.filter(i => i.type === 'qrcode');
    ok(qrItems.length > 0, 'harus ada item qrcode');
    qrItems.forEach(item => {
        ok(item.value.includes(sampleTransaksi.tokenNota), 'QR harus berisi tokenNota');
    });
});

test('modelToPrintItems: item divider', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const items = modelToPrintItems(model);
    const dividers = items.filter(i => i.type === 'divider');
    ok(dividers.length >= 2, 'minimal 2 divider');
});

test('modelToPrintItems: item cut di akhir', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80,
        includeCut: true
    });
    const items = modelToPrintItems(model);
    const cutItems = items.filter(i => i.type === 'cut');
    eq(cutItems.length, 1);
    eq(cutItems[0].mode, 'partial');
});

// ===========================================================================
console.log('\n=== Receipt Formatter: modelToLines ===');
// ===========================================================================

test('modelToLines: mengembalikan array string', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    ok(Array.isArray(lines), 'harus array');
    lines.forEach(l => {
        ok(typeof l === 'string', 'setiap baris harus string');
    });
});

test('modelToLines: divider menghasilkan strip', () => {
    const model = buildReceiptModel({
        transaksi: sampleTransaksi,
        profile: sampleProfile,
        paperWidthMm: 80
    });
    const lines = modelToLines(model);
    const dividerLine = lines.find(l => l === '-'.repeat(48));
    ok(dividerLine, 'harus ada baris divider 48 strip');
});

// ===========================================================================
// Ringkasan
// ===========================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`RINGKASAN: ${passed} PASS, ${failed} FAIL`);
console.log('='.repeat(50));

if (failed > 0) {
    process.exit(1);
}
