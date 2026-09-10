
import { z } from "zod";
import { BanquePostaleCsvDataSchema, BanquePostaleCsvOperationSchema } from "./BanquePostaleCsvData";
import { BanquePostaleOperationImportDtoSchema } from "./BanquePostaleOperationImportDto";

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

export const BanquePostaleMatchedResultSchema = z.object({
    type: z.literal("matched"),
    accountLineId: z.number().nonnegative(),
    candidate: BanquePostaleOperationImportDtoSchema,
});

export type BanquePostaleMatchedResultPayload = z.infer<typeof BanquePostaleMatchedResultSchema>;

export const BanquePostaleAmbiguousResultSchema = z.object({
    type: z.literal("ambiguous"),
    accountLineId: z.number().nonnegative(),
    candidates: z.array(BanquePostaleOperationImportDtoSchema),
});

export type BanquePostaleAmbiguousResultPayload = z.infer<typeof BanquePostaleAmbiguousResultSchema>;

export const BanquePostaleImportResultSchema = z.object({
    linesProcessed: z.number().nonnegative(),
    linesCreated: z.number().nonnegative(),
    linesSkipped: z.number().nonnegative(),
    matched: z.array(BanquePostaleMatchedResultSchema),
    ambiguous: z.array(BanquePostaleAmbiguousResultSchema),
});

export type BanquePostaleImportResultPayload = z.infer<typeof BanquePostaleImportResultSchema>;