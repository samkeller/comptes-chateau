import { KanbanColumnDto } from "./KanbanColumnDto";
import { KanbanTaskDto } from "./KanbanTaskDto";
import { User } from "../../core/entities/User";

export interface KanbanBoardDto {
    columns: KanbanColumnDto[];
    tasks: KanbanTaskDto[];
    users: User[];
}