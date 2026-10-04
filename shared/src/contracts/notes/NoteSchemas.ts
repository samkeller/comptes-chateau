import { z } from "zod";
import { NOTE_TYPES } from "./NoteTypes";

const NoteItemInputSchema = z.object({
    label: z.string().trim().min(1).max(500),
    isChecked: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
});

export const NotesArchiveQuerySchema = z.object({
    archived: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export const CreateNoteSchema = z.object({
    title: z.string().trim().min(1).max(255),
    type: z.enum(NOTE_TYPES),
    content: z.string().max(20_000).nullable().optional(),
    isPinned: z.boolean().optional(),
    items: z.array(NoteItemInputSchema).max(200).optional(),
}).superRefine((note, context) => {
    const items = note.items ?? [];
    if (note.type === "text" && items.length > 0) {
        context.addIssue({ code: "custom", path: ["items"], message: "Les notes texte ne peuvent pas contenir d’items" });
    }
    if (note.type === "checklist" && note.content != null) {
        context.addIssue({ code: "custom", path: ["content"], message: "Une checklist ne peut pas contenir de texte Markdown" });
    }
});

export const UpdateNoteSchema = z.object({
    title: z.string().trim().min(1).max(255),
    type: z.enum(NOTE_TYPES).optional(),
    content: z.string().max(20_000).nullable().optional(),
    isPinned: z.boolean().optional(),
    items: z.array(NoteItemInputSchema).max(200).optional(),
}).superRefine((note, context) => {
    if (note.type === "text" && note.items?.length) {
        context.addIssue({ code: "custom", path: ["items"], message: "Une note texte ne peut pas contenir d’items" });
    }
    if (note.type === "checklist" && note.content != null) {
        context.addIssue({ code: "custom", path: ["content"], message: "Une checklist ne peut pas contenir de texte Markdown" });
    }
});

export const PatchNoteItemSchema = z.object({
    label: z.string().trim().min(1).max(500).optional(),
    isChecked: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
}).refine((item) => Object.keys(item).length > 0, {
    message: "Au moins un champ doit être fourni",
});

export const CreateNoteItemSchema = NoteItemInputSchema;

export type CreateNoteRequest = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteRequest = z.infer<typeof UpdateNoteSchema>;
export type PatchNoteItemRequest = z.infer<typeof PatchNoteItemSchema>;
