import { KanbanColumnDto } from "./KanbanColumnDto";

export interface KanbanTaskDto {
    id: number;
    title: string;
    description: string | null;
    columnId: number; 
}