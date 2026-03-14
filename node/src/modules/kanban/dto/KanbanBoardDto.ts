import { KanbanColumnDto } from "./KanbanColumnDto";
import { KanbanTaskDto } from "./KanbanTaskDto";
import { UserDto } from "../../core/dto/UserDto";

export interface KanbanBoardDto {
    columns: KanbanColumnDto[];
    tasks: KanbanTaskDto[];
    users: UserDto[];
}