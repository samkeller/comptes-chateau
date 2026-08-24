import { z } from "zod";

export interface CreateStockLocationDto {
    label: string;
}

export interface UpdateStockLocationDto {
    label: string;
}

export const CreateStockLocationSchema = z.object({
    label: z.string().trim().min(1).max(255),
});

export const UpdateStockLocationSchema = CreateStockLocationSchema;
