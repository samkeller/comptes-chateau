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

const UNIT_ALIASES: Record<string, StockUnitUnits> = {
    "pièce": "pièce",
    "piece": "pièce",
    "pièces": "pièce",
    "pieces": "pièce",
    "pcs": "pièce",
    "pc": "pièce",
    "unité": "pièce",
    "unite": "pièce",
    "boite": "pièce",
    "boîte": "pièce",
    "pack": "pièce",
    "paquet": "pièce",
    "sachet": "pièce",
    "g": "g",
    "kg": "kg",
    "ml": "ml",
    "cl": "cl",
    "l": "L",
};

/**
 * Convertit une unité saisie ou historique (« boite », « pack », « l »…) vers l'unité canonique.
 * Retourne `null` pour une unité inconnue.
 */
export function parseStockUnit(value: string): StockUnitUnits | null {
    return UNIT_ALIASES[value.trim().toLocaleLowerCase("fr")] ?? null;
}

/**
 * Lecture tolérante des données historiques : une unité inconnue est un exemplaire dénombrable.
 */
export function normalizeStockUnit(value: string): StockUnitUnits {
    return parseStockUnit(value) ?? "pièce";
}

/** Validation d'entrée : accepte les alias connus, refuse les unités inconnues. */
export const StockUnitUnitSchema = z.preprocess(
    (value) => (typeof value === "string" ? parseStockUnit(value) ?? value : value),
    z.enum(STOCK_UNIT_UNITS),
);
