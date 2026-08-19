import { AppDataSource } from "../../../db/dataSource";
import { User } from "../../core/entities/User";
import { toUserDto } from "../../core/dto/UserDto";
import { CreateKanbanCommentDto } from "../dto/CreateKanbanCommentDto";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KanbanBoardDto } from "../dto/KanbanBoardDto";
import { KanbanCommentDto } from "../dto/KanbanCommentDto";
import { KanbanTaskDto, toKanbanTaskDto } from "../dto/KanbanTaskDto";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanComment } from "../entities/KanbanComment";
import { KanbanTask } from "../entities/KanbanTask";
import { In } from "typeorm";
import { forbidden, notFound } from "../../../utils/AppError";
import UserXpService from "../../core/services/UserXpService";

export default class KanbanBoardService {
    private kanbanTaskRepo = AppDataSource.getRepository(KanbanTask);
    private kanbanColumnRepo = AppDataSource.getRepository(KanbanColumn);
    private kanbanCommentRepo = AppDataSource.getRepository(KanbanComment);
    private userRepo = AppDataSource.getRepository(User);
    private userXpService = new UserXpService()

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
            tasks: tasks.map(toKanbanTaskDto),
            users: users.map(toUserDto),
        }
    }

    async getAllTags(): Promise<string[]> {
        const rows = await this.kanbanTaskRepo.createQueryBuilder("task")
            .select("DISTINCT UNNEST(tags)", "tag")
            .orderBy("tag", "ASC")
            .getRawMany();

        return rows.map(row => row.tag);
    }

    async createTask(body: CreateKanbanTaskDto, connectedUserId: number): Promise<KanbanTaskDto> {
        const column = await this.kanbanColumnRepo.findOneBy({ id: body.columnId });
        const assignees = await this.resolveAssignees(body.assigneeIds);

        if (!column)
            throw notFound("KANBAN_COLUMN_NOT_FOUND", "Colonne kanban introuvable");

        const task = this.kanbanTaskRepo.create({
            title: body.title,
            description: body.description ?? null,
            tags: this.normalizeTags(body.tags),
            column,
            priority: body.priority ?? "normal",
            assignees,
        });
        const savedTask = await this.kanbanTaskRepo.save(task);

        await this.userXpService.addXPForUser(connectedUserId, "KANBAN_TASK_CREATED");

        return toKanbanTaskDto(await this.loadTaskOrThrow(savedTask.id));
    }

    async saveTask(task: CreateKanbanTaskDto, id: number): Promise<KanbanTaskDto> {
        const existingTask = await this.kanbanTaskRepo.findOne({
            where: { id },
            relations: {
                assignees: true,
            },
        });

        if (!existingTask)
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");

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

        return toKanbanTaskDto(await this.loadTaskOrThrow(savedTask.id));

    }

    async deleteTask(queryId: number) {
        const existingTask = await this.kanbanTaskRepo.findOneBy({ id: queryId });

        if (!existingTask)
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");

        await this.kanbanTaskRepo.delete({ id: queryId });
    }

    async markTaskAsDone(taskId: number, userId: number): Promise<void> {
        const task = await this.kanbanTaskRepo.findOne({ where: { id: taskId }, relations: { assignees: true } });
        if (!task) throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");

        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw notFound("KANBAN_USER_NOT_FOUND", "Utilisateur introuvable");

        task.isDone = true;
        task.doneByUserId = userId;
        
        await this.kanbanTaskRepo.save(task);
        
        // Si save ok :
        await this.userXpService.addXPForUser(userId, "KANBAN_TASK_COMPLETED");
    }

    async getTaskComments(taskId: number): Promise<KanbanCommentDto[]> {
        const comments = await this.kanbanCommentRepo.find({
            where: { taskId },
            relations: { author: true },
            order: { createdAt: "ASC" },
        });

        return comments.map(c => this.toCommentDto(c));
    }

    async createComment(dto: CreateKanbanCommentDto, authorId: number): Promise<KanbanCommentDto> {
        const task = await this.kanbanTaskRepo.findOneBy({ id: dto.taskId });
        if (!task) throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");

        const author = await this.userRepo.findOneBy({ id: authorId });
        if (!author) throw notFound("KANBAN_USER_NOT_FOUND", "Utilisateur introuvable");

        const comment = this.kanbanCommentRepo.create({
            content: dto.content.trim(),
            taskId: dto.taskId,
            authorId,
        });

        const saved = await this.kanbanCommentRepo.save(comment);

        const loaded = await this.kanbanCommentRepo.findOne({
            where: { id: saved.id },
            relations: { author: true },
        });

        if (!loaded) throw notFound("KANBAN_COMMENT_NOT_FOUND", "Commentaire introuvable");

        return this.toCommentDto(loaded);
    }

    async deleteComment(commentId: number, requestingUserId: number): Promise<void> {
        const comment = await this.kanbanCommentRepo.findOneBy({ id: commentId });
        if (!comment) throw notFound("KANBAN_COMMENT_NOT_FOUND", "Commentaire introuvable");
        if (comment.authorId !== requestingUserId) throw forbidden("KANBAN_COMMENT_FORBIDDEN", "Vous ne pouvez supprimer que vos propres commentaires");

        await this.kanbanCommentRepo.delete({ id: commentId });
    }

    private toCommentDto(comment: KanbanComment): KanbanCommentDto {
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
            throw notFound("KANBAN_ASSIGNEE_NOT_FOUND", "Un ou plusieurs assignees introuvables");
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
            throw notFound("KANBAN_TASK_NOT_FOUND", "Tâche kanban introuvable");
        }

        return task;
    }

}