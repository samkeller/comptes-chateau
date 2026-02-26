import { EntityManager } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";

export interface MonthlyPosteAggregate {
    year: number;
    month: number; // 1-12
    posteId: number;
    posteLabel: string;
    posteColor: string;
    total: number;
}

export default class DashboardService {
    private accountingLineRepo;

    constructor(manager?: EntityManager) {
        this.accountingLineRepo = manager
            ? manager.getRepository(AccountingLine)
            : AppDataSource.getRepository(AccountingLine);
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
            .addSelect("SUM(al.solde)", "total")
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
}
