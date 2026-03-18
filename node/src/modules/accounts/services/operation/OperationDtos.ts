import { z } from "zod";

export interface OperationBatchCheckInput {
    id: number;
    isChecked: boolean;
    dateValeur: string;
}

export interface OperationBatchCheckPayload {
    checks: OperationBatchCheckInput[];
}

/** Schéma pour créer ou mettre à jour une opération. */
export const SaveOperationSchema = z.object({
    id: z.number().int().nonnegative().optional(),
    label: z.string().min(1),
    dateOperation: z.string().min(1),
    dateValeur: z.string().nullable().optional(),
    debit: z.number().nonnegative().optional(),
    credit: z.number().nonnegative().optional(),
    isChecked: z.boolean().optional(),
    account: z.object({ id: z.number().int().positive() }),
    targetAccount: z.object({ id: z.number().int().positive() }).nullable().optional(),
    nature: z.object({ id: z.number().int().positive() }).nullable().optional(),
    poste: z.object({ id: z.number().int().positive() }).nullable().optional(),
});

export type SaveOperationPayload = z.infer<typeof SaveOperationSchema>;

/** Schéma pour la validation en lot d'opérations. */
export const OperationBatchCheckSchema = z.object({
    checks: z.array(z.object({
        id: z.number().int().positive(),
        isChecked: z.boolean(),
        dateValeur: z.string().min(1),
    })).min(1),
});
