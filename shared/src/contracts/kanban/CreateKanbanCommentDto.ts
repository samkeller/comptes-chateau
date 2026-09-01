import { z } from "zod";

/** Schéma de validation du corps de requête pour créer un commentaire de tâche. */
export const CreateKanbanCommentSchema = z.object({
    content: z.string().trim().min(1).max(5000),
});

export type CreateKanbanCommentRequest = z.infer<typeof CreateKanbanCommentSchema>;
