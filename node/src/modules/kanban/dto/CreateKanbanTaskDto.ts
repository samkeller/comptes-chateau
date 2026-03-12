
import { KanbanTaskPriority } from "./KanbanTaskPriority";

export interface CreateKanbanTaskDto {
    title: string;
    columnId: number;
    priority?: KanbanTaskPriority;
}