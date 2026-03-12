import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask: (task: KanbanTask) => void
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    const header = (
        <div className="flex align-items-center justify-content-between">
            <span>{task.title}</span>
            <PriorityFlag priority={task.priority} />
        </div>
    );

    return (
        <Card
            title={header}
            className={"p-2 border-round cursor-pointer bg-gray-700 hover:bg-gray-600 "}
            onClick={() => setSelectedTask(task)}
        >
            <small>{task.description}</small>
        </Card>
    )
}