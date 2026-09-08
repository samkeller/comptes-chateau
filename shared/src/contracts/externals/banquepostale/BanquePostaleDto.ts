import { z } from "zod";
import { BanquePostaleCsvDataMetadataSchema } from "./BanquePostaleCsvData";

export const BanquePostaleOperationImportDtoSchema = z.object({
    id: z.number().int().nonnegative(),
    accountId: z.number().nonnegative(),
    compositeExternalId: z.string(),
    dateOperation: z.string().nonempty(),
    label: z.string().max(255).nonoptional(),
    amount: z.number(),
    rowNumber: z.number().int().nonnegative(),
    metadata: BanquePostaleCsvDataMetadataSchema
});

export type BanquePostaleOperationImportDto = z.infer<typeof BanquePostaleOperationImportDtoSchema>;