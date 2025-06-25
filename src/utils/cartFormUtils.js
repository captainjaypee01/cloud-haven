// src/utils/cartFormUtils.js
export function buildCartFormValues(items) {
    const values = {};
    items.forEach(item => {
        values[`adults-${item.uniqueId}`] = String(item.adults);
        values[`children-${item.uniqueId}`] = String(item.children);
    });
    return values;
}
