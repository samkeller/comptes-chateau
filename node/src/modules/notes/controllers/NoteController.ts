import type { Request, Response } from "express";
import type {
    CreateNoteItemInput,
    CreateNoteRequest,
    PatchNoteItemRequest,
    UpdateNoteRequest,
} from "@chocosous/shared";
import requireUserId from "../../accounts/utils/requireUserId";
import NoteService from "../services/NoteService";

export default class NoteController {
    private readonly noteService = new NoteService();

    list = async (req: Request<Record<string, string>, unknown, unknown, { archived?: boolean }>, res: Response) => {
        const archived = req.query.archived ?? false;
        res.json(await this.noteService.list(archived));
    };

    getById = async (req: Request, res: Response) => {
        res.json(await this.noteService.getById(Number(req.params.id)));
    };

    create = async (req: Request<Record<string, string>, unknown, CreateNoteRequest>, res: Response) => {
        const note = await this.noteService.create(req.body, requireUserId(req));
        res.status(201).json(note);
    };

    update = async (req: Request<{ id: string }, unknown, UpdateNoteRequest>, res: Response) => {
        res.json(await this.noteService.update(Number(req.params.id), req.body));
    };

    addItem = async (req: Request<{ noteId: string }, unknown, CreateNoteItemInput>, res: Response) => {
        res.status(201).json(await this.noteService.addItem(Number(req.params.noteId), req.body));
    };

    patchItem = async (req: Request<{ noteId: string; itemId: string }, unknown, PatchNoteItemRequest>, res: Response) => {
        res.json(await this.noteService.patchItem(
            Number(req.params.noteId),
            Number(req.params.itemId),
            req.body
        ));
    };

    deleteItem = async (req: Request<{ noteId: string; itemId: string }>, res: Response) => {
        await this.noteService.deleteItem(Number(req.params.noteId), Number(req.params.itemId));
        res.status(204).send();
    };

    archive = async (req: Request<{ id: string }>, res: Response) => {
        res.json(await this.noteService.archive(Number(req.params.id)));
    };

    unarchive = async (req: Request<{ id: string }>, res: Response) => {
        res.json(await this.noteService.unarchive(Number(req.params.id)));
    };

    delete = async (req: Request<{ id: string }>, res: Response) => {
        await this.noteService.delete(Number(req.params.id), requireUserId(req));
        res.status(204).send();
    };
}
