import { z } from "zod";

/**
 * Schema d'une ligne d'opération CSV.
 */
export const BanquePostaleCsvOperationSchema = z.object({
    dateOperation: z.coerce.date(),
    label: z.string(),
    amount: z.number(),
    rowNumber: z.int().nonnegative(),
});

export type BanquePostaleCsvOperation = z.infer<
    typeof BanquePostaleCsvOperationSchema
>;

/**
 * Schema du fichier CSV complet.
 */
export const BanquePostaleCsvDataSchema = z.object({
    accountNumber: z.string(),
    type: z.string(),
    exportDate: z.coerce.date(),
    balance: z.number(),
    operations: z.array(BanquePostaleCsvOperationSchema),
});

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

export type BanquePostaleCsvData = z.infer<typeof BanquePostaleCsvDataSchema>;