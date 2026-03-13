import { Card } from "primereact/card"
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useMemo, useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import { compareTaskPriority } from "./atoms/PriorityFlag"
import { CreateKanbanTaskDto } from "../../services/kanban/dto/CreateKanbanTaskDto"
import PriorityFlagSelect from "./atoms/PriorityFlagSelect"
import { useDroppable } from "@dnd-kit/core"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    setSelectedTask: (task: KanbanTask) => void
    activeId: number | null
    /**
     * Affiche une carte fantôme lors du drag and drop pour indiquer où la tâche sera déposée.
     */
    ghostTask: KanbanTask | null
}

export default function KanbanColumnDisplay({ column, tasks, setSelectedTask, activeId, ghostTask }: KanbanColumnProps) {
    const [newTask, setNewTask] = useState<CreateKanbanTaskDto>({
        title: "",
        columnId: column.id,
        priority: "normal",
        tags: [],
    });

    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((left, right) => compareTaskPriority(left.priority, right.priority));
    }, [tasks]);

    function handleAddTask() {
        setSelectedTask(
            {
                ...newTask,
                id: 0,
                description: "",
                tags: [],
            }
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                position: "relative",
                boxShadow: isOver ? "0 0 0 4px rgba(41, 121, 255, 0.18)" : undefined,
                transition: "box-shadow 0.15s ease",
                borderRadius: "6px",
                height: "100%",
            }}
        >
            <Card
                title={column.label}
                className="h-full"
                pt={{
                    body: { className: "h-full" },
                    content: { className: "h-full flex flex-col gap-2" }
                }}

            >
                {sortedTasks.map(task => (
                    activeId === task.id ? null : (
                        <div
                            key={task.id}
                            style={activeId ? { pointerEvents: "none" } : undefined}
                        >
                            <KanbanTaskCard
                                task={task}
                                setSelectedTask={setSelectedTask}
                            />
                        </div>
                    )
                ))}
                {ghostTask && (
                    <div style={{ opacity: 0.4, pointerEvents: "none" }}>
                        <KanbanTaskCard
                            task={ghostTask}
                            setSelectedTask={setSelectedTask}
                        />
                    </div>
                )}
                <div className="grow"></div>

                <div className="flex flex-row shrink-0 py-2">
                    <InputText
                        placeholder="Ajouter une tâche..."
                        className="grow "
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <PriorityFlagSelect
                        priority={newTask.priority}
                        onChange={(priority) => {
                            setNewTask({ ...newTask, priority: priority })
                        }
                        }
                    />
                    <Button
                        className="shrink-0"
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