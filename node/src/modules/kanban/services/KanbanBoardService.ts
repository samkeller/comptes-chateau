import { AppDataSource } from "../../../db/dataSource";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KanbanBoardDto } from "../dto/KanbanBoardDto";
import { KanbanTaskDto } from "../dto/KanbanTaskDto";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanTask } from "../entities/KanbanTask";

export default class KanbanBoardService {
    private kanbanTaskRepo = AppDataSource.getRepository(KanbanTask);
    private kanbanColumnRepo = AppDataSource.getRepository(KanbanColumn);

    async getColumns(): Promise<KanbanColumn[]> {
        return this.kanbanColumnRepo.find();
    }

    async getBoardData(): Promise<KanbanBoardDto> {

        const columns = await this.kanbanColumnRepo.find();
        const tasks = await this.kanbanTaskRepo.find();

        return {
            columns: columns,
            tasks: tasks,
        }
    }

    async getAllTags(): Promise<string[]> {
        const rows = await this.kanbanTaskRepo.createQueryBuilder("task")
            .select("DISTINCT UNNEST(tags)", "tag")
            .orderBy("tag", "ASC")
            .getRawMany();

        return rows.map(row => row.tag);
    }

    async createTask(body: CreateKanbanTaskDto): Promise<KanbanTask> {
        const column = await this.kanbanColumnRepo.findOneBy({ id: body.columnId });

        // TODO, custom error class
        if (!column)
            throw new Error("KANBAN_COLUMN_NOT_FOUND");

        const task = this.kanbanTaskRepo.create({
            title: body.title,
            description: body.description ?? null,
            tags: this.normalizeTags(body.tags),
            column,
            priority: body.priority ?? "normal",
        });

        return this.kanbanTaskRepo.save(task);
    }

    async saveTask(task: KanbanTaskDto): Promise<KanbanTask> {
        const existingTask = await this.kanbanTaskRepo.findOneBy({ id: task.id });

        // TODO, custom error class
        if (!existingTask)
            throw new Error("KANBAN_TASK_NOT_FOUND");

        existingTask.columnId = task.columnId;
        existingTask.title = task.title;
        existingTask.description = task.description;
        existingTask.priority = task.priority;

        if (task.tags !== undefined) {
            existingTask.tags = this.normalizeTags(task.tags);
        }

        return this.kanbanTaskRepo.save(existingTask);

    }

    async deleteTask(queryId: number) {
        const existingTask = await this.kanbanTaskRepo.findOneBy({ id: queryId });

        // TODO, custom error class
        if (!existingTask)
            throw new Error("KANBAN_TASK_NOT_FOUND");

        await this.kanbanTaskRepo.delete({ id: queryId });
    }

    private normalizeTags(tags: string[] | undefined): string[] {
        if (!tags || tags.length === 0) {
            return [];
        }

        const uniqueTags = new Set<string>();
        for (const tag of tags) {
            const normalized = tag.trim().toLowerCase();
            if (normalized.length > 0) {
                uniqueTags.add(normalized);
            }
        }

        return [...uniqueTags];
    }
}