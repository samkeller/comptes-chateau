import { Card } from "primereact/card"
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useMemo, useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import KanbanService from "../../services/kanban/KanbanService"
import { showGlobalToast } from "../../services/GlobalToast"
import { compareTaskPriority } from "./atoms/PriorityFlag"
import { CreateKanbanTaskDto } from "../../services/kanban/dto/CreateKanbanTaskDto"
import PriorityFlagSelect from "./atoms/PriorityFlagSelect"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    setSelectedTask: (task: KanbanTask) => void
    reloadTasks: () => void
}

export default function KanbanColumnDisplay({ column, tasks, setSelectedTask, reloadTasks }: KanbanColumnProps) {
    const kanbanService = new KanbanService();
    const [newTask, setNewTask] = useState<CreateKanbanTaskDto>({
        title: "",
        columnId: column.id,
        priority: "normal",
    });


    const sortedTasks = useMemo(() => {
        return [...tasks].sort((left, right) => compareTaskPriority(left.priority, right.priority));
    }, [tasks]);

    function handleAddTask() {
        kanbanService.createKanbanTask(newTask).then(task => {
            showGlobalToast({
                severity: "success",
                summary: "Tâche créée.",
            })
            setSelectedTask(task);
            setNewTask({ ...newTask, title: "" });
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
            {sortedTasks.map(task => (
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
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <PriorityFlagSelect
                    priority={newTask.priority}
                    onChange={(priority) => {
                        console.log("new", priority)
                        setNewTask({ ...newTask, priority: priority})}
                    }
                />
                <Button
                    className="flex-shrink-0"
                    text
                    icon="pi pi-plus"
                    rounded
                    onClick={handleAddTask}
                />
            </div>
        </Card>
    )
}