// utils/currency.js
export const formatCurrency = (
    value,
    currency = 'PHP',
    locale = 'en-PH'
) => {
    // Handle invalid values
    if (isNaN(value)) {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
        }).format(0);
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};