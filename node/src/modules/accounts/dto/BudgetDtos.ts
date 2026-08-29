import type { BudgetItemDto } from "@chocosous/shared";
import { BudgetItem } from "../entities/BudgetItem";

/** Convertit une entité BudgetItem en DTO exposé par l'API. */
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
