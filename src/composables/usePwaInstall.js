import { computed, ref } from 'vue';
import { Capacitor } from '@capacitor/core';

/**
 * Install experience PWA POSSuper.
 *
 * - Menangkap `beforeinstallprompt` (Chrome/Edge/Android) dan menyimpan deferred
 *   prompt sampai pengguna menekan tombol Install.
 * - Browser yang tidak mendukung prompt custom (iOS Safari, Firefox, dsb.) hanya
 *   diberi petunjuk manual — tidak ada tombol palsu.
 * - Kartu install disembunyikan saat aplikasi sudah berjalan standalone/terinstall,
 *   dan saat berjalan sebagai aplikasi Android native (Capacitor).
 */

const isNativePlatform = Capacitor.isNativePlatform();

function detectStandalone() {
    if (typeof window === 'undefined') return false;
    return Boolean(
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        window.navigator?.standalone === true
    );
}

function detectPlatform() {
    if (typeof navigator === 'undefined') return { isIos: false, isAndroid: false, isChromeDesktop: false };
    const ua = navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua) ||
        (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    const isAndroid = /android/i.test(ua);
    const isChromeDesktop = !isIos && !isAndroid && /chrome|crios|edg\//i.test(ua);
    return { isIos, isAndroid, isChromeDesktop };
}

const isStandalone = ref(detectStandalone());
const isInstalled = ref(isStandalone.value);
const canPromptInstall = ref(false);
const isInstalling = ref(false);
const installError = ref('');
const showManualInstallHint = ref(false);

let deferredPrompt = null;
let initialized = false;

/** Daftarkan listener sedini mungkin (dipanggil dari main.js). */
export function initPwaInstall() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    // Aplikasi Android native tidak memakai service worker / install prompt web.
    if (isNativePlatform) return;

    window.addEventListener('beforeinstallprompt', (event) => {
        // Tahan prompt bawaan browser; tampilkan lewat tombol Install POSSuper.
        event.preventDefault();
        deferredPrompt = event;
        canPromptInstall.value = true;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        canPromptInstall.value = false;
        isStandalone.value = true;
        isInstalled.value = true;
    });

    const media = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChange = () => {
        isStandalone.value = detectStandalone();
        if (isStandalone.value) isInstalled.value = true;
    };
    media?.addEventListener?.('change', onDisplayModeChange);
}

const platform = detectPlatform();

const installHint = computed(() => {
    if (platform.isIos) {
        return 'Buka menu Share di Safari, kemudian pilih "Add to Home Screen".';
    }
    if (platform.isAndroid) {
        return 'Buka menu browser, lalu pilih "Install app" atau "Add to Home Screen".';
    }
    if (platform.isChromeDesktop) {
        return 'Gunakan ikon Install di address bar browser atau menu "Install POSSuper".';
    }
    return 'Buka menu browser, lalu pilih "Install app" atau "Add to Home Screen".';
});

/** Kartu install hanya relevan di web dan sebelum aplikasi terinstall. */
const canShowInstall = computed(() => !isNativePlatform && !isInstalled.value);

function toggleManualInstallHint() {
    showManualInstallHint.value = !showManualInstallHint.value;
}

/**
 * Jalankan prompt instalasi. Harus dipanggil dari aksi pengguna (klik).
 * @returns {Promise<{outcome: string}>}
 */
async function promptInstall() {
    if (!deferredPrompt) {
        return { outcome: 'unavailable' };
    }

    isInstalling.value = true;
    installError.value = '';
    try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
            isInstalled.value = true;
        }
        return { outcome: choice?.outcome || 'dismissed' };
    } catch (error) {
        console.error('Gagal menjalankan instalasi PWA:', error);
        installError.value = 'Instalasi tidak dapat dimulai. Coba melalui menu browser.';
        return { outcome: 'error' };
    } finally {
        // Prompt hanya bisa dipakai sekali.
        deferredPrompt = null;
        canPromptInstall.value = false;
        isInstalling.value = false;
    }
}

export function usePwaInstall() {
    initPwaInstall();
    return {
        isStandalone,
        isInstalled,
        canPromptInstall,
        canShowInstall,
        isInstalling,
        installError,
        installHint,
        showManualInstallHint,
        toggleManualInstallHint,
        promptInstall
    };
}
