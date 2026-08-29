import { z } from "zod";

const optionalTextField = (maxLength: number) =>
    z.union([
        z.string().trim().max(maxLength),
        z.literal(""),
    ]).optional().nullable();

const optionalDateField = z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(""),
]).optional().nullable();

const stockItemBaseSchema = {
    label: z.string().trim().min(1).max(255),
    barcode: optionalTextField(64),
    unit: z.string().trim().min(1).max(64),
    locationId: z.number().int().positive(),
    expirationDate: optionalDateField,
    imageUrl: optionalTextField(2048),
};

export const CreateStockItemSchema = z.object({
    ...stockItemBaseSchema,
    initialQuantity: z.number().min(0).optional(),
    occurredAt: z.coerce.date().optional(),
    source: optionalTextField(50),
});

export type CreateStockItemDto = z.infer<typeof CreateStockItemSchema>;

export const UpdateStockItemSchema = z.object(stockItemBaseSchema);

export type UpdateStockItemDto = z.infer<typeof UpdateStockItemSchema>;

export const StockItemsQuerySchema = z.object({
    locationId: z.coerce.number().int().positive().optional(),
});

export type StockItemsQueryDto = z.infer<typeof StockItemsQuerySchema>;
