import { EntityManager } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";
import { BudgetItem, BudgetItemCategory } from "../entities/BudgetItem";

export interface MonthlyPosteAggregate {
    year: number;
    month: number; // 1-12
    posteId: number;
    posteLabel: string;
    posteColor: string;
    total: number;
}

export interface DashboardBudgetLine {
    id: number;
    category: BudgetItemCategory;
    label: string;
    amount: number;
}

export interface DashboardOverview {
    currentBalance: number;
    forecastBalance: number;
    monthExpenses: number;
    monthlyBudget: number;
    daysRemainingInMonth: number;
    budgetLines: DashboardBudgetLine[];
}

export default class DashboardService {
    private accountingLineRepo;
    private budgetItemRepo;

    constructor(manager?: EntityManager) {
        this.accountingLineRepo = manager
            ? manager.getRepository(AccountingLine)
            : AppDataSource.getRepository(AccountingLine);

        this.budgetItemRepo = manager
            ? manager.getRepository(BudgetItem)
            : AppDataSource.getRepository(BudgetItem);
    }

    async getOverview(): Promise<DashboardOverview> {
        const [currentBalanceRaw, forecastBalanceRaw, monthExpensesRaw, budgetLines] = await Promise.all([
            this.accountingLineRepo
                .createQueryBuilder("al")
                .select("COALESCE(SUM(al.credit - al.debit), 0)", "value")
                .where("al.isChecked = :isChecked", { isChecked: true })
                .getRawOne<{ value: string | number }>(),
            this.accountingLineRepo
                .createQueryBuilder("al")
                .select("COALESCE(SUM(al.credit - al.debit), 0)", "value")
                .getRawOne<{ value: string | number }>(),
            this.getMonthExpensesRaw(),
            this.budgetItemRepo.find({
                where: { isActive: true },
                order: { category: "ASC", sortOrder: "ASC", id: "ASC" }
            })
        ]);

        const monthlyBudget = budgetLines.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

        return {
            currentBalance: Number(currentBalanceRaw?.value ?? 0),
            forecastBalance: Number(forecastBalanceRaw?.value ?? 0),
            monthExpenses: Number(monthExpensesRaw?.value ?? 0),
            monthlyBudget,
            daysRemainingInMonth: this.getDaysRemainingInMonth(),
            budgetLines: budgetLines.map((line) => ({
                id: line.id,
                category: line.category,
                label: line.label,
                amount: Number(line.amount)
            }))
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
        posteIds: number[]
    ): Promise<MonthlyPosteAggregate[]> {
        let qb = this.accountingLineRepo
            .createQueryBuilder("al")
            .select("EXTRACT(YEAR FROM al.dateOperation)", "year")
            .addSelect("EXTRACT(MONTH FROM al.dateOperation)", "month")
            .addSelect("poste.id", "posteId")
            .addSelect("poste.label", "posteLabel")
            .addSelect("poste.color", "posteColor")
            .addSelect("SUM(al.credit - al.debit)", "total")
            .innerJoin("al.poste", "poste")
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
            console.log("Filtering from month:", fromMonth);
            qb = qb.andWhere("al.dateOperation >= :fromMonth", { fromMonth });
        }
        if (toMonth) {
            console.log("Filtering to month:", toMonth);
            qb = qb.andWhere("al.dateOperation <= :toMonth", { toMonth });
        }
        qb = qb.andWhere("poste.id IN (:...posteIds)", { posteIds });

        const results = await qb.getRawMany();

        return results.map((r) => ({
            year: parseInt(r.year),
            month: parseInt(r.month),
            posteId: r.posteId,
            posteLabel: r.posteLabel,
            posteColor: r.posteColor,
            total: parseFloat(r.total),
        }));
    }

    private async getMonthExpensesRaw(): Promise<{ value: string | number } | undefined> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        return this.accountingLineRepo
            .createQueryBuilder("al")
            .select("COALESCE(SUM(al.debit), 0)", "value")
            .where("al.isChecked = :isChecked", { isChecked: true })
            .andWhere("al.dateOperation >= :monthStart", { monthStart })
            .andWhere("al.dateOperation < :nextMonthStart", { nextMonthStart })
            .getRawOne<{ value: string | number }>();
    }

    private getDaysRemainingInMonth(): number {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return Math.max(0, lastDay.getDate() - now.getDate());
    }
}
