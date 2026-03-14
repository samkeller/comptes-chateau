
import { KanbanTaskPriority } from "./KanbanTaskPriority";
import { User } from "../User";

export default class KanbanTask {
    
    id: number = 0;
    title: string = "";
    description: string | null = null;
    columnId: number = 0;
    priority: KanbanTaskPriority = "normal";
    tags: string[] = [];
    assignees: User[] = [];
    
    constructor(partial: Partial<KanbanTask>) {
        Object.assign(this, partial);
    }
}