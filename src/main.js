import { createApp } from 'vue';
import { Capacitor } from '@capacitor/core';
import App from './App.vue';
import router from './router';
import { initPwaInstall } from './composables/usePwaInstall';
import './assets/main.css';

// Tangkap beforeinstallprompt sedini mungkin agar kartu Install PWA akurat.
initPwaInstall();

// Service worker hanya untuk distribusi web/PWA. Aplikasi Android native
// (Capacitor) memuat aset dari WebView lokal dan tidak memakai service worker,
// sehingga tidak ada konflik cache antara SW dan file build Android.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch((error) => {
      console.warn('Service worker PWA tidak dapat didaftarkan:', error);
    });
}

const app = createApp(App);

app.use(router);

app.mount('#app');
