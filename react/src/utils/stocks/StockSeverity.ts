


/**
* Lie une distance de date avec une sévérité PrimeReact
* - Périmé = error
* - <= 1 mois = warning
* - > 1 mois = info
*/
export function getStockSeverity(expirationDate: Date | null): "error" | "warn" | "info" | null {
    if (!expirationDate) return null;
    const now = new Date();
    const diffInDays = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays <= 0) return "error";
    if (diffInDays <= 30) return "warn";
    return "info";
}