import { z } from "zod";

interface GetAllStockUnitSchemaDto {
    itemId?: number;
}

export const ItemIdParamSchema = z.object({
    itemId: z.coerce.number().int().positive().optional(),
});

export type { GetAllStockUnitSchemaDto };