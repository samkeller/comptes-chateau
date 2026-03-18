import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountingLine } from "../entities/AccountingLine";
import { NatureDto, SaveNaturePayload } from "./nature/NatureDtos";
import { conflict, notFound } from "../../../utils/AppError";
import { isUniqueViolation } from "../../../utils/dbErrors";

export default class NatureService {
    private readonly natureRepo: Repository<AccountLineNature>;

    constructor(manager?: EntityManager) {
        this.natureRepo = manager
            ? manager.getRepository(AccountLineNature)
            : AppDataSource.getRepository(AccountLineNature);
    }

    async getAll(): Promise<NatureDto[]> {
        const natures = await this.natureRepo.find({
            order: { label: "ASC" }
        });

        const rows = await this.natureRepo
            .createQueryBuilder("nature")
            .leftJoin(AccountingLine, "line", "line.nature_id = nature.id")
            .select("nature.id", "id")
            .addSelect("COUNT(line.id)", "linkedCount")
            .groupBy("nature.id")
            .getRawMany<{ id: string; linkedCount: string }>();

        const countById = new Map<number, number>(
            rows.map((row) => [Number(row.id), Number(row.linkedCount)])
        );

        return natures.map((nature) => ({
            id: nature.id,
            label: nature.label,
            color: nature.color,
            isHorsCompte: nature.isHorsCompte,
            linkedAccountLines: countById.get(nature.id) ?? 0
        }));
    }

    async create(payload: SaveNaturePayload): Promise<NatureDto> {
        try {
            const entity = this.natureRepo.create({
                label: payload.label.trim(),
                color: payload.color,
                isHorsCompte: payload.isHorsCompte
            });

            const created = await this.natureRepo.save(entity);
            return {
                id: created.id,
                label: created.label,
                color: created.color,
                isHorsCompte: created.isHorsCompte,
                linkedAccountLines: 0
            };
        } catch (error) {
            this.handlePersistenceError(error);
        }
    }

    async update(id: number, payload: SaveNaturePayload): Promise<NatureDto> {
        const existing = await this.natureRepo.findOneBy({ id });
        if (!existing) {
            throw notFound("NATURE_NOT_FOUND", "Nature introuvable");
        }

        existing.label = payload.label.trim();
        existing.color = payload.color;
        existing.isHorsCompte = payload.isHorsCompte;

        try {
            const updated = await this.natureRepo.save(existing);

            const linkedAccountLines = await AppDataSource.getRepository(AccountingLine).count({
                where: {
                    nature: { id: updated.id }
                }
            });

            return {
                id: updated.id,
                label: updated.label,
                color: updated.color,
                isHorsCompte: updated.isHorsCompte,
                linkedAccountLines
            };
        } catch (error) {
            this.handlePersistenceError(error);
        }
    }

    async delete(id: number): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            const natureRepo = manager.getRepository(AccountLineNature);
            const accountingRepo = manager.getRepository(AccountingLine);

            const existing = await natureRepo.findOneBy({ id });
            if (!existing) {
                throw notFound("NATURE_NOT_FOUND", "Nature introuvable");
            }

            await accountingRepo.query(
                "UPDATE account_line SET nature_id = NULL WHERE nature_id = $1",
                [id]
            );

            await natureRepo.delete({ id });
        });
    }

    private handlePersistenceError(error: unknown): never {
        if (isUniqueViolation(error)) {
            throw conflict("NATURE_DUPLICATE", "Une nature avec ce label existe déjà");
        }

        throw error;
    }
}
