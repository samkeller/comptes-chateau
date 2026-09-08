import { z } from "zod";
import { BanquePostaleCsvDataSchema } from "./BanquePostaleCsvData";

export const BanquePostaleCsvDataMetadataSchema = BanquePostaleCsvDataSchema
    .omit({
        operations: true,
        exportDate: true,
    })
    .extend({
        exportDate: z.string() // DB - stocke la date d'export sous forme de chaîne
    })
    ;

export type BanquePostaleCsvDataMetadata = z.infer<typeof BanquePostaleCsvDataMetadataSchema>;

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