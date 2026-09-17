import { AppDataSource } from "../../../db/dataSource";
import { badRequest, notFound } from "../../../utils/AppError";
import type { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";
import type { BudgetItemDto, RecurringExpenseFrequency, SaveBudgetItemPayload, UnifiedBudgetLine } from "@chocosous/shared";
import { toBudgetItemDto } from "../mappers/BudgetItemMapper";
import type { EntityManager, Repository } from "typeorm";
import PosteService from "./PosteService";
import RecurringExpenseService from "./RecurringExpenseService";

export interface PosteBudget {
    label: string;
    color: string;
    amount: number;
}

type BudgetLineAmounts = Pick<UnifiedBudgetLine, "amount" | "debit" | "credit">;

export default class BudgetService {
    private readonly budgetItemRepo: Repository<BudgetItem>;
    private readonly posteService: PosteService;
    private readonly recurringExpenseService: RecurringExpenseService;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.budgetItemRepo = manager.getRepository(BudgetItem);
        this.posteService = new PosteService(manager);
        this.recurringExpenseService = new RecurringExpenseService(manager);
    }

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
            this.recurringExpenseService.getAllRecurringExpenses(accountId, true),
        ]);

        const lines: UnifiedBudgetLine[] = [];

        for (const item of budgetItems) {
            const amounts = BudgetService.toBudgetLineAmounts(Number(item.amount));

            lines.push({
                id: `budget_${item.id}`,
                source: 'budget',
                label: item.label,
                ...amounts,
                posteId: item.poste?.id ?? null,
                posteLabel: item.poste?.label ?? null,
                posteColor: item.poste?.color ?? null,
            });
        }

        for (const expense of recurringExpenses) {
            const monthlyAmount = BudgetService.toMonthlyAmount(Number(expense.solde), expense.frequency);
            const amounts = BudgetService.toBudgetLineAmounts(monthlyAmount);

            lines.push({
                id: `recurring_${expense.id}`,
                source: 'recurring',
                label: expense.label,
                ...amounts,
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

    async getBudgetByPoste(accountId: number, posteIds?: number[]): Promise<Map<number, PosteBudget>> {
        const [budgetItems, recurringExpenses] = await Promise.all([
            this.budgetItemRepo.find({
                where: { isActive: true, account: { id: accountId } },
                relations: { poste: true },
            }),
            this.recurringExpenseService.getAllRecurringExpenses(accountId, true),
        ]);

        const byPoste = new Map<number, PosteBudget>();
        const addAmount = (poste: AccountLinePoste | null | undefined, amount: number): void => {
            if (!poste || (posteIds && !posteIds.includes(poste.id))) return;
            const existing = byPoste.get(poste.id);
            if (existing) {
                existing.amount += amount;
            } else {
                byPoste.set(poste.id, { label: poste.label, color: poste.color, amount });
            }
        };

        for (const item of budgetItems) {
            addAmount(item.poste, Number(item.amount));
        }
        for (const expense of recurringExpenses) {
            addAmount(expense.poste, Math.abs(Number(expense.solde)));
        }

        return byPoste;
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

        const poste = await this.posteService.getById(posteId, accountId);
        if (!poste) {
            throw badRequest("BUDGET_POSTE_INVALID", "Le poste fourni n'existe pas sur ce compte");
        }

        return poste;
    }

    /**
    * Convertit un montant en lignes de budget avec montant, débit et crédit.
    * @param amount Le montant à convertir en lignes de budget.
    * @returns Un objet contenant le montant, le débit et le crédit.
    */
    private static toBudgetLineAmounts(amount: number): BudgetLineAmounts {
        return {
            amount,
            debit: amount < 0 ? Math.abs(amount) : 0,
            credit: amount > 0 ? amount : 0,
        };
    }

    /**
     * Convertit un montant selon la fréquence en montant mensuel.
     * @param amount Le montant à convertir.
     * @param frequency La fréquence du montant (weekly, monthly, quarterly, yearly).
     * @returns Le montant converti en montant mensuel.
     */
    private static toMonthlyAmount(amount: number, frequency: RecurringExpenseFrequency): number {
        switch (frequency) {
            case 'weekly':
                return amount * 4.34524;
            case 'quarterly':
                return amount / 3;
            case 'yearly':
                return amount / 12;
            case 'monthly':
            default:
                return amount;
        }
    }
}
