import { z } from "zod";

export interface TakeStockUnitDto {
    occurredAt?: Date;
    source?: string | null;
}

export const TakeStockUnitSchema = z.object({
    occurredAt: z.coerce.date().optional(),
    source: z.union([
        z.string().trim().max(50),
        z.literal(""),
    ]).optional().nullable(),
});
