import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLineNatureDto, SaveNaturePayload } from "@chocosous/shared";
import { conflict, notFound } from "../../../utils/AppError";
import { isUniqueViolation } from "../../../utils/dbErrors";
import AccountLineService from "./AccountLineService";

export default class NatureService {
    private readonly natureRepo: Repository<AccountLineNature>;
    private readonly accountLineService: AccountLineService;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.natureRepo = manager.getRepository(AccountLineNature);
        this.accountLineService = new AccountLineService(manager);
    }

    async getAll(): Promise<AccountLineNatureDto[]> {
        const natures = await this.natureRepo.find({
            order: { label: "ASC" }
        });

        const countById = await this.accountLineService.getLinkedCountsByNature();

        return natures.map((nature) => ({
            id: nature.id,
            label: nature.label,
            color: nature.color,
            isHorsCompte: nature.isHorsCompte,
            linkedAccountLines: countById.get(nature.id) ?? 0
        }));
    }

    async create(payload: SaveNaturePayload): Promise<AccountLineNatureDto> {
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

    async update(id: number, payload: SaveNaturePayload): Promise<AccountLineNatureDto> {
        const existing = await this.natureRepo.findOneBy({ id });
        if (!existing) {
            throw notFound("NATURE_NOT_FOUND", "Nature introuvable");
        }

        existing.label = payload.label.trim();
        existing.color = payload.color;
        existing.isHorsCompte = payload.isHorsCompte;

        try {
            const updated = await this.natureRepo.save(existing);

            const linkedAccountLines = (await this.accountLineService.getLinkedCountsByNature()).get(updated.id) ?? 0;

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
        await this.manager.transaction(async (manager) => {
            const natureRepo = manager.getRepository(AccountLineNature);
            const accountLineService = new AccountLineService(manager);

            const existing = await natureRepo.findOneBy({ id });
            if (!existing) {
                throw notFound("NATURE_NOT_FOUND", "Nature introuvable");
            }

            await accountLineService.clearNature(id);

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
