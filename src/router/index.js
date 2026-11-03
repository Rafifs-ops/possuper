import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'
import ScanView from '../pages/ScanView.vue'
import InputView from '../pages/InputView.vue'
import ListView from '../pages/ListView.vue'
import HppView from '../pages/HppView.vue'
import BiayaView from '../pages/BiayaView.vue'
import DashboardView from '../pages/DashboardView.vue'
import { useStoreProfile } from '../composables/useStoreProfile'
import { useToast } from '../composables/useToast'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/scan', name: 'scan', component: ScanView },
    { path: '/input', name: 'input', component: InputView },
    { path: '/list', name: 'list', component: ListView },
    { path: '/hpp', name: 'hpp', component: HppView },
    { path: '/biaya', name: 'biaya', component: BiayaView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/receipt', name: 'receipt', component: () => import('../pages/ReceiptView.vue') },
    { path: '/history', name: 'history', component: () => import('../pages/SalesHistoryView.vue') },
    { path: '/store-profile', name: 'store-profile', component: () => import('../pages/StoreProfileView.vue') },
    { path: '/backup', name: 'backup', component: () => import('../pages/BackupView.vue') },
    { path: '/printer-settings', name: 'printer-settings', component: () => import('../pages/PrinterSettingsView.vue') },
    { path: '/cash-flow', name: 'cash-flow', component: () => import('../pages/CashFlowView.vue') },
    { path: '/about', name: 'about', component: () => import('../pages/AboutView.vue') },
    { path: '/guide', name: 'guide', component: () => import('../pages/GuideView.vue') }
  ],
  scrollBehavior(to, from, savedPosition) {
    // Kembali ke posisi scroll sebelumnya jika user menekan tombol Back/Forward di browser
    if (savedPosition) {
      return savedPosition
    } else {
      // Selalu scroll ke paling atas (x: 0, y: 0) saat pindah halaman
      return { top: 0 }
    }
  }
})

// Navigation Guard: Cegah akses ke Kasir (/scan) jika identitas toko belum diisi
router.beforeEach((to, from, next) => {
  if (to.path === '/scan' || to.name === 'scan') {
    const { isStoreProfileComplete } = useStoreProfile()
    if (!isStoreProfileComplete.value) {
      const { showToast } = useToast()
      showToast('Harap lengkapi nama dan alamat toko terlebih dahulu sebelum membuka kasir!', 'warning', 4000)
      return next('/store-profile')
    }
  }
  next()
})

export default router