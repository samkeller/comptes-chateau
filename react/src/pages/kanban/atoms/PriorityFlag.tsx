import { useScreen } from "@/hooks/useScreen";
import type { KanbanTaskPriority } from "@chocosous/shared";


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

interface PriorityFlagProps {
    priority: KanbanTaskPriority
}

export default function PriorityFlag({ priority }: PriorityFlagProps) {
    const { isMobile } = useScreen();

    return (
        <div className="flex items-center gap-1.5">
            <i
                className="pi pi-flag-fill"
                style={{ color: getPriorityColor(priority) }}
                data-pr-tooltip={getPriorityLabel(priority)}
            />
            {!isMobile && <span className="capitalize tracking-wide">{getPriorityLabel(priority)}</span>}
        </div>
    )
}