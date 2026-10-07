import { z } from "zod";
import type { StockItemDto } from "./StockDtos";

export const STOCK_UNIT_UNITS = ["g", "kg", "ml", "cl", "L", "boite", "pack"] as const;
export type StockUnitUnits = typeof STOCK_UNIT_UNITS[number];

export const StockBarcodeParamsSchema = z.object({
    barcode: z.string().regex(/^\d{8,14}$/),
});

export interface StockBarcodeLookupResponse {
    barcode: string;
    existingItem: StockItemDto | null;
    suggestion: {
        label: string | null;
        brand: string | null;
        imageUrl: string | null;
        quantity: number | null;
        unit: StockUnitUnits | null;
    } | null;
}
