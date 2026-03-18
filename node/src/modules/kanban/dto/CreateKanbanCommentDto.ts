import { z } from "zod";

export interface CreateKanbanCommentDto {
    taskId: number;
    content: string;
}

export const CreateKanbanCommentSchema = z.object({
    content: z.string().trim().min(1).max(5000),
});
