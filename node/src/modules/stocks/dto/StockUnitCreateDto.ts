import { z } from "zod";

export interface StockUnitCreateDto {
    itemId: number;
    locationId: number;
    quantity: number;
    unit: string;
    expirationDate?: string;
}

export const StockUnitCreateSchema = z.object({ 
    itemId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(64),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
