export interface MonthlyAggregateByPoste {
    year: number;
    /**
     * Mois de 1 à 12
     */
    month: number;
    posteId: number;
    posteLabel: string;
    posteColor: string;
    total: number;
    budgetAmount: number;
}
