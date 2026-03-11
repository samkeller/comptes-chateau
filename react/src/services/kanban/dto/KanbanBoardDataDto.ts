import KanbanColumn from "../../../interfaces/kanban/KanbanColumn";
import KanbanTask from "../../../interfaces/kanban/KanbanTask";

export interface KanbanBoardDataDto{
    columns: KanbanColumn[];
    tasks: KanbanTask[];
}