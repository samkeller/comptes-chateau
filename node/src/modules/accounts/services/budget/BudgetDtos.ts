import { z } from "zod";
import { BudgetItem } from "../../entities/BudgetItem";

export interface BudgetPosteDto {
    id: number;
    label: string;
    color: string;
}

export interface BudgetItemDto {
    id: number;
    label: string;
    amount: number;
    isActive: boolean;
    sortOrder: number;
    poste: BudgetPosteDto | null;
}

export interface SaveBudgetItemPayload {
    label: string;
    amount: number;
    isActive?: boolean;
    sortOrder: number;
    posteId?: number | null;
}

export const SaveBudgetItemSchema = z.object({
    label: z.string().trim().min(1),
    amount: z.number().finite(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int(),
    posteId: z.number().int().positive().nullable().optional(),
});

/**
 * Unified budget line from either BudgetItem or RecurringExpense.
 * Used to display a combined view.
 */
export interface UnifiedBudgetLine {
    id: string;  // "budget_${id}" or "recurring_${id}"
    source: 'budget' | 'recurring';
    label: string;
    amount: number;
    posteId: number | null;
    posteLabel: string | null;
    posteColor: string | null;
}

export function toBudgetItemDto(line: BudgetItem): BudgetItemDto {
    return {
        id: line.id,
        label: line.label,
        amount: Number(line.amount),
        isActive: line.isActive,
        sortOrder: line.sortOrder,
        poste: line.poste
            ? {
                id: line.poste.id,
                label: line.poste.label,
                color: line.poste.color,
            }
            : null,
    };
}