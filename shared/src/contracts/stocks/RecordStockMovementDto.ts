import { z } from "zod";

export const STOCK_MOVEMENT_TYPES = ["IN", "OUT"] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const RecordStockMovementSchema = z.object({
    type: z.enum(STOCK_MOVEMENT_TYPES),
    quantity: z.number().positive(),
    occurredAt: z.coerce.date().optional(),
    source: z.union([
        z.string().trim().max(50),
        z.literal(""),
    ]).optional().nullable(),
});

export type RecordStockMovementDto = z.infer<typeof RecordStockMovementSchema>;
