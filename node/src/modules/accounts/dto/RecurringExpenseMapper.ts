import { RecurringExpense } from "../entities/RecurringExpense";
import type { RecurringExpenseDto } from "@chocosous/shared";
import toAccountDto from "./AccountMapper";

/** Convertit une entité RecurringExpense en DTO exposé par l'API. */
export function toRecurringExpenseDto(line: RecurringExpense): RecurringExpenseDto {
    return {
        id: line.id,
        label: line.label,
        solde: line.solde,
        isActive: line.isActive,
        nextOccurrence: line.nextOccurrence.toISOString(),
        frequency: line.frequency,
        natureId: line.natureId ?? null,
        posteId: line.posteId ?? null,
        accountId: line.accountId,
        account: toAccountDto(line.account)
    };
}
