import { z } from "zod";
import { dateTransform } from "../utils/Utils";

/** Schéma de validation pour la création ou la modification d'une opération. */
export const SaveOperationSchema = z.object({
    id: z.number().int().nonnegative().optional(),
    label: z.string().min(1),
    dateOperation: z.string().min(1),
    dateValeur: z.string().nullable().optional(),
    debit: z.number().nonnegative().optional(),
    credit: z.number().nonnegative().optional(),
    isChecked: z.boolean().optional(),
    targetAccount: z.object({ id: z.number().int().positive() }).nullable().optional(),
    natureId: z.number().int().positive().nullable().optional(),
    posteId: z.number().int().positive().nullable().optional(),
});

export type SaveOperationPayload = z.infer<typeof SaveOperationSchema>;

/** Schéma de validation pour la validation en lot d'opérations. */
export const OperationBatchCheckSchema = z.array(
    z.object({
        id: z.number().int().positive(),
        isChecked: z.boolean(),
        dateValeur: dateTransform,
        banquePostaleExternalId: z.string().min(1).optional(),
    })
).min(1);

// --- TYPES COMMUNS ---
// Type pour le Front (Tableau d'objets acceptant des vraies Dates JS)
export type OperationBatchCheckInput = z.input<typeof OperationBatchCheckSchema>;

// Type pour le Back après validation (Tableau d'objets avec date string normalisée)
export type OperationBatchCheckOutput = z.output<typeof OperationBatchCheckSchema>;