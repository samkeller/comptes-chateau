
/**
 * Traduit une date au format DD/MM/YYYY en objet Date
 * @param dateStr 
 * @returns 
 */
export function parseLocaleIsoDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
}

 /** Convertit une Date (stockée en "date" SQL) en string API YYYY-MM-DD (timezone-safe). */
 export function formatApiDate(date: Date): string {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, "0");
     const day = String(date.getDate()).padStart(2, "0");
     return `${year}-${month}-${day}`;
 }