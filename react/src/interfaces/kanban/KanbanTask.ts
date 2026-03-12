
import { KanbanTaskPriority } from "./KanbanTaskPriority";

export default class KanbanTask {
 
    id: number = 0;
    title: string = "";
    description: string | null = null;
    columnId: number = 0;
    priority: KanbanTaskPriority = "normal";
    
    constructor(partial: Partial<KanbanTask>) {
        Object.assign(this, partial);
    }
}