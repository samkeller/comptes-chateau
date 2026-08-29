import type { UserDto } from "../core/UserDto";
import type { KanbanTaskPriority } from "./KanbanTaskPriority";

/** Tâche kanban telle que renvoyée par l'API. */
export interface KanbanTaskResponse {
    id: number;
    title: string;
    description: string | null;
    columnId: number;
    priority: KanbanTaskPriority;
    tags?: string[];
    assignees?: UserDto[];
    isDone: boolean;
    doneByUserId?: number | null;
}
