import { KanbanTaskPriority } from "./KanbanTaskPriority";

export interface KanbanTaskDto {
    id: number;
    title: string;
    description: string | null;
    columnId: number;
    priority: KanbanTaskPriority;
    tags?: string[];
}