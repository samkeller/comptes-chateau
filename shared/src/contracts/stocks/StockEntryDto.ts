import { z } from "zod";
import { STOCK_EXPIRY_STATES } from "./StockExpiry";
import { normalizeBarcode } from "./StockBarcode";
import { StockUnitUnitSchema } from "./StockUnits";

/** Nombre maximal d'exemplaires ajoutés en une seule saisie. */
export const MAX_STOCK_ENTRY_NEW_COPIES = 100;
const MAX_STOCK_ENTRY_LOTS = 50;

const IdSchema = z.number().int().positive();
const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const HttpUrlSchema = z.string().trim().max(2048).refine((value) => {
    try {
        return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}, "URL http(s) attendue");

/** Champs du produit (catalogue). Sans `id`, le produit est créé. */
export const StockEntryItemSchema = z.object({
    id: IdSchema.optional(),
    label: z.string().trim().min(1).max(255),
    barcode: z.string().trim()
        .transform((value, ctx) => {
            if (value === "") return null;
            const normalized = normalizeBarcode(value);
            if (!normalized) {
                ctx.addIssue({ code: "custom", message: "Code-barres invalide (8 à 14 chiffres)" });
                return z.NEVER;
            }
            return normalized;
        })
        .nullable()
        .optional(),
    brand: z.string().trim().max(255).nullable().optional(),
    defaultUnit: StockUnitUnitSchema,
    imageUrl: HttpUrlSchema.nullable().optional(),
});

/**
 * Lot saisi : `copies` exemplaires identiques.
 * - lot existant : `unitIds` liste ses exemplaires actuels ; `copies` plus grand en ajoute, plus petit en supprime
 *   (0 supprime le lot) et un changement de champ corrige chaque exemplaire ;
 * - nouveau lot : `unitIds` vide et `copies` ≥ 1.
 */
export const StockEntryLotSchema = z.object({
    unitIds: z.array(IdSchema).max(MAX_STOCK_ENTRY_NEW_COPIES * 10).default([]),
    copies: z.number().int().min(0).max(MAX_STOCK_ENTRY_NEW_COPIES * 10),
    locationId: IdSchema,
    quantity: z.number().positive().max(1_000_000),
    unit: StockUnitUnitSchema,
    expirationDate: DateOnlySchema.nullable(),
});

/** Saisie atomique d'un produit et de ses lots (création ou modification). */
export const SaveStockEntrySchema = z.object({
    item: StockEntryItemSchema,
    lots: z.array(StockEntryLotSchema).max(MAX_STOCK_ENTRY_LOTS),
}).superRefine((entry, ctx) => {
    const seen = new Set<number>();
    let newCopies = 0;
    entry.lots.forEach((lot, index) => {
        if (lot.unitIds.length === 0 && lot.copies < 1) {
            ctx.addIssue({ code: "custom", path: ["lots", index, "copies"], message: "Un nouveau lot contient au moins un exemplaire" });
        }
        if (lot.unitIds.length > 0 && entry.item.id === undefined) {
            ctx.addIssue({ code: "custom", path: ["lots", index, "unitIds"], message: "Un nouveau produit n'a pas d'exemplaire existant" });
        }
        for (const unitId of lot.unitIds) {
            if (seen.has(unitId)) {
                ctx.addIssue({ code: "custom", path: ["lots", index, "unitIds"], message: "Exemplaire présent dans plusieurs lots" });
            }
            seen.add(unitId);
        }
        newCopies += Math.max(0, lot.copies - lot.unitIds.length);
    });
    if (newCopies > MAX_STOCK_ENTRY_NEW_COPIES) {
        ctx.addIssue({ code: "custom", path: ["lots"], message: `${MAX_STOCK_ENTRY_NEW_COPIES} nouveaux exemplaires au maximum par saisie` });
    }
});

export type SaveStockEntryDto = z.infer<typeof SaveStockEntrySchema>;
export type StockEntryLotDto = z.infer<typeof StockEntryLotSchema>;
export type StockEntryItemDto = z.infer<typeof StockEntryItemSchema>;
export type StockEntryLotInput = z.input<typeof StockEntryLotSchema>;

export const StockItemsQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    locationId: z.coerce.number().int().positive().optional(),
    expiryState: z.enum(STOCK_EXPIRY_STATES).optional(),
    /** Inclut les produits épuisés (jamais supprimés du catalogue). */
    includeEmpty: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export type StockItemsQueryDto = z.infer<typeof StockItemsQuerySchema>;

export const StockMovementsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type StockMovementsQueryDto = z.infer<typeof StockMovementsQuerySchema>;
