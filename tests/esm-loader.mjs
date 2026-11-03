/**
 * Custom ESM resolve hook: menambahkan .js pada import tanpa ekstensi.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
    // Coba resolve apa adanya dulu
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        // Jika gagal dan specifier relatif tanpa ekstensi, coba tambahkan .js
        if (
            (specifier.startsWith('./') || specifier.startsWith('../')) &&
            !specifier.endsWith('.js') &&
            !specifier.endsWith('.mjs') &&
            !specifier.endsWith('.json')
        ) {
            try {
                return await nextResolve(specifier + '.js', context);
            } catch {
                // tetap lempar error asli
            }
        }
        throw error;
    }
}
