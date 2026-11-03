<script setup>
import { RouterView } from 'vue-router';
import { onMounted } from 'vue';
import { App } from '@capacitor/app';
import { useRouter, useRoute } from 'vue-router';
import ToastNotification from '@/components/ToastNotification.vue';

const router = useRouter();
const route = useRoute();

onMounted(() => {
  App.addListener('backButton', () => {
    // Cek apakah halaman saat ini adalah halaman utama (Home)
    if (route.path === '/') { // Sesuaikan dengan route halaman utama Anda
      // Tampilkan notifikasi keluar atau langsung keluar dari aplikasi
      App.exitApp();
    } else {
      // Kembali ke halaman sebelumnya
      if (router.options.history.state.back) {
        router.back();
      } else {
        router.push('/'); // Fallback jika tidak ada history
      }
    }
  });
});
</script>

<template>
  <RouterView />
  <ToastNotification />
</template>