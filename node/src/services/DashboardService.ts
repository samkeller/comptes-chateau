import { AppDataSource } from "../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";
import { BudgetItem, BudgetItemCategory } from "../entities/BudgetItem";
import { AccountBalanceBaseline } from "../entities/AccountBalanceBaseline";

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
    operationsToCheckInAccountCount: number;
    operationsToCheckHorsCompteCount: number;
}

export default class DashboardService {

    constructor(
        private accountingLineRepo = AppDataSource.getRepository(AccountingLine),
        private budgetItemRepo = AppDataSource.getRepository(BudgetItem),
        private accountBalanceBaselineRepo = AppDataSource.getRepository(AccountBalanceBaseline)
    ) { }
    async getOverview(): Promise<DashboardOverview> {
        const baseline = await this.accountBalanceBaselineRepo.findOne({ where: { id: 1 } });

        // Cas fallback si jamais on n'a pas de baseline en base (ex: première utilisation), on part de 0
        const baselineAmount = baseline ? Number(baseline.amount) : 0;
        const baseLineDate = baseline ? baseline.effectiveDate : new Date(1960, 0, 1);

        const [currentDeltaRaw, forecastDeltaRaw, monthExpensesRaw, budgetLines, toCheckCounts] = await Promise.all([
            this.getBalanceDeltaSinceDate(true, baseLineDate),
            this.getBalanceDeltaSinceDate(false, baseLineDate),
            this.getMonthExpensesRaw(),
            this.budgetItemRepo.find({
                where: { isActive: true },
                order: { category: "ASC", sortOrder: "ASC", id: "ASC" }
            }),
            this.getOperationsToCheckCounts()
        ]);

        const monthlyBudget = budgetLines.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
        
        return {
            currentBalance: baselineAmount + Number(currentDeltaRaw?.value ?? 0),
            forecastBalance: baselineAmount + Number(forecastDeltaRaw?.value ?? 0),
            monthExpenses: Number(monthExpensesRaw?.value ?? 0),
            monthlyBudget,
            operationsToCheckInAccountCount: toCheckCounts.inAccount,
            operationsToCheckHorsCompteCount: toCheckCounts.horsCompte
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
            qb = qb.andWhere("al.dateOperation >= :fromMonth", { fromMonth });
        }
        if (toMonth) {
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

    /**
     * Calcule la différence de solde depuis une date donnée (coalesce sum of credit - debit)
     * @param checkedOnly Permet de réutiliser la fonction pour les deux calculs de solde (current vs forecast)
     * @param fromDate
     * @returns 
     */
    private async getBalanceDeltaSinceDate(
        checkedOnly: boolean,
        fromDate: Date
    ): Promise<{ value: string | number } | undefined> {
        let qb = this.accountingLineRepo
            .createQueryBuilder("al")
            .select("COALESCE(SUM(al.credit - al.debit), 0)", "value")
            .where("al.dateOperation >= :fromDate", { fromDate })
            .leftJoin("al.nature", "nature")
            .andWhere("nature.isHorsCompte = false");

        if (checkedOnly) {
            qb = qb.andWhere("al.isChecked = :isChecked", { isChecked: true });
        }

        return qb.getRawOne<{ value: string | number }>();
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

    private async getOperationsToCheckCounts(): Promise<{ inAccount: number; horsCompte: number }> {
        const rawCounts = await this.accountingLineRepo
            .createQueryBuilder("al")
            .leftJoin("al.nature", "nature")
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

}
