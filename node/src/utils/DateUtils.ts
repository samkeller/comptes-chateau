

/**
 * Traduit une date au format DD/MM/YYYY en objet Date
 * @param dateStr 
 * @returns 
 */
export function parseLocaleIsoDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
}