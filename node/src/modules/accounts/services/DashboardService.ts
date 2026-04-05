import { AppDataSource } from "../../../db/dataSource";
import { AccountLine } from "../entities/AccountLine";
import { BudgetItem } from "../entities/BudgetItem";
import { RecurringExpense } from "../entities/RecurringExpense";
import { KanbanTask } from "../../kanban/entities/KanbanTask";
import { Account } from "../entities/Account";

export interface MonthlyPosteAggregate {
    year: number;
    month: number; // 1-12
    posteId: number;
    posteLabel: string;
    posteColor: string;
    total: number;
    budgetAmount: number;
}

export interface DashboardOverview {
    currentBalance: number;
    forecastBalance: number;
    monthExpenses: number;
    monthlyBudget: number;
    operationsToCheckInAccountCount: number;
    operationsToCheckHorsCompteCount: number;
    assignedKanbanTasksCount: number;
}

export default class DashboardService {

    constructor(
        private accountLineRepo = AppDataSource.getRepository(AccountLine),
        private budgetItemRepo = AppDataSource.getRepository(BudgetItem),
        private recurringExpenseRepo = AppDataSource.getRepository(RecurringExpense),
        private accountRepo = AppDataSource.getRepository(Account),
        private kanbanTaskRepo = AppDataSource.getRepository(KanbanTask),
    ) { }
    async getOverview(userId: number, accountId: number): Promise<DashboardOverview> {
        const baseline = await this.accountRepo.findOne({ where: { id: accountId } });

        // Cas fallback si jamais on n'a pas de baseline en base (ex: première utilisation), on part de 0
        const baselineAmount = baseline ? Number(baseline.baseLineAmount) : 0;
        const baseLineDate = baseline ? baseline.baseLineEffectiveDate : new Date(1960, 0, 1);

        const [currentDeltaRaw, forecastDeltaRaw, monthExpensesRaw, budgetLines, toCheckCounts, assignedKanbanTasksCount] = await Promise.all([
            this.getBalanceDeltaSinceDate(true, baseLineDate, accountId),
            this.getBalanceDeltaSinceDate(false, baseLineDate, accountId),
            this.getMonthExpensesRaw(accountId),
            this.budgetItemRepo.find({
                where: { isActive: true, account: { id: accountId } },
                order: { sortOrder: "ASC", id: "ASC" }
            }),
            this.getOperationsToCheckCounts(accountId),
            this.getAssignedKanbanTasksCount(userId),
        ]);

        const monthlyBudget = budgetLines.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

        return {
            currentBalance: baselineAmount + Number(currentDeltaRaw?.value ?? 0),
            forecastBalance: baselineAmount + Number(forecastDeltaRaw?.value ?? 0),
            monthExpenses: Number(monthExpensesRaw?.value ?? 0),
            monthlyBudget,
            operationsToCheckInAccountCount: toCheckCounts.inAccount,
            operationsToCheckHorsCompteCount: toCheckCounts.horsCompte,
            assignedKanbanTasksCount,
        };
    }

    /**
     * Agrège les opérations par mois et par poste
     * @param fromMonth Format YYYY-MM
     * @param toMonth Format YYYY-MM
     */
    async getMonthlyByPoste(
        fromMonth: Date,
        toMonth: Date,
        posteIds: number[],
        accountId: number
    ): Promise<MonthlyPosteAggregate[]> {
        const [rawResults, budgetByPoste] = await Promise.all([
            this.getMonthlyByPosteRaw(fromMonth, toMonth, posteIds, accountId),
            this.computeBudgetByPoste(accountId, posteIds),
        ]);

        return rawResults.map((r) => ({
            year: parseInt(r.year),
            month: parseInt(r.month),
            posteId: r.posteId,
            posteLabel: r.posteLabel,
            posteColor: r.posteColor,
            total: parseFloat(r.total),
            budgetAmount: budgetByPoste.get(r.posteId) ?? 0,
        }));
    }

