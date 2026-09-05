import z from "zod";
import { STOCK_MOVEMENT_TYPES } from "./StockMovementTypes";

export const CreateStockMovementSchema = z.object({
    itemId: z.number(),
    itemLabel: z.string(),
    unitId: z.number(),
    unit: z.string(),
    locationId: z.number(),
    locationLabel: z.string(),
    type: z.enum(STOCK_MOVEMENT_TYPES),
    quantity: z.number(),
});

export type CreateStockMovementDto = z.infer<typeof CreateStockMovementSchema>;
