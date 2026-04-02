
export interface BudgetPoste {
    id: number;
    label: string;
    color: string;
}

export interface BudgetItem {
    id: number;
    category: string;
    label: string;
    amount: number;
    sortOrder: number;
    poste: BudgetPoste | null;
}

export interface SaveBudgetItemPayload {
    category: string;
    label: string;
    amount: number;
    sortOrder: number;
    posteId?: number | null;
}
