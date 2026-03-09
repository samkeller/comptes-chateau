import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { BudgetItem, BudgetItemCategory } from "../entities/BudgetItem";

export interface BudgetItemDto {
    id: number;
    category: BudgetItemCategory;
    label: string;
    amount: number;
    sortOrder: number;
}

export default class BudgetService {
    private budgetItemRepo;

    constructor(manager?: EntityManager) {
        this.budgetItemRepo = manager
            ? manager.getRepository(BudgetItem)
            : AppDataSource.getRepository(BudgetItem);
    }

    async getActiveBudgetItems(): Promise<BudgetItemDto[]> {
        return this.budgetItemRepo.find({
            where: { isActive: true },
            order: { category: "ASC", sortOrder: "ASC", id: "ASC" }
        });
    }
}
