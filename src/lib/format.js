export function formatCurrency(num) {
    if (num == null) return "₱0.00";
    return `₱${(+num).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
export function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-PH", {dateStyle: "medium"});
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
