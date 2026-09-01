import { toUserDto } from "../../core/mappers/UserMapper";
import type { KanbanTaskResponse } from "@chocosous/shared";
import { KanbanTask } from "../entities/KanbanTask";

/** Convertit une entité KanbanTask en DTO exposé par l'API. */
export function toKanbanTaskDto(task: KanbanTask): KanbanTaskResponse {
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