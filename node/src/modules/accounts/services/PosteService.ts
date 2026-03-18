import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { AccountingLine } from "../entities/AccountingLine";
import { PosteDto, SavePostePayload } from "./poste/PosteDtos";
import { conflict, notFound } from "../../../utils/AppError";
import { isUniqueViolation } from "../../../utils/dbErrors";

export default class PosteService {
    private readonly posteRepo: Repository<AccountLinePoste>;

    constructor(manager?: EntityManager) {
        this.posteRepo = manager
            ? manager.getRepository(AccountLinePoste)
            : AppDataSource.getRepository(AccountLinePoste);
    }

    async getAll(): Promise<PosteDto[]> {
        const postes = await this.posteRepo.find({
            order: { label: "ASC" }
        });

        const rows = await this.posteRepo
            .createQueryBuilder("poste")
            .leftJoin(AccountingLine, "line", "line.poste_id = poste.id")
            .select("poste.id", "id")
            .addSelect("COUNT(line.id)", "linkedCount")
            .groupBy("poste.id")
            .getRawMany<{ id: string; linkedCount: string }>();

        const countById = new Map<number, number>(
            rows.map((row) => [Number(row.id), Number(row.linkedCount)])
        );

        return postes.map((poste) => ({
            id: poste.id,
            label: poste.label,
            color: poste.color,
            linkedAccountLines: countById.get(poste.id) ?? 0
        }));
    }

    async create(payload: SavePostePayload): Promise<PosteDto> {
        try {
            const entity = this.posteRepo.create({
                label: payload.label.trim(),
                color: payload.color
            });

            const created = await this.posteRepo.save(entity);
            return {
                id: created.id,
                label: created.label,
                color: created.color,
                linkedAccountLines: 0
            };
        } catch (error) {
            this.handlePersistenceError(error);
        }
    }

    async update(id: number, payload: SavePostePayload): Promise<PosteDto> {
        const existing = await this.posteRepo.findOneBy({ id });
        if (!existing) {
            throw notFound("POSTE_NOT_FOUND", "Poste introuvable");
        }

        existing.label = payload.label.trim();
        existing.color = payload.color;

        try {
            const updated = await this.posteRepo.save(existing);

            const linkedAccountLines = await AppDataSource.getRepository(AccountingLine).count({
                where: {
                    poste: { id: updated.id }
                }
            });

            return {
                id: updated.id,
                label: updated.label,
                color: updated.color,
                linkedAccountLines
            };
        } catch (error) {
            this.handlePersistenceError(error);
        }
    }

    async delete(id: number): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            const posteRepo = manager.getRepository(AccountLinePoste);
            const accountingRepo = manager.getRepository(AccountingLine);

            const existing = await posteRepo.findOneBy({ id });
            if (!existing) {
                throw notFound("POSTE_NOT_FOUND", "Poste introuvable");
            }

            await accountingRepo.query(
                "UPDATE account_line SET poste_id = NULL WHERE poste_id = $1",
                [id]
            );

            await posteRepo.delete({ id });
        });
    }

    private handlePersistenceError(error: unknown): never {
        if (isUniqueViolation(error)) {
            throw conflict("POSTE_DUPLICATE", "Un poste avec ce label existe déjà");
        }

        throw error;
    }
}
