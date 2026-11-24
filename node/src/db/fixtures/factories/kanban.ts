import type { DeepPartial, EntityManager } from "typeorm";
import { KanbanColumn } from "../../../modules/kanban/entities/KanbanColumn";
import { KanbanComment } from "../../../modules/kanban/entities/KanbanComment";
import { KanbanTask } from "../../../modules/kanban/entities/KanbanTask";
import { EntityFactory } from "../EntityFactory";

export class KanbanColumnFactory extends EntityFactory<KanbanColumn> {
    constructor(manager: EntityManager) {
        super(manager, KanbanColumn);
    }

    /** L'ordre est unique : la nouvelle colonne se place après la dernière. */
    protected async defaults(sequence: number): Promise<DeepPartial<KanbanColumn>> {
        return { label: `Colonne ${sequence}`, order: (await this.maxOf("order")) + 1 };
    }
}

export class KanbanTaskFactory extends EntityFactory<KanbanTask, "columnId"> {
    constructor(manager: EntityManager) {
        super(manager, KanbanTask);
    }

    protected defaults(sequence: number): DeepPartial<KanbanTask> {
        return {
            title: `Tâche ${sequence}`,
            description: null,
            tags: [],
            priority: "normal",
            assignees: [],
            isDone: false,
            doneByUserId: null,
        };
    }
}

export class KanbanCommentFactory extends EntityFactory<KanbanComment, "taskId" | "authorId"> {
    constructor(manager: EntityManager) {
        super(manager, KanbanComment);
    }

    protected defaults(sequence: number): DeepPartial<KanbanComment> {
        return { content: `Commentaire ${sequence}` };
    }
}
