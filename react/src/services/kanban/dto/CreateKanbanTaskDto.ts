

import { KanbanTaskPriority } from "../../../interfaces/kanban/KanbanTaskPriority";

export interface CreateKanbanTaskDto {
    // Valeurs minimales création
    columnId: number;
    title: string;
    priority: KanbanTaskPriority;
}