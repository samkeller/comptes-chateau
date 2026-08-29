import { z } from "zod";

/** Vue synthétique du tableau de bord d'un compte. */
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

/** Agrégation mensuelle des opérations par poste. */
export interface MonthlyAggregateByPoste {
    year: number;
    month: number;
    posteId: number;
    posteLabel: string;
    posteColor: string;
    total: number;
    budgetAmount: number;
}

/** Comparaison budget vs réalisé par poste. */
export interface BudgetByPoste {
    posteId: number;
    posteLabel: string;
    posteColor: string;
    budgetAmount: number;
    actualAmount: number;
}

/** Convertit une date "AAAA-MM-JJ" transmise en query string vers une Date locale. */
const apiDateQueryParamSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ")
    .transform((value) => {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    });

/** Convertit une liste CSV d'entiers transmise en query string (ex. "1,2,3"). */
const csvIntegerListQueryParamSchema = z.string()
    .min(1)
    .transform((value) => value.split(",").map((entry) => entry.trim()))
    .pipe(z.array(z.string().regex(/^-?\d+$/, "Doit être une liste d'entiers séparés par des virgules")).min(1))
    .transform((entries) => entries.map(Number));

/** Schéma de validation de la query `/dashboard/monthly-by-poste`. */
export const DashboardMonthlyByPosteQuerySchema = z.object({
    from: apiDateQueryParamSchema,
    to: apiDateQueryParamSchema,
    posteIds: csvIntegerListQueryParamSchema,
}).refine((data) => data.from <= data.to, {
    message: "Le paramètre 'from' doit être antérieur ou égal à 'to'.",
    path: ["from"],
});

export type DashboardMonthlyByPosteQuery = z.infer<typeof DashboardMonthlyByPosteQuerySchema>;
