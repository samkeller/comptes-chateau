import { KanbanTaskPriority } from "./KanbanTaskPriority";
import { User } from "../../core/entities/User";

export interface KanbanTaskDto {
    id: number;
    title: string;
    description: string | null;
    columnId: number;
    priority: KanbanTaskPriority;
    tags?: string[];
    assignees?: User[];
    isDone: boolean;
    doneByUserId?: number | null;
}