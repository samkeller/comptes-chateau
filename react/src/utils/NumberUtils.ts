
/**
 * Convertit un montant en une chaîne de caractères formatée en euros.
 * @param amount 
 * @returns 
 */
export function toMonetaryAmount(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}