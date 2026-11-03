/**
 * Encoder ESC/POS minimal untuk printer thermal generik (58mm & 80mm).
 *
 * Semua fungsi mengembalikan Uint8Array sehingga mudah digabung, diuji unit,
 * dan dikirim ke printer (dikonversi ke base64 untuk item `raw` milik plugin).
 *
 * Sumber: command set ESC/POS standar (Epson-compatible) yang dipakai hampir
 * semua printer generik. Fitur yang tidak didukung printer biasanya diabaikan
 * oleh firmware — tetap disediakan dengan fallback aman di receiptFormatter.
 */

const ALIGN = { left: 0, center: 1, right: 2 };

/** Pemetaan karakter di luar Latin-1 ke kode Windows-1252. */
const CP1252_EXTRA = {
    '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85,
    'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94,
    '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99,
    'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f
};

/** Ubah string menjadi byte 1-char-per-byte (Windows-1252-ish, aman untuk ESC/POS). */
export function encodeText(value) {
    const input = String(value ?? '');
    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
        const code = input.charCodeAt(i);
        if (code <= 0xff) {
            out[i] = code;
        } else if (CP1252_EXTRA[input[i]] !== undefined) {
            out[i] = CP1252_EXTRA[input[i]];
        } else {
            out[i] = 0x3f; // '?'
        }
    }
    return out;
}

export function concat(chunks) {
    const list = chunks.filter(Boolean);
    const total = list.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    list.forEach((chunk) => {
        out.set(chunk, offset);
        offset += chunk.length;
    });
    return out;
}

const bytes = (...values) => Uint8Array.from(values);

/** ESC @ — reset printer ke kondisi awal. */
export const init = () => bytes(0x1b, 0x40);

/** ESC a n — alignment (left/center/right). */
export function align(mode = 'left') {
    return bytes(0x1b, 0x61, ALIGN[mode] ?? 0);
}

/** ESC E n — bold on/off. */
export function bold(enabled = true) {
    return bytes(0x1b, 0x45, enabled ? 1 : 0);
}

/** GS ! n — ukuran font (width & height multiplier 1..8). */
export function characterSize({ width = 1, height = 1 } = {}) {
    const w = Math.min(8, Math.max(1, width)) - 1;
    const h = Math.min(8, Math.max(1, height)) - 1;
    return bytes(0x1d, 0x21, (h << 4) | w);
}

/** ESC M n — pilih font (A=0, B=1). */
export function fontFace(face = 'A') {
    return bytes(0x1b, 0x4d, String(face).toUpperCase() === 'B' ? 1 : 0);
}

/** LF — newline. */
export const newline = () => bytes(0x0a);

/** ESC d n — feed n baris. */
export function feed(lines = 1) {
    const n = Math.min(127, Math.max(0, Number(lines) || 0));
    return bytes(0x1b, 0x64, n);
}

/**
 * GS V n — potong kertas.
 * mode 'full' (0) / 'partial' (1). Printer tanpa auto-cutter mengabaikan perintah ini.
 */
export function cut(mode = 'partial') {
    return bytes(0x1d, 0x56, mode === 'full' ? 0 : 1);
}

/** Teks + newline. */
export function line(value, { end = true } = {}) {
    const chunk = encodeText(value);
    return end ? concat([chunk, newline()]) : chunk;
}

/** Garis pemisah sepanjang kolom. */
export function divider(columns = 32, char = '-') {
    const safeChar = String(char || '-')[0] || '-';
    return line(safeChar.repeat(Math.max(1, columns)));
}

/**
 * GS ( k — QR Code (model 2).
 * size: 1..16 (module size), ec: 'L' | 'M' | 'Q' | 'H'.
 * Fallback aman: jika printer tidak mengenali perintah, ia mencetak kosong
 * (tidak mematikan job), sehingga baris lain tetap tercetak.
 */
export function qrCode(value, { size = 6, ec = 'M' } = {}) {
    const payload = encodeText(String(value ?? ''));
    const ecMap = { L: 48, M: 49, Q: 50, H: 51 };
    const ecByte = ecMap[ec] ?? ecMap.M;
    const moduleSize = Math.min(16, Math.max(1, Number(size) || 6));

    const storeLength = payload.length + 3;
    const pL = storeLength & 0xff;
    const pH = (storeLength >> 8) & 0xff;

    return concat([
        // Model 2
        bytes(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),
        // Level koreksi error
        bytes(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x45, ecByte),
        // Ukuran modul
        bytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x50, moduleSize),
        // Simpan data
        bytes(0x1d, 0x28, 0x6b, pL, pH, 0x30),
        payload,
        // Cetak
        bytes(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)
    ]);
}

/** Konversi Uint8Array ke base64 (aman untuk data besar). */
export function toBase64(data) {
    const bytesView = data instanceof Uint8Array ? data : Uint8Array.from(data);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytesView.length; i += chunkSize) {
        const slice = bytesView.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, slice);
    }
    return (typeof btoa === 'function')
        ? btoa(binary)
        : Buffer.from(bytesView).toString('base64');
}

/** Dump heksadesimal untuk pengujian/unit test & debug. */
export function hexDump(data) {
    return Array.from(data)
        .map((value) => value.toString(16).padStart(2, '0'))
        .join(' ');
}
