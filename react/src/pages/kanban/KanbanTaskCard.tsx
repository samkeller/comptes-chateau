import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";
import { useDraggable } from "@dnd-kit/core";
import Markdown from "react-markdown";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask?: (task: KanbanTask) => void,
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: task.id,
    });

    const header = (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex flex-wrap gap-1">
                    {task.tags.map(tag => <KanbanTagDisplay key={tag} tag={tag} />)}
                </div>
                <span className="line-clamp-1">{task.title}</span>
            </div>
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
                onClick={() => setSelectedTask && setSelectedTask(task)}
            >
                <div className="line-clamp-3 tiptap">
                    <Markdown >
                        {task.description}
                    </Markdown>
                </div>
            </Card>
        </div>
    )
}