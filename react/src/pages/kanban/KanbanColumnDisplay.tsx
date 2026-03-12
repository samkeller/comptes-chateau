import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useMemo, useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import KanbanService from "../../services/kanban/KanbanService"
import { compareTaskPriority } from "./atoms/PriorityFlag"
import { CreateKanbanTaskDto } from "../../services/kanban/dto/CreateKanbanTaskDto"
import PriorityFlagSelect from "./atoms/PriorityFlagSelect"
import { useDroppable } from "@dnd-kit/core"
import { Card } from "primereact/card"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    setSelectedTask: (task: KanbanTask) => void
    reloadTasks: () => void
    activeId: number | null
}

export default function KanbanColumnDisplay({ column, tasks, setSelectedTask, reloadTasks, activeId }: KanbanColumnProps) {
    const kanbanService = new KanbanService();
    const [newTask, setNewTask] = useState<CreateKanbanTaskDto>({
        title: "",
        columnId: column.id,
        priority: "normal",
    });

    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((left, right) => compareTaskPriority(left.priority, right.priority));
    }, [tasks]);

    function handleAddTask() {
        kanbanService.createKanbanTask(newTask).then(task => {
            setSelectedTask(task);
            setNewTask({ ...newTask, title: "" });
            reloadTasks();
        })
    }

    return (
        <div
            ref={setNodeRef}
            className="flex flex-column h-full p-2 border-1 surface-border border-round"
            style={{
                boxShadow: isOver ? "0 0 0 4px rgba(41, 121, 255, 0.18)" : undefined,
                transition: "box-shadow 0.15s ease",
            }}
        >
            <h2>{column.label}</h2>
            <div className="flex flex-column gap-2 flex-grow-1">
                {sortedTasks.map(task => (
                    <div key={task.id} className="kanban-task">
                        <KanbanTaskCard
                            task={task}
                            setSelectedTask={setSelectedTask}
                            isDragging={activeId === task.id}
                        />
                    </div>
                ))}
            </div>
            <Card
                pt={{
                    body: {className: "p-0"},
                    content: {className: "p-3"},
                }}
            >

                <div className="flex flex-row flex-shrink-0">
                    <InputText
                        placeholder="Ajouter une tâche..."
                        className="flex-grow-1"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <PriorityFlagSelect
                        priority={newTask.priority}
                        onChange={(priority) => {
                            console.log("new", priority)
                            setNewTask({ ...newTask, priority: priority })
                        }}
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
                        
        </div>
    )
}