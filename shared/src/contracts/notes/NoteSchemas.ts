import { z } from "zod";

export const NotesArchiveQuerySchema = z.object({
    archived: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export const NoteBodySchema = z.object({
    title: z.string().trim().max(255),
    content: z.string().max(20_000).nullable().optional(),
    isPinned: z.boolean().optional(),
}).superRefine((note, context) => {
    const hasTitle = note.title.length > 0;
    const hasContent = note.content != null && note.content.trim().length > 0;
    if (!hasTitle && !hasContent) {
        context.addIssue({ code: "custom", path: ["title"], message: "Au moins un titre ou du contenu est requis" });
    }
});

export type UpdateNoteRequest = z.infer<typeof NoteBodySchema>;