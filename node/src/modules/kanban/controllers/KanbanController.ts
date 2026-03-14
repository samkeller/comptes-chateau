import { Request, Response } from "express";
import KanbanBoardService from "../services/KanbanBoardService";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KANBAN_TASK_PRIORITIES, KanbanTaskPriority } from "../dto/KanbanTaskPriority";

export default class KanbanController {
    private readonly boardService = new KanbanBoardService();

    getBoard = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const board = await this.boardService.getBoardData();
            return res.json(board);
        } catch (error) {
            return res.status(500).send("Error fetching kanban board");
        }
    };

    getAllTags = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const tags = await this.boardService.getAllTags();
            return res.json(tags);
        } catch (error) {
            return res.status(500).send("Error fetching kanban tags");
        }
    };

    createTask = async (req: Request, res: Response): Promise<Response> => {
        const body = req.body as Partial<CreateKanbanTaskDto>;

        if (typeof body.title !== "string" || body.title.trim().length === 0 || typeof body.columnId !== "number" || !Number.isInteger(body.columnId)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.priority !== undefined && !this.isValidPriority(body.priority)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
            return res.status(400).send("Invalid task payload");
        }

        if (body.tags !== undefined && !this.isValidTags(body.tags)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.assigneeIds !== undefined && !this.isValidAssigneeIds(body.assigneeIds)) {
            return res.status(400).send("Invalid task payload");
        }

        try {
            const payload: CreateKanbanTaskDto = {
                title: body.title.trim(),
                columnId: body.columnId,
                priority: body.priority,
                description: body.description ?? null,
                tags: body.tags,
                assigneeIds: body.assigneeIds,
            };

            const task = await this.boardService.createTask(payload);
            return res.status(201).json(task);
        } catch (error) {
            if (error instanceof Error && (error.message === "KANBAN_COLUMN_NOT_FOUND" || error.message === "KANBAN_ASSIGNEE_NOT_FOUND")) {
                return res.status(404).send("Referenced resource not found");
            }
            return res.status(500).send("Error saving task");
        }
    };

    saveTask = async (req: Request, res: Response): Promise<Response> => {
        const queryId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

        if (isNaN(queryId) || queryId <= 0)
            return res.status(400).send("Invalid task ID");

        const body = req.body as Partial<CreateKanbanTaskDto>;

        if (typeof body.title !== "string" || body.title.trim().length === 0 || typeof body.columnId !== "number" || !Number.isInteger(body.columnId)) {
            return res.status(400).send("Invalid task payload");
        }
        if (body.priority !== undefined && !this.isValidPriority(body.priority)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.tags !== undefined && !this.isValidTags(body.tags)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
            return res.status(400).send("Invalid task payload");
        }

        if (body.assigneeIds !== undefined && !this.isValidAssigneeIds(body.assigneeIds)) {
            return res.status(400).send("Invalid task payload");
        }

        try {
            const payload: CreateKanbanTaskDto = {
                title: body.title.trim(),
                description: body.description ?? null,
                columnId: body.columnId,
                priority: body.priority,
                tags: body.tags,
                assigneeIds: body.assigneeIds,
            };

            const task = await this.boardService.saveTask(payload, queryId);
            return res.status(201).json(task);
        } catch (error) {
            if (error instanceof Error && (error.message === "KANBAN_TASK_NOT_FOUND" || error.message === "KANBAN_ASSIGNEE_NOT_FOUND")) {
                return res.status(404).send("Referenced resource not found");
            }
            return res.status(500).send("Error saving task");
        }
    }

    deleteTask = async (req: Request, res: Response): Promise<Response> => {
        const queryId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

        if (isNaN(queryId) || queryId <= 0)
            return res.status(400).send("Invalid task ID");

        try {
            await this.boardService.deleteTask(queryId);
            return res.status(204).send();
        } catch (error) {
            if (error instanceof Error && error.message === "KANBAN_TASK_NOT_FOUND") {
                return res.status(404).send("Task not found");
            }
            return res.status(500).send("Error deleting task");
        }
    }

    markTaskAsDone = async (req: Request, res: Response): Promise<Response> => {
        const taskId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
        if (isNaN(taskId) || taskId <= 0) return res.status(400).send("Invalid task ID");
        const connectedUser = req.session.userId;
        if (!connectedUser) return res.status(401).send("Not authenticated");
        try {
            await this.boardService.markTaskAsDone(taskId, connectedUser);
            return res.status(200).json("ok");
        } catch (error) {
            if (error instanceof Error && error.message === "KANBAN_TASK_NOT_FOUND") {
                return res.status(404).send("Task not found");
            }
            if (error instanceof Error && error.message === "KANBAN_USER_NOT_FOUND") {
                return res.status(404).send("User not found");
            }
            return res.status(500).send("Error marking task as done");
        }
    }


    private isValidPriority(priority: unknown): priority is KanbanTaskPriority {
        return typeof priority === "string" && KANBAN_TASK_PRIORITIES.includes(priority as KanbanTaskPriority);
    }

    private isValidTags(tags: unknown): tags is string[] {
        if (!Array.isArray(tags)) {
            return false;
        }

        if (tags.length > 15) {
            return false;
        }

        return tags.every(tag => typeof tag === "string" && tag.trim().length > 0 && tag.trim().length <= 32);
    }

    private isValidAssigneeIds(assigneeIds: unknown): assigneeIds is number[] {
        if (!Array.isArray(assigneeIds)) {
            return false;
        }

        if (assigneeIds.length > 20) {
            return false;
        }

        return assigneeIds.every(id => typeof id === "number" && Number.isInteger(id) && id > 0);
    }
}
