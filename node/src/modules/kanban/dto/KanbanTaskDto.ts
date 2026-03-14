import { KanbanTaskPriority } from "./KanbanTaskPriority";
import { toUserDto, UserDto } from "../../core/dto/UserDto";
import { KanbanTask } from "../entities/KanbanTask";

export interface KanbanTaskDto {
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

export function toKanbanTaskDto(task: KanbanTask): KanbanTaskDto {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            columnId: task.columnId,
            priority: task.priority,
            tags: task.tags,
            assignees: task.assignees?.map(toUserDto),
            isDone: task.isDone,
            doneByUserId: task.doneByUserId ?? null,
        };
    }