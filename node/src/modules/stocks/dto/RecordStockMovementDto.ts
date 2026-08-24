import { z } from "zod";
import { STOCK_MOVEMENT_TYPES, StockMovementType } from "./StockMovementType";

export interface RecordStockMovementDto {
    type: StockMovementType;
    quantity: number;
    occurredAt?: Date;
    source?: string | null;
}

export const RecordStockMovementSchema = z.object({
    type: z.enum(STOCK_MOVEMENT_TYPES),
    quantity: z.number().positive(),
    occurredAt: z.coerce.date().optional(),
    source: z.union([
        z.string().trim().max(50),
        z.literal(""),
        z.null(),
        z.undefined(),
    ]),
});
