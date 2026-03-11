import { KanbanColumnDto } from "./KanbanColumnDto";
import { KanbanTaskDto } from "./KanbanTaskDto";

export interface KanbanBoardDto {
    columns: KanbanColumnDto[];
    tasks: KanbanTaskDto[];
}