import { z } from "zod";

export interface CreateStockItemDto {
    label: string;
    barcode?: string | null;
    unit: string;
    locationId: number;
    expirationDate?: string | null;
    imageUrl?: string | null;
    initialQuantity?: number;
    occurredAt?: Date;
    source?: string;
}

export interface UpdateStockItemDto {
    label: string;
    barcode?: string | null;
    unit: string;
    locationId: number;
    expirationDate?: string | null;
    imageUrl?: string | null;
}

export interface StockItemsQueryDto {
    locationId?: number;
}

const optionalTextField = (maxLength: number) =>
    z.union([
        z.string().trim().max(maxLength),
        z.literal(""),
        z.null(),
        z.undefined(),
    ]);

const optionalDateField = z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(""),
    z.null(),
    z.undefined(),
]);

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
    initialQuantity: z.number().min(0).default(0),
    occurredAt: z.coerce.date().optional(),
    source: optionalTextField(50),
});

export const UpdateStockItemSchema = z.object(stockItemBaseSchema);

export const StockItemsQuerySchema = z.object({
    locationId: z.coerce.number().int().positive().optional(),
});
