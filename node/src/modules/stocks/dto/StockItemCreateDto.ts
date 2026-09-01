import { z } from "zod";
import { StockUnitCreateDto, StockUnitCreateSchema } from "./StockUnitCreateDto";

export interface StockItemCreateDto {
    id?: number;
    label: string;
    barcode?: string;
    defaultUnit: string;
    imageUrl?: string;
    units?: StockUnitCreateDto[];
}

export const StockItemCreateSchema = z.object({
    id: z.number().int().positive().optional(),
    label: z.string().min(1).max(255),
    barcode: z.string().max(64).optional(),
    defaultUnit: z.string().max(64),
    imageUrl: z.string().optional(),
    units: z.array(StockUnitCreateSchema).optional()
});
