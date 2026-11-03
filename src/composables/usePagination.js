import { ref, computed } from 'vue';

export function usePagination(filteredItems, initialPerPage = 10) {
    const currentPage = ref(1);
    const itemsPerPage = ref(initialPerPage);

    const totalPages = computed(() =>
        Math.max(1, Math.ceil(filteredItems.value.length / itemsPerPage.value))
    );

    const paginatedItems = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage.value;
        return filteredItems.value.slice(start, start + itemsPerPage.value);
    });

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
        }
    };

    const nextPage = () => {
        if (currentPage.value < totalPages.value) currentPage.value++;
    };

    const prevPage = () => {
        if (currentPage.value > 1) currentPage.value--;
    };

    const goToFirstPage = () => { currentPage.value = 1; };
    const goToLastPage = () => { currentPage.value = totalPages.value; };

    const getPageNumbers = computed(() => {
        const pages = [];
        const total = totalPages.value;
        const current = currentPage.value;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else if (current <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        } else if (current >= total - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = total - 3; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = current - 1; i <= current + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(total);
        }
        return pages;
    });

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        paginatedItems,
        goToPage,
        nextPage,
        prevPage,
        goToFirstPage,
        goToLastPage,
        getPageNumbers
    };
}
