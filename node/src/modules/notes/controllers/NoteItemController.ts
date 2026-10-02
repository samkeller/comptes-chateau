import { Router, type Request, type Response } from "express";
import { CreateNoteItemSchema, PatchNoteItemSchema } from "@chocosous/shared";
import { z } from "zod";
import { validateBody, validateParams } from "../../core/middlewares/validate";
import NoteService from "../services/NoteService";
import NoteItemService from "../services/NoteItemService";

const NoteItemRoutes = Router({ mergeParams: true });
const noteService = new NoteService();
const noteItemService = new NoteItemService(noteService);
const NoteItemParamsSchema = z.object({
    noteId: z.coerce.number().int().positive(),
    itemId: z.coerce.number().int().positive(),
});
const NoteIdParamsSchema = NoteItemParamsSchema.pick({ noteId: true });

NoteItemRoutes.post("/", validateParams(NoteIdParamsSchema), validateBody(CreateNoteItemSchema), async (
    req: Request,
    res: Response
) => {
    res.status(201).json(await noteItemService.add(Number(req.params.noteId), req.body));
});

NoteItemRoutes.patch("/:itemId", validateParams(NoteItemParamsSchema), validateBody(PatchNoteItemSchema), async (
    req: Request,
    res: Response
) => {
    res.json(await noteItemService.patch(Number(req.params.noteId), Number(req.params.itemId), req.body));
});

NoteItemRoutes.delete("/:itemId", validateParams(NoteItemParamsSchema), async (req: Request, res: Response) => {
    await noteItemService.delete(Number(req.params.noteId), Number(req.params.itemId));
    res.status(204).send();
});

export default NoteItemRoutes;
