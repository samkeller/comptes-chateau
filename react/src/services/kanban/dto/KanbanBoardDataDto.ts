import KanbanColumn from "../../../interfaces/kanban/KanbanColumn";
import KanbanTask from "../../../interfaces/kanban/KanbanTask";
import { User } from "../../../interfaces/User";

export interface KanbanBoardDataDto{
    columns: KanbanColumn[];
    tasks: KanbanTask[];
    users: User[];
}