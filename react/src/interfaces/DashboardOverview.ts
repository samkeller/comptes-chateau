export interface DashboardOverview {
    currentBalance: number;

    forecastBalanceMonthEnd: number;
    forecastBalanceThreeMonths: number;
    forecastBalanceFinal: number;

    monthExpenses: number;
    monthlyBudget: number;
    operationsToCheckInAccountCount: number;
    operationsToCheckHorsCompteCount: number;
    assignedKanbanTasksCount: number;
}
