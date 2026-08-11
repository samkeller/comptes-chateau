import { z } from "zod";
import { RecurringExpenseFrequency } from "../entities/RecurringExpense";

/** Schéma pour créer ou mettre à jour une dépense récurrente. */
export const SaveRecurringExpenseSchema = z.object({
    id: z.number().int().nonnegative().optional(),
    label: z.string().min(1),
    solde: z.number(),
    isActive: z.boolean(),
    nextOccurrence: z.string().optional(),
    frequency: z.enum(RecurringExpenseFrequency),
    natureId: z.number().int().positive().nullable().optional(),
    posteId: z.number().int().positive().nullable().optional(),
});

export type SaveRecurringExpensePayload = z.infer<typeof SaveRecurringExpenseSchema>;
