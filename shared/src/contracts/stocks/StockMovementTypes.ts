/**
 * Types de mouvement du journal de stock.
 * - `IN` : exemplaire ajouté au stock ;
 * - `OUT` : exemplaire consommé (« coché ») — base des statistiques de consommation ;
 * - `DELETE` : exemplaire retiré sans consommation (erreur de saisie, jeté…) ;
 * - `ADJUST` : correction d'un exemplaire existant (quantité, unité, lieu, date) ; l'`IN` d'origine n'est jamais modifié.
 */
export const STOCK_MOVEMENT_TYPES = ["IN", "OUT", "DELETE", "ADJUST"] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
