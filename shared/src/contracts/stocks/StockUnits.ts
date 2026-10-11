import { z } from "zod";

/**
 * Unités de contenu d'un exemplaire en stock.
 *
 * Un exemplaire (StockUnit) est déjà « une boîte » / « un paquet » : l'unité décrit son contenu.
 * - `pièce` pour un contenu dénombrable (6 œufs, 1 baguette…) ;
 * - masses et volumes alignés sur les unités exposées par OpenFoodFacts.
 */
export const STOCK_UNIT_UNITS = ["pièce", "g", "kg", "ml", "cl", "L"] as const;
export type StockUnitUnits = typeof STOCK_UNIT_UNITS[number];

/** Validation d'entrée : accepte les alias connus, refuse les unités inconnues. */
export const StockUnitUnitSchema = z.enum(STOCK_UNIT_UNITS)