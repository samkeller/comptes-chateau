/**
 * Types de mouvement du journal de stock (un mouvement par exemplaire).
 * - `IN` : exemplaire ajouté au stock. Corriger un exemplaire (quantité, unité, lieu) met à jour son `IN` :
 *   le journal décrit ce qui est réellement entré, pas l'historique des corrections ;
 * - `OUT` : exemplaire consommé (« coché ») — base des statistiques de consommation ;
 * - `DELETE` : exemplaire retiré sans consommation (erreur de saisie, jeté…).
 */
export const STOCK_MOVEMENT_TYPES = ["IN", "OUT", "DELETE"] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
