import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { AccountLinePosteDto, SavePostePayload } from "@chocosous/shared";
import { conflict, notFound } from "../../../utils/AppError";
import { isUniqueViolation } from "../../../utils/dbErrors";
import AccountLineService from "./AccountLineService";

export default class PosteService {
    private readonly posteRepo: Repository<AccountLinePoste>;
    private readonly accountLineService: AccountLineService;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.posteRepo = manager.getRepository(AccountLinePoste);
        this.accountLineService = new AccountLineService(manager);
    }

    async getById(id: number, accountId: number): Promise<AccountLinePoste | null> {
        return this.posteRepo.findOne({ where: { id, accountId } });
    }

    async getAll(accountId: number): Promise<AccountLinePosteDto[]> {
        const postes = await this.posteRepo.find({
            where: { accountId },
            order: { label: "ASC" }
        });

        const countById = await this.accountLineService.getLinkedCountsByPoste(accountId);

        return postes.map((poste) => ({
            id: poste.id,
            label: poste.label,
            color: poste.color,
            linkedAccountLines: countById.get(poste.id) ?? 0
        }));
    }

    async create(payload: SavePostePayload, accountId: number): Promise<AccountLinePosteDto> {
        try {
            const entity = this.posteRepo.create({
                label: payload.label.trim(),
                color: payload.color,
                accountId,
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

    async update(id: number, payload: SavePostePayload, accountId: number): Promise<AccountLinePosteDto> {
        const existing = await this.posteRepo.findOne({ where: { id, accountId } });
        if (!existing) {
            throw notFound("POSTE_NOT_FOUND", "Poste introuvable");
        }

        existing.label = payload.label.trim();
        existing.color = payload.color;

        try {
            const updated = await this.posteRepo.save(existing);

            const linkedAccountLines = (await this.accountLineService.getLinkedCountsByPoste(accountId)).get(updated.id) ?? 0;

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

    async delete(id: number, accountId: number): Promise<void> {
        await this.manager.transaction(async (manager) => {
            const posteRepo = manager.getRepository(AccountLinePoste);
            const accountLineService = new AccountLineService(manager);

            const existing = await posteRepo.findOne({ where: { id, accountId } });
            if (!existing) {
                throw notFound("POSTE_NOT_FOUND", "Poste introuvable");
            }

            await accountLineService.clearPoste(id);

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
