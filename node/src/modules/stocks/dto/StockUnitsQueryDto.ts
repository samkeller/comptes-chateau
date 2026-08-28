import { z } from "zod";

export interface StockUnitsQueryDto {
    locationId?: number;
}

export const StockUnitsQuerySchema = z.object({
    locationId: z.coerce.number().int().positive().optional(),
});
