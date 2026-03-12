import { KanbanTaskPriority } from "../../../interfaces/kanban/KanbanTaskPriority";


const PRIORITY_RANK: Record<KanbanTaskPriority, number> = {
    high: 3,
    normal: 2,
    low: 1,
};

export function compareTaskPriority(left: KanbanTaskPriority, right: KanbanTaskPriority): number {
    return PRIORITY_RANK[right] - PRIORITY_RANK[left];
}

export function getPriorityColor(priority: KanbanTaskPriority): string {
    if (priority === "high") {
        return "var(--red-500)";
    }

    if (priority === "low") {
        return "var(--green-500)";
    }
    return "var(--yellow-500)";
}

export function getPriorityLabel(priority: KanbanTaskPriority): string {
    if (priority === "high") {
        return "Haute";
    }

    if (priority === "low") {
        return "Basse";
    }

    return "Normale";
}

export default function PriorityFlag({ priority }: { priority: KanbanTaskPriority }) {
    return (
        <i
            className="pi pi-flag-fill"
            style={{ color: getPriorityColor(priority) }}
            data-pr-tooltip={getPriorityLabel(priority)}
        />
    )
}