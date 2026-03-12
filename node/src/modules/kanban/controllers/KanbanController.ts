import { Request, Response } from "express";
import KanbanBoardService from "../services/KanbanBoardService";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KanbanTaskDto } from "../dto/KanbanTaskDto";
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

    createTask = async (req: Request, res: Response): Promise<Response> => {
        const body = req.body as Partial<CreateKanbanTaskDto>;

        if (typeof body.title !== "string" || body.title.trim().length === 0 || typeof body.columnId !== "number" || !Number.isInteger(body.columnId)) {
            return res.status(400).send("Invalid task payload");
        }

        if (body.priority !== undefined && !this.isValidPriority(body.priority)) {
            return res.status(400).send("Invalid task payload");
        }

        try {
            const payload: CreateKanbanTaskDto = {
                title: body.title.trim(),
                columnId: body.columnId,
                priority: body.priority,
            };

            const task = await this.boardService.createTask(payload);
            return res.status(201).json(task);
        } catch (error) {
            return res.status(500).send("Error saving task");
        }
    };

    saveTask = async (req: Request, res: Response): Promise<Response> => {
        const queryId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

        if (isNaN(queryId) || queryId <= 0)
            return res.status(400).send("Invalid task ID");

        const body = req.body as Partial<KanbanTaskDto>;

        if (typeof body.title !== "string" || body.title.trim().length === 0 || typeof body.columnId !== "number" || !Number.isInteger(body.columnId) || !this.isValidPriority(body.priority)) {
            return res.status(400).send("Invalid task payload");
        }

        try {
            const payload: KanbanTaskDto = {
                id: queryId,
                title: body.title.trim(),
                description: body.description ?? null,
                columnId: body.columnId,
                priority: body.priority,
            };

            const task = await this.boardService.saveTask(payload);
            return res.status(201).json(task);
        } catch (error) {
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
            return res.status(500).send("Error deleting task");
        }
    }


    private isValidPriority(priority: unknown): priority is KanbanTaskPriority {
        return typeof priority === "string" && KANBAN_TASK_PRIORITIES.includes(priority as KanbanTaskPriority);
    }
}
