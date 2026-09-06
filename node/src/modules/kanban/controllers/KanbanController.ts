import { Request, Response } from "express";
import KanbanBoardService from "../services/KanbanBoardService";
import requireUserId from "../../accounts/utils/requireUserId";

export default class KanbanController {
    private readonly boardService = new KanbanBoardService();

    getBoard = async (_req: Request, res: Response) => {
        const board = await this.boardService.getBoardData();
        res.json(board);
    };

    getAllTags = async (_req: Request, res: Response) => {
        const tags = await this.boardService.getAllTags();
        res.json(tags);
    };

    createTask = async (req: Request, res: Response) => {
        const connectedUserId = requireUserId(req);
        const task = await this.boardService.createTask(req.body, connectedUserId);
        res.status(201).json(task);
    };

    saveTask = async (req: Request, res: Response) => {
        const task = await this.boardService.saveTask(req.body, Number(req.params.id));
        res.status(201).json(task);
    };

    deleteTask = async (req: Request, res: Response) => {
        await this.boardService.deleteTask(Number(req.params.id));
        res.status(204).send();
    };

    markTaskAsDone = async (req: Request, res: Response) => {
        const connectedUserId = requireUserId(req);
        await this.boardService.markTaskAsDone(Number(req.params.id), connectedUserId);
        res.status(200).json("ok");
    };

    getTaskComments = async (req: Request, res: Response) => {
        const comments = await this.boardService.getTaskComments(Number(req.params.id));
        res.json(comments);
    };

    createComment = async (req: Request, res: Response) => {
        const connectedUserId = requireUserId(req);
        const comment = await this.boardService.createComment(
            { taskId: Number(req.params.id), content: req.body.content },
            connectedUserId
        );
        res.status(201).json(comment);
    };

    deleteComment = async (req: Request, res: Response) => {
        const connectedUserId = requireUserId(req);
        await this.boardService.deleteComment(Number(req.params.commentId), connectedUserId);
        res.status(204).send();
    };
}
