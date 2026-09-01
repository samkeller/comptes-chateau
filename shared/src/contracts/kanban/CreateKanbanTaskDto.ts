import { z } from "zod";
import { KANBAN_TASK_PRIORITIES } from "./KanbanTaskPriority";

/** Schéma de validation pour la création ou la modification d'une tâche kanban. */
export const CreateKanbanTaskSchema = z.object({
    title: z.string().trim().min(1),
    columnId: z.number().int(),
    priority: z.enum(KANBAN_TASK_PRIORITIES).optional(),
    description: z.string().nullish().default(null),
    tags: z.array(z.string().min(1).max(32)).max(15).optional(),
    assigneeIds: z.array(z.number().int().positive()).max(20).optional(),
});

export type CreateKanbanTaskRequest = z.input<typeof CreateKanbanTaskSchema>;
