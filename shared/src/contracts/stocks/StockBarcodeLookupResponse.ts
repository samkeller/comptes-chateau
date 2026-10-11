import { z } from "zod";
import type { StockItemWithLotsDto } from "./StockDtos";
import type { StockUnitUnits } from "./StockUnits";

export const StockBarcodeParamsSchema = z.object({
    barcode: z.string().regex(/^\d{8,14}$/),
});

/** Données OpenFoodFacts proposées pour préremplir un nouveau produit. */
export interface StockProductSuggestionDto {
    label: string | null;
    brand: string | null;
    imageUrl: string | null;
    quantity: number | null;
    unit: StockUnitUnits | null;
}

export interface StockBarcodeLookupResponse {
    /** Code-barres normalisé (EAN-13 pour un UPC-A). */
    barcode: string;
    existingItem: StockItemWithLotsDto | null;
    suggestion: StockProductSuggestionDto | null;
}
