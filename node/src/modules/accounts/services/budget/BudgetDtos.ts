import { z } from "zod";
import { BudgetItem } from "../../entities/BudgetItem";

export interface BudgetPosteDto {
    id: number;
    label: string;
    color: string;
}

export interface BudgetItemDto {
    id: number;
    category: string;
    label: string;
    amount: number;
    sortOrder: number;
    poste: BudgetPosteDto | null;
}

export interface SaveBudgetItemPayload {
    category: string;
    label: string;
    amount: number;
    sortOrder: number;
    posteId?: number | null;
}

export const SaveBudgetItemSchema = z.object({
    category: z.string().trim().min(1),
    label: z.string().trim().min(1),
    amount: z.number().finite(),
    sortOrder: z.number().int(),
    posteId: z.number().int().positive().nullable().optional(),
});



export function toBudgetItemDto(line: BudgetItem): BudgetItemDto {
    return {
        id: line.id,
        category: line.category,
        label: line.label,
        amount: Number(line.amount),
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