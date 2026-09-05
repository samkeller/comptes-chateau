import { z } from "zod";

export const StockUnitCreateSchema = z.object({
    itemId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(64),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type StockUnitCreateDto = z.infer<typeof StockUnitCreateSchema>;

export const CreateStockItemSchema = z.object({
    id: z.number().int().positive().optional(),
    label: z.string().trim().min(1).max(255),
    barcode: z.string().trim().max(64).optional(),
    defaultUnit: z.string().trim().min(1).max(64),
    imageUrl: z.string().optional(),
    units: z.array(StockUnitCreateSchema),
});

export type CreateStockItemDto = z.infer<typeof CreateStockItemSchema>;

export const StockItemsQuerySchema = z.object({
    locationId: z.coerce.number().int().positive().optional(),
});

export type StockItemsQueryDto = z.infer<typeof StockItemsQuerySchema>;

export const StockUnitsQuerySchema = z.object({
    itemId: z.coerce.number().int().positive().optional(),
});

export type StockUnitsQueryDto = z.infer<typeof StockUnitsQuerySchema>;
