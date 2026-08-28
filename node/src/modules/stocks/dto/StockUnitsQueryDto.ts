import { z } from "zod";

export interface StockItemsQueryDto {
    locationId?: number;
}

export const StockItemsQuerySchema = z.object({
    locationId: z.coerce.number().int().positive().optional(),
});
