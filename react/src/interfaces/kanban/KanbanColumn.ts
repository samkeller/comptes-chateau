export default class KanbanColumn {
    id: number = 0
    label: string = "";
    order: number = 0;

    constructor(partial: Partial<KanbanColumn>) {
        Object.assign(this, partial);
    }
}
