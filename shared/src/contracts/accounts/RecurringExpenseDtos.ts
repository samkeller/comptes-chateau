import { z } from "zod";

export const RECURRING_EXPENSE_FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"] as const;

export type RecurringExpenseFrequency = (typeof RECURRING_EXPENSE_FREQUENCIES)[number];

/** Schéma de validation pour la création ou la modification d'une dépense récurrente. */
export const SaveRecurringExpenseSchema = z.object({
    id: z.number().int().nonnegative().optional(),
    label: z.string().min(1),
    solde: z.number(),
    isActive: z.boolean(),
    nextOccurrence: z.string().optional(),
    frequency: z.enum(RECURRING_EXPENSE_FREQUENCIES),
    natureId: z.number().int().positive().nullable().optional(),
    posteId: z.number().int().positive().nullable().optional(),
});

export type SaveRecurringExpensePayload = z.infer<typeof SaveRecurringExpenseSchema>;
