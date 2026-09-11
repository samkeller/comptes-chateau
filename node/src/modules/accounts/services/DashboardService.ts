import type { BudgetByPoste, DashboardOverview, MonthlyAggregateByPoste } from "@chocosous/shared";
import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import KanbanBoardService from "../../kanban/services/KanbanBoardService";
import AccountLineService from "./AccountLineService";
import AccountService from "./AccountService";
import BudgetService from "./BudgetService";
import RecurringExpenseService from "./RecurringExpenseService";

export default class DashboardService {
    private readonly accountLineService: AccountLineService;
    private readonly accountService: AccountService;
    private readonly budgetService: BudgetService;
    private readonly recurringExpenseService: RecurringExpenseService;
    private readonly kanbanBoardService: KanbanBoardService;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.accountLineService = new AccountLineService(manager);
        this.accountService = new AccountService(manager);
        this.budgetService = new BudgetService(manager);
        this.recurringExpenseService = new RecurringExpenseService(manager);
        this.kanbanBoardService = new KanbanBoardService(manager);
    }

    async getOverview(userId: number, accountId: number): Promise<DashboardOverview> {
        const baseline = await this.accountService.getById(accountId);
        const baselineAmount = baseline ? Number(baseline.baseLineAmount) : 0;
        const baseLineDate = baseline ? baseline.baseLineEffectiveDate : new Date(1960, 0, 1);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const threeMonthsEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1);

        const [
            currentDeltaRaw,
            forecastDeltaMonthEndRaw,
            forecastDeltaThreeMonthsRaw,
            budgetVsActual,
            toCheckCounts,
            assignedKanbanTasksCount,
        ] = await Promise.all([
            this.accountLineService.getBalanceDeltaSinceDate(true, baseLineDate, undefined, accountId),
            this.accountLineService.getBalanceDeltaSinceDate(false, baseLineDate, nextMonthStart, accountId),
            this.accountLineService.getBalanceDeltaSinceDate(false, baseLineDate, threeMonthsEnd, accountId),
            this.getBudgetVsActual(accountId, monthStart.getMonth() + 1, monthStart.getFullYear()),
            this.accountLineService.getOperationsToCheckCounts(accountId),
            this.kanbanBoardService.getAssignedTasksCount(userId),
        ]);

        const [simulateOneMonthForecast, simulateThreeMonthsForecast] = await Promise.all([
            this.recurringExpenseService.simulateFutureRecurrent(accountId, nextMonthStart),
            this.recurringExpenseService.simulateFutureRecurrent(accountId, threeMonthsEnd),
        ]);

        return {
            currentBalance: baselineAmount + Number(currentDeltaRaw?.value ?? 0),
            forecastBalanceMonthEnd:
                baselineAmount + Number(forecastDeltaMonthEndRaw?.value ?? 0) - simulateOneMonthForecast,
            forecastBalanceThreeMonths:
                baselineAmount + Number(forecastDeltaThreeMonthsRaw?.value ?? 0) - simulateThreeMonthsForecast,
            monthExpenses: budgetVsActual.reduce((total, item) => total + item.actualAmount, 0),
            monthlyBudget: budgetVsActual.reduce((total, item) => total + item.budgetAmount, 0),
            operationsToCheckInAccountCount: toCheckCounts.inAccount,
            operationsToCheckHorsCompteCount: toCheckCounts.horsCompte,
            assignedKanbanTasksCount,
        };
    }

    async getMonthlyByPoste(
        fromMonth: Date,
        toMonth: Date,
        posteIds: number[],
        accountId: number
    ): Promise<MonthlyAggregateByPoste[]> {
        const [rawResults, budgetByPoste] = await Promise.all([
            this.accountLineService.getMonthlyByPosteRaw(fromMonth, toMonth, posteIds, accountId),
            this.budgetService.getBudgetByPoste(accountId, posteIds),
        ]);

        return rawResults.map((row) => ({
            year: parseInt(row.year),
            month: parseInt(row.month),
            posteId: row.posteId,
            posteLabel: row.posteLabel,
            posteColor: row.posteColor,
            total: parseFloat(row.total),
            budgetAmount: budgetByPoste.get(row.posteId)?.amount ?? 0,
        }));
    }

    async getBudgetVsActual(accountId: number, month: number, year: number): Promise<BudgetByPoste[]> {
        const [actualResults, budgetByPoste] = await Promise.all([
            this.accountLineService.getActualByPoste(accountId, month, year),
            this.budgetService.getBudgetByPoste(accountId),
        ]);

        const posteMap = new Map<number, { label: string; color: string; budget: number; actual: number }>();

        for (const [posteId, budget] of budgetByPoste) {
            posteMap.set(posteId, { label: budget.label, color: budget.color, budget: budget.amount, actual: 0 });
        }

        for (const row of actualResults) {
            const existing = posteMap.get(row.posteId);
            if (existing) {
                existing.actual = parseFloat(row.actualAmount);
            } else {
                posteMap.set(row.posteId, {
                    label: row.posteLabel,
                    color: row.posteColor,
                    budget: 0,
                    actual: parseFloat(row.actualAmount),
                });
            }
        }

        return Array.from(posteMap.entries())
            .map(([posteId, data]) => ({
                posteId,
                posteLabel: data.label,
                posteColor: data.color,
                budgetAmount: data.budget,
                actualAmount: data.actual,
            }))
            .sort((a, b) => b.budgetAmount - a.budgetAmount);
    }
}