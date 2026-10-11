import { z } from "zod";

/**
 * Unités de quantité d'un exemplaire en stock.
 *
 * - `pièce` pour un contenu dénombrable (6 œufs, 1 baguette…) ;
 * - masses et volumes alignés sur les unités exposées par OpenFoodFacts ;
 * - `boite` et `pack` pour les conditionnements, conservés sans conversion pour les stocks historiques.
 */
export const STOCK_UNIT_UNITS = ["pièce", "g", "kg", "ml", "cl", "L", "boite", "pack"] as const;
export type StockUnitUnits = typeof STOCK_UNIT_UNITS[number];

/** Validation d'entrée : seules les unités canoniques sont acceptées, sans alias. */
export const StockUnitUnitSchema = z.enum(STOCK_UNIT_UNITS);