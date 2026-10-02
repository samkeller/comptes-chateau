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

    async getCountsByTaskIds(taskIds: number[]): Promise<Map<number, number>> {
        if (taskIds.length === 0) return new Map();

        const rows = await this.commentRepo.createQueryBuilder("comment")
            .select("comment.taskId", "taskId")
            .addSelect("COUNT(comment.id)", "commentCount")
            .where("comment.taskId IN (:...taskIds)", { taskIds })
            .groupBy("comment.taskId")
            .getRawMany<{ taskId: number; commentCount: string }>();

        return new Map(rows.map((row) => [Number(row.taskId), Number(row.commentCount)]));
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