


/**
* Lie une distance de date avec une sévérité PrimeReact
* - Périmé = error
* - <= 1 mois = warning
*/
export type StockSeverity = "error" | "warn" | null;

export function getStockSeverity(expirationDate: Date | null): StockSeverity {
    if (!expirationDate) return null;
    const now = new Date();
    const diffInDays = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays <= 0) return "error";
    if (diffInDays <= 30) return "warn";
    return null;
}