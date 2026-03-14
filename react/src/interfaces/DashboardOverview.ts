export type BudgetCategory = "incompressible" | "compressible" | "epargne";

export interface DashboardBudgetLine {
    id: number;
    category: BudgetCategory;
    label: string;
    amount: number;
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
