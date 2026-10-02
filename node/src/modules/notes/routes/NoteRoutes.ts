import { Router } from "express";
import {
    CreateNoteItemSchema,
    CreateNoteSchema,
    NotesArchiveQuerySchema,
    PatchNoteItemSchema,
    UpdateNoteSchema,
} from "@chocosous/shared";
import { z } from "zod";
import { IdParamSchema, validateBody, validateParams, validateQuery } from "../../core/middlewares/validate";
import NoteController from "../controllers/NoteController";

const NoteRoutes = Router();
const noteController = new NoteController();
const NoteIdParamSchema = z.object({ noteId: z.coerce.number().int().positive() });
const NoteItemParamsSchema = z.object({
    noteId: z.coerce.number().int().positive(),
    itemId: z.coerce.number().int().positive(),
});

NoteRoutes.get("/", validateQuery(NotesArchiveQuerySchema), noteController.list);
NoteRoutes.post("/", validateBody(CreateNoteSchema), noteController.create);
NoteRoutes.get("/:id", validateParams(IdParamSchema), noteController.getById);
NoteRoutes.put("/:id", validateParams(IdParamSchema), validateBody(UpdateNoteSchema), noteController.update);
NoteRoutes.patch("/:id/archive", validateParams(IdParamSchema), noteController.archive);
NoteRoutes.patch("/:id/unarchive", validateParams(IdParamSchema), noteController.unarchive);
NoteRoutes.delete("/:id", validateParams(IdParamSchema), noteController.delete);

NoteRoutes.post("/:noteId/items", validateParams(NoteIdParamSchema), validateBody(CreateNoteItemSchema), noteController.addItem);
NoteRoutes.patch("/:noteId/items/:itemId", validateParams(NoteItemParamsSchema), validateBody(PatchNoteItemSchema), noteController.patchItem);
NoteRoutes.delete("/:noteId/items/:itemId", validateParams(NoteItemParamsSchema), noteController.deleteItem);

export default NoteRoutes;
