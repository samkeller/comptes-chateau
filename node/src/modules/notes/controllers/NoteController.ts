import { Router, type Request, type Response } from "express";
import {
    CreateNoteSchema,
    NotesArchiveQuerySchema,
    UpdateNoteSchema,
} from "@chocosous/shared";
import { z } from "zod";
import requireUserId from "../../accounts/utils/requireUserId";
import { validateBody, validateParams, validateQuery, IdParamSchema } from "../../core/middlewares/validate";
import NoteService from "../services/NoteService";

const NoteRoutes = Router();
const noteService = new NoteService();

NoteRoutes.get("/", validateQuery(NotesArchiveQuerySchema), async (
    req: Request<Record<string, string>, unknown, unknown, { archived?: boolean }>,
    res: Response
) => {
    res.json(await noteService.list(req.query.archived ?? false));
});

NoteRoutes.get("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
    res.json(await noteService.getById(Number(req.params.id)));
});

NoteRoutes.post("/", validateBody(CreateNoteSchema), async (req: Request, res: Response) => {
    const note = await noteService.create(req.body, requireUserId(req));
    res.status(201).json(note);
});

NoteRoutes.put("/:id", validateParams(IdParamSchema), validateBody(UpdateNoteSchema), async (
    req: Request,
    res: Response
) => {
    res.json(await noteService.update(Number(req.params.id), req.body));
});

NoteRoutes.patch("/:id/archive", validateParams(IdParamSchema), async (req: Request, res: Response) => {
    res.json(await noteService.archive(Number(req.params.id)));
});

NoteRoutes.patch("/:id/unarchive", validateParams(IdParamSchema), async (req: Request, res: Response) => {
    res.json(await noteService.unarchive(Number(req.params.id)));
});

NoteRoutes.delete("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
    await noteService.delete(Number(req.params.id), requireUserId(req));
    res.status(204).send();
});

export const NoteIdParamSchema = z.object({ noteId: z.coerce.number().int().positive() });
export default NoteRoutes;
