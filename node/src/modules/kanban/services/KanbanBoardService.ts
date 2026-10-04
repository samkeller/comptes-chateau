import type {
    CreateKanbanCommentRequest,
    CreateKanbanTaskRequest,
    KanbanBoardResponse,
    KanbanCommentResponse,
    KanbanTaskResponse,
    UpdateKanbanTaskRequest,
} from "@chocosous/shared";
import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { forbidden, notFound } from "../../../utils/AppError";
import type { User } from "../../core/entities/User";
import { toUserDto } from "../../core/mappers/UserMapper";
import UserService from "../../core/services/UserService";
import UserXpService from "../../core/services/UserXpService";
import { xpEventBus } from "../../core/events/XpEventBus";
import type { KanbanColumn } from "../entities/KanbanColumn";
import type { KanbanComment } from "../entities/KanbanComment";
import type { KanbanTask } from "../entities/KanbanTask";
import { toKanbanTaskDto } from "../mappers/KanbanTaskMapper";
import KanbanColumnService from "./KanbanColumnService";
import KanbanCommentService from "./KanbanCommentService";
import KanbanTaskService from "./KanbanTaskService";

type CreateKanbanCommentInput = CreateKanbanCommentRequest & {
    taskId: number;
};

export default class KanbanBoardService {
    private readonly taskService: KanbanTaskService;
    private readonly columnService: KanbanColumnService;
    private readonly commentService: KanbanCommentService;
    private readonly userService: UserService;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.taskService = new KanbanTaskService(manager);
        this.columnService = new KanbanColumnService(manager);
        this.commentService = new KanbanCommentService(manager);
        this.userService = new UserService(manager);
    }

    async getAssignedTasksCount(userId: number): Promise<number> {
        return this.taskService.getAssignedTasksCount(userId);
    }

    async getColumns(): Promise<KanbanColumn[]> {
        return this.columnService.getAll();
    }

    async getBoardData(): Promise<KanbanBoardResponse> {
        const [columns, tasks, users] = await Promise.all([
            this.columnService.getAll(),
            this.taskService.getAllWithAssignees(),
            this.userService.getAll(),
        ]);
        const commentCounts = await this.commentService.getCountsByTaskIds(tasks.map((task) => task.id));

        return {
            columns,
            tasks: tasks.map((task) => toKanbanTaskDto(task, commentCounts.get(task.id) ?? 0)),
            users: users.map(toUserDto),
        };
    }

    async getAllTags(): Promise<string[]> {
        return this.taskService.getAllTags();
    }

    async createTask(body: CreateKanbanTaskRequest, connectedUserId: number): Promise<KanbanTaskResponse> {
        let xpEvent: Parameters<typeof xpEventBus.emit>[0] | null = null;
        const createdTask = await this.manager.transaction(async (manager) => {
            const columnService = new KanbanColumnService(manager);
            const taskService = new KanbanTaskService(manager);
            const userService = new UserService(manager);
            const userXpService = new UserXpService(manager, (event) => {
                xpEvent = event;
            });

            const column = await columnService.getById(body.columnId);
            if (!column) {
                throw notFound("KANBAN_COLUMN_NOT_FOUND", "Colonne kanban introuvable");
            }

            const assignees = await this.resolveAssignees(body.assigneeIds, userService);
            const task = taskService.create({
                title: body.title,
                description: body.description ?? null,
                tags: this.normalizeTags(body.tags),
                column,
                priority: body.priority ?? "normal",
                assignees,
            });
            const savedTask = await taskService.save(task);
            await userXpService.addXPForUser(connectedUserId, "KANBAN_TASK_CREATED");
            const loadedTask = await taskService.getByIdWithAssignees(savedTask.id);
            if (!loadedTask) throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
            return toKanbanTaskDto(loadedTask);
        });

        if (xpEvent) xpEventBus.emit(xpEvent);
        return createdTask;
    }

    async saveTask(body: UpdateKanbanTaskRequest, id: number): Promise<KanbanTaskResponse> {
        const existingTask = await this.taskService.getByIdWithAssignees(id);
        if (!existingTask) {
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }

        if (body.columnId !== undefined) {
            const column = await this.columnService.getById(body.columnId);
            if (!column) {
                throw notFound("KANBAN_COLUMN_NOT_FOUND", "Colonne kanban introuvable");
            }
            existingTask.columnId = column.id;
        }
        if (body.title !== undefined) existingTask.title = body.title;
        if (body.description !== undefined) existingTask.description = body.description;
        if (body.priority !== undefined) existingTask.priority = body.priority;

        if (body.tags !== undefined) {
            existingTask.tags = this.normalizeTags(body.tags);
        }
        if (body.assigneeIds !== undefined) {
            existingTask.assignees = await this.resolveAssignees(body.assigneeIds);
        }

        const savedTask = await this.taskService.save(existingTask);
        return toKanbanTaskDto(await this.loadTaskOrThrow(savedTask.id));
    }

    async deleteTask(id: number): Promise<void> {
        if (!await this.taskService.getById(id)) {
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }

        await this.taskService.delete(id);
    }

    async markTaskAsDone(taskId: number, userId: number): Promise<void> {
        let xpEvent: Parameters<typeof xpEventBus.emit>[0] | null = null;
        await this.manager.transaction(async (manager) => {
            const taskService = new KanbanTaskService(manager);
            const userService = new UserService(manager);
            const userXpService = new UserXpService(manager, (event) => {
                xpEvent = event;
            });

            if (!await taskService.getById(taskId)) {
                throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
            }
            if (!await userService.getById(userId)) {
                throw notFound("KANBAN_USER_NOT_FOUND", "Utilisateur introuvable");
            }

            if (!await taskService.markDoneIfNotDone(taskId, userId)) return;
            await userXpService.addXPForUser(userId, "KANBAN_TASK_COMPLETED");
        });
        if (xpEvent) xpEventBus.emit(xpEvent);
    }

    async getTaskComments(taskId: number): Promise<KanbanCommentResponse[]> {
        if (!await this.taskService.getById(taskId)) {
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }
        const comments = await this.commentService.getAllByTaskId(taskId);
        return comments.map((comment) => this.toCommentDto(comment));
    }

    async createComment(dto: CreateKanbanCommentInput, authorId: number): Promise<KanbanCommentResponse> {
        if (!await this.taskService.getById(dto.taskId)) {
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }
        if (!await this.userService.getById(authorId)) {
            throw notFound("KANBAN_USER_NOT_FOUND", "Utilisateur introuvable");
        }

        const saved = await this.commentService.create(dto.content.trim(), dto.taskId, authorId);
        const loaded = await this.commentService.getByIdWithAuthor(saved.id);
        if (!loaded) throw notFound("KANBAN_COMMENT_NOT_FOUND", "Commentaire introuvable");

        return this.toCommentDto(loaded);
    }

    async deleteComment(commentId: number, requestingUserId: number): Promise<void> {
        const comment = await this.commentService.getById(commentId);
        if (!comment) throw notFound("KANBAN_COMMENT_NOT_FOUND", "Commentaire introuvable");
        if (comment.authorId !== requestingUserId) {
            throw forbidden("KANBAN_COMMENT_FORBIDDEN", "Vous ne pouvez supprimer que vos propres commentaires");
        }

        await this.commentService.delete(commentId);
    }

    private toCommentDto(comment: KanbanComment): KanbanCommentResponse {
        return {
            id: comment.id,
            taskId: comment.taskId,
            content: comment.content,
            authorId: comment.authorId,
            authorUsername: comment.author.username,
            authorAvatar: comment.author.avatar,
            createdAt: comment.createdAt.toISOString(),
        };
    }

    private normalizeTags(tags: string[] | undefined): string[] {
        if (!tags || tags.length === 0) return [];

        const uniqueTags = new Set<string>();
        for (const tag of tags) {
            const normalized = tag.trim().toLowerCase();
            if (normalized.length > 0) uniqueTags.add(normalized);
        }
        return [...uniqueTags];
    }

    private async resolveAssignees(
        assigneeIds: number[] | undefined,
        userService: UserService = this.userService,
    ): Promise<User[]> {
        if (!assigneeIds || assigneeIds.length === 0) return [];

        const uniqueIds = [...new Set(assigneeIds)];
        const users = await userService.getByIds(uniqueIds);
        if (users.length !== uniqueIds.length) {
            throw notFound("KANBAN_ASSIGNEE_NOT_FOUND", "Un ou plusieurs assignees introuvables");
        }
        return users;
    }

    private async loadTaskOrThrow(id: number): Promise<KanbanTask> {
        const task = await this.taskService.getByIdWithAssignees(id);
        if (!task) throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        return task;
    }
}