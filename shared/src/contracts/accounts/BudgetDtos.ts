import { z } from "zod";

/** Schéma de validation pour la création ou la modification d'une ligne de budget. */
export const SaveBudgetItemSchema = z.object({
    label: z.string().trim().min(1),
    amount: z.number().finite(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int(),
    posteId: z.number().int().positive().nullable().optional(),
});

export type SaveBudgetItemPayload = z.infer<typeof SaveBudgetItemSchema>;

/** Poste associé à une ligne de budget, tel que renvoyé par l'API. */
export interface BudgetPosteDto {
    id: number;
    label: string;
    color: string;
}

/** Ligne de budget telle que renvoyée par l'API. */
export interface BudgetItemDto {
    id: number;
    label: string;
    amount: number;
    isActive: boolean;
    sortOrder: number;
    poste: BudgetPosteDto | null;
}

/** Ligne budgétaire unifiée, issue d'un BudgetItem ou d'une dépense récurrente. */
export interface UnifiedBudgetLine {
    id: string;
    source: "budget" | "recurring";
    label: string;
    amount: number;
    posteId: number | null;
    posteLabel: string | null;
    posteColor: string | null;
}
