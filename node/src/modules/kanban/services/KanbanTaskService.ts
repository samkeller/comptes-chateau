import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { KanbanTask } from "../entities/KanbanTask";

export default class KanbanTaskService {
    private readonly taskRepo: Repository<KanbanTask>;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.taskRepo = manager.getRepository(KanbanTask);
    }

    async getAllWithAssignees(): Promise<KanbanTask[]> {
        return this.taskRepo.find({ relations: { assignees: true } });
    }

    async getById(id: number): Promise<KanbanTask | null> {
        return this.taskRepo.findOneBy({ id });
    }

    async getByIdWithAssignees(id: number): Promise<KanbanTask | null> {
        return this.taskRepo.findOne({ where: { id }, relations: { assignees: true } });
    }

    create(payload: Partial<KanbanTask>): KanbanTask {
        return this.taskRepo.create(payload);
    }

    async save(task: KanbanTask): Promise<KanbanTask> {
        return this.taskRepo.save(task);
    }

    async delete(id: number): Promise<void> {
        await this.taskRepo.delete({ id });
    }

    async getAllTags(): Promise<string[]> {
        const rows = await this.taskRepo.createQueryBuilder("task")
            .select("DISTINCT UNNEST(tags)", "tag")
            .orderBy("tag", "ASC")
            .getRawMany<{ tag: string }>();

        return rows.map((row) => row.tag);
    }

    async getAssignedTasksCount(userId: number): Promise<number> {
        return this.taskRepo
            .createQueryBuilder("task")
            .innerJoin("task.assignees", "assignee", "assignee.id = :userId", { userId })
            .where("task.isDone = :isDone", { isDone: false })
            .getCount();
    }
}