import type { UserDto } from "../core/UserDto";
import type { KanbanColumnResponse } from "./KanbanColumnDto";
import type { KanbanTaskResponse } from "./KanbanTaskDto";

/** Contenu complet du tableau kanban (colonnes, tâches, utilisateurs). */
export interface KanbanBoardResponse {
    columns: KanbanColumnResponse[];
    tasks: KanbanTaskResponse[];
    users: UserDto[];
}
