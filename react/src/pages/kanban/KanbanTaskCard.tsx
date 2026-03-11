import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask: (task: KanbanTask) => void
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    return (
        <Card
            title={task.title}
            className={"p-2 border-round cursor-pointer bg-gray-700 hover:bg-gray-600 "}
            onClick={() => setSelectedTask(task)}
        >
            <small>{task.description}</small>
        </Card>
    )
}