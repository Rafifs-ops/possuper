/**
 * Custom ESM loader untuk Node.js yang menambahkan ekstensi .js
 * pada import tanpa ekstensi (dipakai oleh source Vite).
 * Jalankan: node --import ./tests/register-loader.mjs tests/thermalPrinter.test.js
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./esm-loader.mjs', pathToFileURL('./tests/'));
