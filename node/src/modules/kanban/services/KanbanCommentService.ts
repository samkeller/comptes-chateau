import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { KanbanComment } from "../entities/KanbanComment";

export default class KanbanCommentService {
    private readonly commentRepo: Repository<KanbanComment>;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.commentRepo = manager.getRepository(KanbanComment);
    }

    async getAllByTaskId(taskId: number): Promise<KanbanComment[]> {
        return this.commentRepo.find({
            where: { taskId },
            relations: { author: true },
            order: { createdAt: "ASC" },
        });
    }

    async getById(id: number): Promise<KanbanComment | null> {
        return this.commentRepo.findOneBy({ id });
    }

    async create(content: string, taskId: number, authorId: number): Promise<KanbanComment> {
        const comment = this.commentRepo.create({ content, taskId, authorId });
        return this.commentRepo.save(comment);
    }

    async getByIdWithAuthor(id: number): Promise<KanbanComment | null> {
        return this.commentRepo.findOne({ where: { id }, relations: { author: true } });
    }

    async delete(id: number): Promise<void> {
        await this.commentRepo.delete({ id });
    }
}