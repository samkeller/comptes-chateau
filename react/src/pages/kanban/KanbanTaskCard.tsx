import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { CSSProperties, useState } from "react"

interface KanbanTaskCardProps {
    task: KanbanTask
}

export default function KanbanTaskCard({ task }: KanbanTaskCardProps) {
    const [openTask, setOpenTask] = useState(false)
    const [hovered, setHovered] = useState(false);

    return (
        <Card
            title={task.title}
            className={"p-2 border-round cursor-pointer bg-gray-700 hover:bg-gray-600 "}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => setOpenTask(!openTask)}
        >
            <small>{task.description}</small>
        </Card>
    )
}