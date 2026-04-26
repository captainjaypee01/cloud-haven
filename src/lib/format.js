export function formatCurrency(num) {
    if (num == null) return "₱0.00";
    return `₱${(+num).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
export function formatDate(date) {
    if (!date) return "-";
    // Keep date-only values stable across client timezones (e.g. booking dates).
    const dateString = typeof date === "string" ? date : "";
    const dateOnlyMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const safeDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        return safeDate.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "UTC" });
    }

    return new Date(date).toLocaleDateString("en-PH", { dateStyle: "medium" });
}
export function formatDateTime(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}
export function formatTime(time) {
    if (!time) return "-";
    // Expects HH:mm:ss or HH:mm
    return time.length > 5 ? time.slice(0, 5) : time;
}
