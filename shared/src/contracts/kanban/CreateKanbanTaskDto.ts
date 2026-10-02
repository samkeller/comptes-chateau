import { z } from "zod";
import { KANBAN_TASK_PRIORITIES } from "./KanbanTaskPriority";

/** Schéma de validation pour la création ou la modification d'une tâche kanban. */
export const CreateKanbanTaskSchema = z.object({
    title: z.string().trim().min(1).max(255),
    columnId: z.number().int(),
    priority: z.enum(KANBAN_TASK_PRIORITIES).optional(),
    description: z.string().nullish().default(null),
    tags: z.array(z.string().min(1).max(32)).max(15).optional(),
    assigneeIds: z.array(z.number().int().positive()).max(20).optional(),
});

export type CreateKanbanTaskRequest = z.input<typeof CreateKanbanTaskSchema>;

/** Schéma de validation pour les mises à jour partielles d'une tâche kanban. */
export const UpdateKanbanTaskSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    columnId: z.number().int().optional(),
    priority: z.enum(KANBAN_TASK_PRIORITIES).optional(),
    description: z.string().nullable().optional(),
    tags: z.array(z.string().min(1).max(32)).max(15).optional(),
    assigneeIds: z.array(z.number().int().positive()).max(20).optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
    message: "Au moins un champ doit être fourni",
});

export type UpdateKanbanTaskRequest = z.infer<typeof UpdateKanbanTaskSchema>;
