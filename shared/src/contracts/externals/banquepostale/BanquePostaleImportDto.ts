
import { z } from "zod";
import { BanquePostaleCsvDataSchema, BanquePostaleCsvOperationSchema } from "./BanquePostaleCsvData";

export const BanquePostaleImportSchema = BanquePostaleCsvDataSchema
    .omit({
        exportDate: true, // Parsing dates -> string (API)
        operations: true, // Parsing operations -> array of objects (API)
    })
    .extend({
        accountId: z.int().nonnegative(),
        exportDate: z.string(), // API expects date as string
        operations: z.array(
            BanquePostaleCsvOperationSchema.extend({
                dateOperation: z.string(), // API expects date as string
            })
        ),
    });

export type BanquePostaleImportPayload = z.infer<typeof BanquePostaleImportSchema>;


export const BanquePostaleImportResultSchema = z.object({
    linesProcessed: z.number().nonnegative(),
    linesCreated: z.number().nonnegative(),
    linesSkipped: z.number().nonnegative(),
});

export type BanquePostaleImportResultPayload = z.infer<typeof BanquePostaleImportResultSchema>;