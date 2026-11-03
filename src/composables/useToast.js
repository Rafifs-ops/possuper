import { ref } from 'vue';

const toastState = ref({
    show: false,
    message: '',
    type: 'success', // 'success', 'error', 'warning', 'info'
});

let timeoutId = null;

export function useToast() {
    const showToast = (message, type = 'success', duration = 3000) => {
        toastState.value.message = message;
        toastState.value.type = type;
        toastState.value.show = true;

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            toastState.value.show = false;
        }, duration);
    };

    const hideToast = () => {
        toastState.value.show = false;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };

    return {
        toastState,
        showToast,
        hideToast,
    };
}
