import { Card } from "primereact/card"
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import KanbanService from "../../services/kanban/KanbanService"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    setSelectedTask: (task: KanbanTask) => void
    reloadTasks: () => void
}

export default function KanbanColumnDisplay({ column, tasks, setSelectedTask, reloadTasks }: KanbanColumnProps) {
    const kanbanService = new KanbanService();
    const [newTaskTitle, setNewTaskTitle] = useState("");

    function handleAddTask() {
        kanbanService.createKanbanTask({
            title: newTaskTitle,
            
            columnId: column.id,
        }).then(task => {
            setSelectedTask(task);
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
                        setSelectedTask={setSelectedTask}
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