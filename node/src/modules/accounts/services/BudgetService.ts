import { AppDataSource } from "../../../db/dataSource";
import { badRequest, notFound } from "../../../utils/AppError";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";
import { BudgetItemDto, SaveBudgetItemPayload, toBudgetItemDto } from "./budget/BudgetDtos";

export default class BudgetService {
    private budgetItemRepo = AppDataSource.getRepository(BudgetItem);
    private posteRepo = AppDataSource.getRepository(AccountLinePoste);

    async getActiveBudgetItems(accountId: number): Promise<BudgetItemDto[]> {
        const lines = await this.budgetItemRepo.find({
            where: { isActive: true, account: { id: accountId } },
            relations: { poste: true },
            order: { category: "ASC", sortOrder: "ASC", id: "ASC" }
        });

        return lines.map(toBudgetItemDto);
    }

    async create(payload: SaveBudgetItemPayload, accountId: number): Promise<BudgetItemDto> {
        const poste = await this.resolvePoste(payload.posteId, accountId);

        const created = await this.budgetItemRepo.save({
            category: payload.category,
            label: payload.label,
            amount: payload.amount,
            sortOrder: payload.sortOrder,
            isActive: true,
            account: { id: accountId },
            poste,
        });

        const loaded = await this.budgetItemRepo.findOne({
            where: { id: created.id, account: { id: accountId } },
            relations: { poste: true },
        });

        if (!loaded) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        return toBudgetItemDto(loaded);
    }

    async update(id: number, payload: SaveBudgetItemPayload, accountId: number): Promise<BudgetItemDto> {
        const existing = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId }, isActive: true },
        });

        if (!existing) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        const poste = await this.resolvePoste(payload.posteId, accountId);

        await this.budgetItemRepo.save({
            ...existing,
            category: payload.category,
            label: payload.label,
            amount: payload.amount,
            sortOrder: payload.sortOrder,
            poste,
        });

        const loaded = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId } },
            relations: { poste: true },
        });

        if (!loaded) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        return toBudgetItemDto(loaded);
    }

    async delete(id: number, accountId: number): Promise<void> {
        const existing = await this.budgetItemRepo.findOne({
            where: { id, account: { id: accountId }, isActive: true },
        });

        if (!existing) {
            throw notFound("BUDGET_ITEM_NOT_FOUND", "Ligne de budget introuvable");
        }

        await this.budgetItemRepo.remove({ ...existing });
    }

    private async resolvePoste(posteId: number | null | undefined, accountId: number): Promise<AccountLinePoste | null> {
        if (!posteId) {
            return null;
        }

        const poste = await this.posteRepo.findOne({ where: { id: posteId, accountId } });
        if (!poste) {
            throw badRequest("BUDGET_POSTE_INVALID", "Le poste fourni n'existe pas sur ce compte");
        }

        return poste;
    }
}
