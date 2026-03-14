import { AppDataSource } from "../../../db/dataSource";
import { User } from "../../core/entities/User";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KanbanBoardDto } from "../dto/KanbanBoardDto";
import { KanbanTaskDto } from "../dto/KanbanTaskDto";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanTask } from "../entities/KanbanTask";
import { In } from "typeorm";

export default class KanbanBoardService {
    private kanbanTaskRepo = AppDataSource.getRepository(KanbanTask);
    private kanbanColumnRepo = AppDataSource.getRepository(KanbanColumn);
    private userRepo = AppDataSource.getRepository(User);

    async getColumns(): Promise<KanbanColumn[]> {
        return this.kanbanColumnRepo.find();
    }

    async getBoardData(): Promise<KanbanBoardDto> {
        const [columns, tasks, users] = await Promise.all([
            this.kanbanColumnRepo.find(),
            this.kanbanTaskRepo.find({
                relations: {
                    assignees: true,
                },
            }),
            this.userRepo.find({
                order: {
                    username: "ASC",
                },
            }),
        ]);

        return {
            columns: columns,
            tasks: tasks.map(task => this.toTaskDto(task)),
            users: users,
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
        const assignees = await this.resolveAssignees(body.assigneeIds);

        // TODO, custom error class
        if (!column)
            throw new Error("KANBAN_COLUMN_NOT_FOUND");

        const task = this.kanbanTaskRepo.create({
            title: body.title,
            description: body.description ?? null,
            tags: this.normalizeTags(body.tags),
            column,
            priority: body.priority ?? "normal",
            assignees,
        });
        const savedTask = await this.kanbanTaskRepo.save(task);

        return this.loadTaskOrThrow(savedTask.id);
    }

    async saveTask(task: CreateKanbanTaskDto, id: number): Promise<KanbanTask> {
        const existingTask = await this.kanbanTaskRepo.findOne({
            where: { id },
            relations: {
                assignees: true,
            },
        });

        // TODO, custom error class
        if (!existingTask)
            throw new Error("KANBAN_TASK_NOT_FOUND");

        existingTask.columnId = task.columnId;
        existingTask.title = task.title;
        existingTask.description = task.description || null;
        existingTask.priority = task.priority || "normal";

        if (task.tags !== undefined) {
            existingTask.tags = this.normalizeTags(task.tags);
        }

        if (task.assigneeIds !== undefined) {
            existingTask.assignees = await this.resolveAssignees(task.assigneeIds);
        }

        const savedTask = await this.kanbanTaskRepo.save(existingTask);

        return this.loadTaskOrThrow(savedTask.id);

    }

    async deleteTask(queryId: number) {
        const existingTask = await this.kanbanTaskRepo.findOneBy({ id: queryId });

        // TODO, custom error class
        if (!existingTask)
            throw new Error("KANBAN_TASK_NOT_FOUND");

        await this.kanbanTaskRepo.delete({ id: queryId });
    }

    async markTaskAsDone(taskId: number, userId: number): Promise<void> {
        const task = await this.kanbanTaskRepo.findOne({ where: { id: taskId }, relations: { assignees: true } });
        if (!task) throw new Error("KANBAN_TASK_NOT_FOUND");

        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new Error("KANBAN_USER_NOT_FOUND");

        task.isDone = true;
        task.doneByUserId = userId;
        await this.kanbanTaskRepo.save(task);
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

    private async resolveAssignees(assigneeIds: number[] | undefined): Promise<User[]> {
        if (!assigneeIds || assigneeIds.length === 0) {
            return [];
        }

        const uniqueIds = [...new Set(assigneeIds)];
        const users = await this.userRepo.findBy({ id: In(uniqueIds) });

        if (users.length !== uniqueIds.length) {
            throw new Error("KANBAN_ASSIGNEE_NOT_FOUND");
        }

        return users;
    }

    private async loadTaskOrThrow(id: number): Promise<KanbanTask> {
        const task = await this.kanbanTaskRepo.findOne({
            where: { id },
            relations: {
                assignees: true,
            },
        });

        if (!task) {
            throw new Error("KANBAN_TASK_NOT_FOUND");
        }

        return task;
    }

    private toTaskDto(task: KanbanTask): KanbanTaskDto {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            columnId: task.columnId,
            priority: task.priority,
            tags: task.tags,
            assignees: task.assignees,
            isDone: task.isDone,
            doneByUserId: task.doneByUserId ?? null,
        };
    }
}