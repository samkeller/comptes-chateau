export type BudgetCategory = "incompressible" | "compressible" | "epargne";

export interface BudgetItem {
    id: number;
    category: BudgetCategory;
    label: string;
    amount: number;
    sortOrder: number;
}
