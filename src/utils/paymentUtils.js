// utils/paymentUtils.js

/**
 * Payment provider mapping from value to display label
 * Based on the API resources/lang/en/payment.php configuration
 */
export const PAYMENT_PROVIDERS = {
    'bank_transfer': 'Bank Transfer',
    'bank_bdo': 'Bank Transfer (BDO)',
    'bank_bpi': 'Bank Transfer (BPI)',
    'bank_metrobank': 'Bank Transfer (Metrobank)',
    'bank_unionbank': 'Bank Transfer (Unionbank)',
    'gcash': 'GCash',
    'paymaya': 'PayMaya',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'paypal': 'PayPal',
    // Additional providers used in the application
    'netania': 'Netania',
    'cash': 'Cash (On-site)',
};

/**
 * Get the display label for a payment provider
 * @param {string} provider - The provider value
 * @returns {string} - The display label or the original value if not found
 */
export const getPaymentProviderLabel = (provider) => {
    return PAYMENT_PROVIDERS[provider] || provider;
};

/**
 * Get all payment providers as options for forms
 * Note: This maintains the existing form options and doesn't change the AddPaymentDialog
 * @returns {Array} - Array of {value, label} objects
 */
export const getPaymentProviderOptions = () => {
    return Object.entries(PAYMENT_PROVIDERS).map(([value, label]) => ({
        value,
        label
    }));
};
