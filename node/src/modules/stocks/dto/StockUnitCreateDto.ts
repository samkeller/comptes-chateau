import { z } from "zod";

export interface StockUnitCreateDto {
    locationId: number;
    quantity: number;
    unit: string;
    expirationDate?: string;
}

export const StockUnitCreateSchema = z.object({
    locationId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(64),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
