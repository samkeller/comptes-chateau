import { AppDataSource } from "../../../db/dataSource";
import { badRequest, notFound } from "../../../utils/AppError";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";
import { RecurringExpense } from "../entities/RecurringExpense";
import { BudgetItemDto, SaveBudgetItemPayload, toBudgetItemDto, UnifiedBudgetLine } from "./budget/BudgetDtos";

export default class BudgetService {
    private budgetItemRepo = AppDataSource.getRepository(BudgetItem);
    private posteRepo = AppDataSource.getRepository(AccountLinePoste);
    private recurringExpenseRepo = AppDataSource.getRepository(RecurringExpense);

    async getBudgetItems(accountId: number): Promise<BudgetItemDto[]> {
        const lines = await this.budgetItemRepo.find({
            where: { account: { id: accountId } },
            relations: { poste: true },
            order: { sortOrder: "ASC", id: "ASC" }
        });

        return lines.map(toBudgetItemDto);
    }

    /**
     * Get unified budget view combining active BudgetItems and active RecurringExpenses.
     * Sorted by poste then source.
     */
    async getUnifiedBudgetByPoste(accountId: number): Promise<UnifiedBudgetLine[]> {
        const [budgetItems, recurringExpenses] = await Promise.all([
            this.budgetItemRepo.find({
                where: { isActive: true, account: { id: accountId } },
                relations: { poste: true },
            }),
            this.recurringExpenseRepo.find({
                where: { isActive: true, account: { id: accountId } },
                relations: { poste: true },
            }),
        ]);

        const lines: UnifiedBudgetLine[] = [];

        // Add budget items
        for (const item of budgetItems) {
            lines.push({
                id: `budget_${item.id}`,
                source: 'budget',
                label: item.label,
                amount: Number(item.amount),
                posteId: item.poste?.id ?? null,
                posteLabel: item.poste?.label ?? null,
                posteColor: item.poste?.color ?? null,
            });
        }

        // Add recurring expenses
        for (const expense of recurringExpenses) {

            /**
             * Calcules l'équivalent mensuel de l'amount du recurring expense en fonction de sa fréquence.
             */
            let amountByFrequency: number;
            switch (expense.frequency) {
                case 'weekly':
                    amountByFrequency = Number(expense.solde) * 4.34524; // Average weeks in a month
                    break;
                case 'quarterly':
                    amountByFrequency = Number(expense.solde) / 3;
                    break;
                case 'yearly':
                    amountByFrequency = Number(expense.solde) / 12;
                    break;
                case 'monthly':
                default:
                    amountByFrequency = Number(expense.solde);
            }

            lines.push({
                id: `recurring_${expense.id}`,
                source: 'recurring',
                label: expense.label,
                amount: Math.abs(amountByFrequency),
                posteId: expense.poste?.id ?? null,
                posteLabel: expense.poste?.label ?? null,
                posteColor: expense.poste?.color ?? null,
            });
        }

        // Sort by poste then source
        lines.sort((a, b) => {
            const posteCompare = (a.posteLabel ?? 'Sans poste').localeCompare(b.posteLabel ?? 'Sans poste');
            if (posteCompare !== 0) return posteCompare;

            return (a.source === 'budget' ? 0 : 1) - (b.source === 'budget' ? 0 : 1);
        });

        return lines;
    }

    async create(payload: SaveBudgetItemPayload, accountId: number): Promise<BudgetItemDto> {
        const poste = await this.resolvePoste(payload.posteId, accountId);

        const created = await this.budgetItemRepo.save({
            label: payload.label,
            amount: payload.amount,
            sortOrder: payload.sortOrder,
            isActive: payload.isActive ?? true,
            account: { id: accountId },
            poste,
        });

        const loaded = await this.budgetItemRepo.findOne({
            where: { id: created.id, account: { id: accountId } },
            relations: { poste: true },
        });

        if (!loaded) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        return toBudgetItemDto(loaded);
    }

    async update(id: number, payload: SaveBudgetItemPayload, accountId: number): Promise<BudgetItemDto> {
        const existing = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId } },
        });

        if (!existing) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        const poste = await this.resolvePoste(payload.posteId, accountId);

        await this.budgetItemRepo.save({
            ...existing,
            label: payload.label,
            amount: payload.amount,
            isActive: payload.isActive ?? existing.isActive,
            sortOrder: payload.sortOrder,
            poste,
        });

        const loaded = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId } },
            relations: { poste: true },
        });

        if (!loaded) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        return toBudgetItemDto(loaded);
    }

    async delete(id: number, accountId: number): Promise<void> {
        const existing = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId } },
        });

        if (!existing) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        await this.budgetItemRepo.remove(existing);
    }

    private async resolvePoste(posteId: number | null | undefined, accountId: number): Promise<AccountLinePoste | null> {
        if (!posteId) {
            return null;
        }

        const poste = await this.posteRepo.findOne({ where: { id: posteId, accountId } });
        if (!poste) {
            throw badRequest("BUDGET_POSTE_INVALID", "Le poste fourni n'existe pas sur ce compte");
        }

        return poste;
    }
}
