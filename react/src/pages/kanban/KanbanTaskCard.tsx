import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";
import { useDraggable } from "@dnd-kit/core";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask: (task: KanbanTask) => void,
    isDragging?: boolean
}

export default function KanbanTaskCard({ task, setSelectedTask, isDragging }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef, isDragging: dragState } = useDraggable({
        id: task.id,
    });

    const header = (
        <div className="flex align-items-center justify-content-between">
            <span>{task.title}</span>
            <PriorityFlag priority={task.priority} />
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                opacity: dragState || isDragging ? 0.5 : 1,
                cursor: "grab",
                transition: "opacity 0.2s ease",
            }}
        >
            <Card
                title={header}
                className={"p-2 border-round cursor-pointer bg-gray-700 hover:bg-gray-600 " + (dragState ? "opacity-50" : "")}
                onClick={() => setSelectedTask(task)}
            >
                <small>{task.description}</small>
            </Card>
        </div>
    )
}