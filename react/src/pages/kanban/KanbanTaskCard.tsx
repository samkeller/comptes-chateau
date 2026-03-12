import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";
import { useDraggable } from "@dnd-kit/core";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask: (task: KanbanTask) => void,
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: task.id,
    });

    const header = (
        <div className="flex items-center justify-between">
            <span className="line-clamp-1">{task.title}</span>
            <PriorityFlag priority={task.priority} />
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                cursor: "grab",
            }}
        >
            <Card
                title={header}
                className="p-2 rounded-border cursor-pointer bg-gray-700 hover:bg-gray-600"
                onClick={() => setSelectedTask(task)}
            >
                <small
                    className="line-clamp-5"
                >
                    {task.description}
                </small>
            </Card>
        </div>
    )
}