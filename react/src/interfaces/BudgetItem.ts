
export interface BudgetPoste {
    id: number;
    label: string;
    color: string;
}

export interface BudgetItem {
    id: number;
    label: string;
    amount: number;
    isActive: boolean;
    sortOrder: number;
    poste: BudgetPoste | null;
}

export interface SaveBudgetItemPayload {
    label: string;
    amount: number;
    isActive?: boolean;
    sortOrder: number;
    posteId?: number | null;
}

/**
 * Unified budget line from either BudgetItem or RecurringExpense.
 * Used to display a combined view with both sources.
 */
export interface UnifiedBudgetLine {
    id: string;  // "budget_${id}" or "recurring_${id}"
    source: 'budget' | 'recurring';
    label: string;
    amount: number;
    posteId: number | null;
    posteLabel: string | null;
    posteColor: string | null;
}
