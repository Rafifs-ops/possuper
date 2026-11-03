<template>
  <Transition name="toast">
    <div v-if="toastState.show" class="toast-wrapper" :class="toastState.type">
      <div class="toast-content">
        <span class="icon">
          <svg v-if="toastState.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="toastState.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else-if="toastState.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span class="message">{{ toastState.message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useToast } from '@/composables/useToast';

const { toastState } = useToast();
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 280px;
  max-width: min(90vw, 420px);
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: 0 12px 28px -12px rgba(38, 70, 83, 0.45);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.message {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--color-ink);
  word-break: break-word;
}

/* Status colors stay distinguishable, harmonised with the POSSuper palette */
.success {
  background-color: var(--color-success-soft);
  border-color: color-mix(in srgb, var(--color-success) 35%, transparent);
  color: var(--color-success);
}

.error {
  background-color: var(--color-danger-soft);
  border-color: color-mix(in srgb, var(--color-danger) 35%, transparent);
  color: var(--color-danger);
}

.warning {
  background-color: var(--color-warning-soft);
  border-color: color-mix(in srgb, var(--color-warning) 35%, transparent);
  color: var(--color-warning);
}

.info {
  background-color: var(--color-info-soft);
  border-color: color-mix(in srgb, var(--color-info) 35%, transparent);
  color: var(--color-info);
}

.success .message { color: var(--color-ink); }
.error .message { color: var(--color-ink); }
.warning .message { color: var(--color-ink); }
.info .message { color: var(--color-ink); }

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
