/** Horizon (jours calendaires, inclus) au-delà duquel une date n'est plus « bientôt périmée ». */
export const STOCK_EXPIRING_SOON_DAYS = 30;

export const STOCK_EXPIRY_STATES = ["expired", "soon", "ok", "none"] as const;
export type StockExpiryState = typeof STOCK_EXPIRY_STATES[number];

/**
 * État de péremption d'une date `YYYY-MM-DD`, en jours calendaires :
 * - `expired` : strictement avant aujourd'hui (une échéance aujourd'hui est encore consommable) ;
 * - `soon` : entre aujourd'hui et aujourd'hui + 30 jours inclus ;
 * - `ok` : au-delà ; `none` : pas de date.
 *
 * @param today Date du jour au format `YYYY-MM-DD`.
 * @param soonLimit Date du jour + 30 jours au format `YYYY-MM-DD`.
 */
export function getStockExpiryState(expirationDate: string | null, today: string, soonLimit: string): StockExpiryState {
    if (!expirationDate) return "none";
    if (expirationDate < today) return "expired";
    if (expirationDate <= soonLimit) return "soon";
    return "ok";
}
