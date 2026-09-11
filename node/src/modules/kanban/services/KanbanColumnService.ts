import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { KanbanColumn } from "../entities/KanbanColumn";

export default class KanbanColumnService {
    private readonly columnRepo: Repository<KanbanColumn>;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.columnRepo = manager.getRepository(KanbanColumn);
    }

    async getAll(): Promise<KanbanColumn[]> {
        return this.columnRepo.find();
    }

    async getById(id: number): Promise<KanbanColumn | null> {
        return this.columnRepo.findOneBy({ id });
    }
}