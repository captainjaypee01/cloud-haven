import { formatCurrency } from '@/utils/currency';

export const CART_LIST_VIEWS = {
    detailed: { id: 'detailed', label: 'Detailed', description: 'Full cards with meal & fee breakdown' },
    compact: { id: 'compact', label: 'Compact', description: 'Dense rows — best for many rooms' },
    accordion: { id: 'accordion', label: 'Accordion', description: 'Collapsed list — expand only what you need' },
};

export const CART_LIST_VIEW_STORAGE_KEY = 'cart-list-view';

export function getRoomLineTotal(item, isDayTourCart = false) {
    if (isDayTourCart) {
        return item.price ?? item.subtotal ?? 0;
    }
    return (
        (item.subtotal || 0) +
        (item.roomMealTotal || 0) +
        (item.roomExtraGuestFeeTotal || 0)
    );
}

export function formatGuestSummary(item) {
    if (item.roomType === 'day_tour') {
        return `${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''}`;
    }
    const parts = [`${item.adults}A`];
    if (item.children > 0) parts.push(`${item.children}C`);
    return parts.join(', ');
}

export function formatRoomPriceHint(item, numNights, isDayTourCart) {
    if (isDayTourCart) {
        return `${formatCurrency(item.pricePerPax)} / person`;
    }
    return `${formatCurrency(item.price)} / night × ${numNights}`;
}
