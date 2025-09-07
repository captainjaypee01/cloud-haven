import { API_PREFIX } from "@/constants/api";

/**
 * Fetch Day Tour availability for a specific date
 * @param {object} api - useApi() instance
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} API response with availability data
 */
export const fetchDayTourAvailability = (api, date) => 
    api.get(`${API_PREFIX}/day-tours/availability`, { 
        params: { date } 
    }).then(r => r.data);

/**
 * Get a quote for Day Tour selections
 * @param {object} api - useApi() instance
 * @param {object} payload - Quote request payload
 * @returns {Promise} API response with quote data
 */
export const quoteDayTour = (api, payload) => 
    api.post(`${API_PREFIX}/quotes/day-tour`, payload).then(r => r.data);

/**
 * Create a Day Tour booking
 * @param {object} api - useApi() instance
 * @param {object} payload - Booking request payload
 * @returns {Promise} API response with booking data
 */
export const createDayTourBooking = (api, payload) => 
    api.post(`${API_PREFIX}/bookings/day-tour`, payload).then(r => r.data);

/**
 * Admin: Update meal program PM snack policy
 * @param {object} api - useApi() instance
 * @param {number} programId - Meal program ID
 * @param {object} data - Update data including pm_snack_policy
 * @returns {Promise} API response
 */
export const updateMealProgramSnackPolicy = (api, programId, data) =>
    api.patch(`${API_PREFIX}/admin/meal-programs/${programId}`, data, { requiresAuth: true }).then(r => r.data);

/**
 * Admin: Update meal pricing tier with lunch/snack/dinner prices
 * @param {object} api - useApi() instance
 * @param {number} tierId - Pricing tier ID
 * @param {object} data - Update data including lunch/snack/dinner price fields
 * @returns {Promise} API response
 */
export const updateMealPricingTier = (api, tierId, data) =>
    api.patch(`${API_PREFIX}/admin/meal-pricing-tiers/${tierId}`, data, { requiresAuth: true }).then(r => r.data);

/**
 * Fetch all Day Tour rooms
 * @param {object} api - useApi() instance
 * @returns {Promise} API response with Day Tour rooms data
 */
export const fetchDayTourRooms = (api) =>
    api.get(`${API_PREFIX}/rooms`, { 
        params: { room_type: 'day_tour' } 
    }).then(r => r.data);

/**
 * Fetch current active Day Tour pricing for a specific date
 * @param {object} api - useApi() instance
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} API response with current pricing data
 */
export const fetchCurrentDayTourPricing = (api, date) =>
    api.get(`${API_PREFIX}/day-tour-pricing/current`, {
        params: { date }
    }).then(r => r.data);

/**
 * Fetch Day Tour meal program data for a specific date (separate from room availability)
 * @param {object} api - useApi() instance
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} API response with meal program data only
 */
export const fetchDayTourMealProgram = async (api, date) => {
    // For now, extract just the meal program data from the availability API
    // This can be changed to a separate endpoint later if needed
    const availabilityData = await fetchDayTourAvailability(api, date);
    
    // Return only the meal program related data
    return {
        buffet_active: availabilityData.buffet_active,
        pm_snack_policy: availabilityData.pm_snack_policy,
        lunch_prices: availabilityData.lunch_prices,
        pm_snack_prices: availabilityData.pm_snack_prices
    };
};
