import { Card } from "primereact/card"
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useEffect, useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import KanbanService from "../../services/kanban/KanbanService"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    reloadTasks: () => void
}

export default function KanbanColumnDisplay({ column, tasks, reloadTasks }: KanbanColumnProps) {
    const kanbanService = new KanbanService();
    const [newTaskTitle, setNewTaskTitle] = useState("");

    useEffect(() => {
        console.log("Column", column);
        console.log("Tasks", tasks);
    }, [column, tasks])

    function handleAddTask() {
        kanbanService.saveKanbanTask({
            title: newTaskTitle,
            columnId: column.id,
        }).then(() => {
            setNewTaskTitle("");
            reloadTasks();
        })
    }

    return (
        <Card
            title={column.label}
            className="h-full"
            pt={{
                body: { className: "h-full" },
                content: { className: "h-full flex flex-column gap-2" }
            }}

        >
            {tasks.map(task => (
                <div key={task.id} className="kanban-task">
                    <KanbanTaskCard
                        task={task}
                    />
                </div>
            ))}
            <div className="flex-grow-1"></div>

            <div className="flex flex-row flex-shrink-0">
                <InputText
                    placeholder="Ajouter une tâche..."
                    className="flex-grow-1 "
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <Button
                    className="flex-shrink-0"
                    text
                    icon="pi pi-plus"
                    onClick={handleAddTask}
                />
            </div>
        </Card>
    )
}