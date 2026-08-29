import { z } from "zod";

export const CreateStockLocationSchema = z.object({
    label: z.string().trim().min(1).max(255),
});

export type CreateStockLocationDto = z.infer<typeof CreateStockLocationSchema>;

export const UpdateStockLocationSchema = CreateStockLocationSchema;

export type UpdateStockLocationDto = z.infer<typeof UpdateStockLocationSchema>;
