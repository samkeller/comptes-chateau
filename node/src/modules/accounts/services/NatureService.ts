import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountingLine } from "../entities/AccountingLine";
import { NatureDto, SaveNaturePayload } from "./nature/NatureDtos";
import { NatureConflictError, NatureValidationError } from "./nature/NatureErrors";

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
        this.validatePayload(payload);

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
        this.validatePayload(payload);

        const existing = await this.natureRepo.findOneBy({ id });
        if (!existing) {
            throw new NatureValidationError("Nature introuvable");
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
                throw new NatureValidationError("Nature introuvable");
            }

            await accountingRepo.query(
                "UPDATE account_line SET nature_id = NULL WHERE nature_id = $1",
                [id]
            );

            await natureRepo.delete({ id });
        });
    }

    private validatePayload(payload: SaveNaturePayload): void {
        const label = payload.label?.trim();
        if (!label) {
            throw new NatureValidationError("Le label est obligatoire");
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(payload.color)) {
            throw new NatureValidationError("La couleur doit être au format #RRGGBB");
        }

        if (typeof payload.isHorsCompte !== "boolean") {
            throw new NatureValidationError("Le champ isHorsCompte est obligatoire");
        }
    }

    private handlePersistenceError(error: unknown): never {
        if (this.isUniqueViolation(error)) {
            throw new NatureConflictError("Une nature avec ce label existe déjà");
        }

        throw error;
    }

    private isUniqueViolation(error: unknown): boolean {
        if (!error || typeof error !== "object") {
            return false;
        }

        if (!("code" in error)) {
            return false;
        }

        return (error as { code: string }).code === "23505";
    }
}
