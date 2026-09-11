import type {
    CreateKanbanCommentRequest,
    CreateKanbanTaskRequest,
    KanbanBoardResponse,
    KanbanCommentResponse,
    KanbanTaskResponse,
} from "@chocosous/shared";
import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { forbidden, notFound } from "../../../utils/AppError";
import type { User } from "../../core/entities/User";
import { toUserDto } from "../../core/mappers/UserMapper";
import UserService from "../../core/services/UserService";
import UserXpService from "../../core/services/UserXpService";
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
    private readonly userXpService: UserXpService;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.taskService = new KanbanTaskService(manager);
        this.columnService = new KanbanColumnService(manager);
        this.commentService = new KanbanCommentService(manager);
        this.userService = new UserService(manager);
        this.userXpService = new UserXpService(manager);
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

        return {
            columns,
            tasks: tasks.map(toKanbanTaskDto),
            users: users.map(toUserDto),
        };
    }

    async getAllTags(): Promise<string[]> {
        return this.taskService.getAllTags();
    }

    async createTask(body: CreateKanbanTaskRequest, connectedUserId: number): Promise<KanbanTaskResponse> {
        const column = await this.columnService.getById(body.columnId);
        if (!column) {
            throw notFound("KANBAN_COLUMN_NOT_FOUND", "Colonne kanban introuvable");
        }

        const assignees = await this.resolveAssignees(body.assigneeIds);
        const task = this.taskService.create({
            title: body.title,
            description: body.description ?? null,
            tags: this.normalizeTags(body.tags),
            column,
            priority: body.priority ?? "normal",
            assignees,
        });
        const savedTask = await this.taskService.save(task);

        await this.userXpService.addXPForUser(connectedUserId, "KANBAN_TASK_CREATED");

        return toKanbanTaskDto(await this.loadTaskOrThrow(savedTask.id));
    }

    async saveTask(body: CreateKanbanTaskRequest, id: number): Promise<KanbanTaskResponse> {
        const existingTask = await this.taskService.getByIdWithAssignees(id);
        if (!existingTask) {
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }

        existingTask.columnId = body.columnId;
        existingTask.title = body.title;
        existingTask.description = body.description || null;
        existingTask.priority = body.priority || "normal";

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
        const task = await this.taskService.getByIdWithAssignees(taskId);
        if (!task) throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        if (!await this.userService.getById(userId)) {
            throw notFound("KANBAN_USER_NOT_FOUND", "Utilisateur introuvable");
        }

        task.isDone = true;
        task.doneByUserId = userId;
        await this.taskService.save(task);
        await this.userXpService.addXPForUser(userId, "KANBAN_TASK_COMPLETED");
    }

    async getTaskComments(taskId: number): Promise<KanbanCommentResponse[]> {
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

    private async resolveAssignees(assigneeIds: number[] | undefined): Promise<User[]> {
        if (!assigneeIds || assigneeIds.length === 0) return [];

        const uniqueIds = [...new Set(assigneeIds)];
        const users = await this.userService.getByIds(uniqueIds);
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