    private async getMonthlyByPosteRaw(
        fromMonth: Date,
        toMonth: Date,
        posteIds: number[],
        accountId: number
    ): Promise<Array<{ year: string; month: string; posteId: number; posteLabel: string; posteColor: string; total: string }>> {
        let qb = this.accountLineRepo
            .createQueryBuilder("al")
            .select("EXTRACT(YEAR FROM al.dateOperation)", "year")
            .addSelect("EXTRACT(MONTH FROM al.dateOperation)", "month")
            .addSelect("poste.id", "posteId")
            .addSelect("poste.label", "posteLabel")
            .addSelect("poste.color", "posteColor")
            .addSelect("SUM(al.credit - al.debit)", "total")
            .innerJoin("al.poste", "poste")
            .where("al.account_id = :accountId", { accountId })
            .groupBy("year")
            .addGroupBy("month")
            .addGroupBy("poste.id")
            .addGroupBy("poste.label")
            .addGroupBy("poste.color")
            .orderBy("year", "ASC")
            .addOrderBy("month", "ASC")
            .addOrderBy("poste.label", "ASC");

        // Filtres de dates
        if (fromMonth) {
            qb = qb.andWhere("al.dateOperation >= :fromMonth", { fromMonth });
        }
        if (toMonth) {
            qb = qb.andWhere("al.dateOperation <= :toMonth", { toMonth });
        }
        qb = qb.andWhere("poste.account_id = :accountId", { accountId });
        qb = qb.andWhere("poste.id IN (:...posteIds)", { posteIds });

        return qb.getRawMany();
    }

    /**
     * Computes total budget per poste (BudgetItems + RecurringExpenses).
     * Optionally filtered to a subset of posteIds.
     */
    private async computeBudgetByPoste(accountId: number, posteIds?: number[]): Promise<Map<number, number>> {
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

        const byPoste = new Map<number, number>();

        for (const item of budgetItems) {
            if (!item.poste) continue;
            if (posteIds && !posteIds.includes(item.poste.id)) continue;
            byPoste.set(item.poste.id, (byPoste.get(item.poste.id) ?? 0) + Number(item.amount));
        }

        for (const expense of recurringExpenses) {
            if (!expense.poste) continue;
            if (posteIds && !posteIds.includes(expense.poste.id)) continue;
            byPoste.set(expense.poste.id, (byPoste.get(expense.poste.id) ?? 0) + Math.abs(Number(expense.solde)));
        }

        return byPoste;
    }

    /**
     * Calcule la différence de solde depuis une date donnée (coalesce sum of credit - debit)
     * @param checkedOnly Permet de réutiliser la fonction pour les deux calculs de solde (current vs forecast)
     * @param fromDate
     * @returns 
     */
    private async getBalanceDeltaSinceDate(
        checkedOnly: boolean,
        fromDate: Date,
        accountId: number
    ): Promise<{ value: string | number } | undefined> {
        let qb = this.accountLineRepo
            .createQueryBuilder("al")
            .select("COALESCE(SUM(al.credit - al.debit), 0)", "value")
            .where("al.account_id = :accountId", { accountId })
            .andWhere("al.dateOperation >= :fromDate", { fromDate })
            .leftJoin("al.nature", "nature")
            .andWhere("(nature.id IS NULL OR nature.isHorsCompte = false)");

        if (checkedOnly) {
            qb = qb.andWhere("al.isChecked = :isChecked", { isChecked: true });
        }

        return qb.getRawOne<{ value: string | number }>();
    }

    private async getMonthExpensesRaw(accountId: number): Promise<{ value: string | number } | undefined> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        return this.accountLineRepo
            .createQueryBuilder("al")
            .select("COALESCE(SUM(al.debit), 0)", "value")
            .where("al.account_id = :accountId", { accountId })
            .andWhere("al.isChecked = :isChecked", { isChecked: true })
            .andWhere("al.dateOperation >= :monthStart", { monthStart })
            .andWhere("al.dateOperation < :nextMonthStart", { nextMonthStart })
            .getRawOne<{ value: string | number }>();
    }

    private async getOperationsToCheckCounts(accountId: number): Promise<{ inAccount: number; horsCompte: number }> {
        const rawCounts = await this.accountLineRepo
            .createQueryBuilder("al")
            .leftJoin("al.nature", "nature")
            .where("al.account_id = :accountId", { accountId })
            .select(
                "SUM(CASE WHEN al.isChecked = false AND (nature.id IS NULL OR nature.isHorsCompte = false) THEN 1 ELSE 0 END)",
                "inAccount"
            )
            .addSelect(
                "SUM(CASE WHEN al.isChecked = false AND nature.isHorsCompte = true THEN 1 ELSE 0 END)",
                "horsCompte"
            )
            .getRawOne<{ inAccount: string | number | null; horsCompte: string | number | null }>();

        return {
            inAccount: Number(rawCounts?.inAccount ?? 0),
            horsCompte: Number(rawCounts?.horsCompte ?? 0)
        };
    }

    private async getAssignedKanbanTasksCount(userId: number): Promise<number> {
        return this.kanbanTaskRepo
            .createQueryBuilder("task")
            .innerJoin("task.assignees", "assignee", "assignee.id = :userId", { userId })
            .where("task.isDone = :isDone", { isDone: false })
            .getCount();
    }

}
