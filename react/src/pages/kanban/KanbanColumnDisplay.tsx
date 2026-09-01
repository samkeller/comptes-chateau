import { Card } from "primereact/card"
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import { Button } from "primereact/button"
import { useMemo, useState } from "react"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import KanbanTaskCard from "./KanbanTaskCard"
import { InputText } from "primereact/inputtext"
import { compareTaskPriority } from "./atoms/PriorityFlag"
import type { CreateKanbanTaskRequest } from "@chocosous/shared"
import PriorityFlagSelect from "./atoms/PriorityFlagSelect"
import { useDroppable } from "@dnd-kit/core"
import { useScreen } from "@/hooks/useScreen"
import { ScrollPanel } from "primereact/scrollpanel"

interface KanbanColumnProps {
    column: KanbanColumn
    tasks: KanbanTask[]
    setSelectedTask: (task: KanbanTask) => void
    activeId: number | null,
    className?: string
}

export default function KanbanColumnDisplay({ column, tasks, setSelectedTask, activeId, className }: KanbanColumnProps) {
    const { isDesktop } = useScreen();
    const [newTask, setNewTask] = useState<CreateKanbanTaskRequest>({
        title: "",
        columnId: column.id,
        priority: "normal",
        tags: [],
    });

    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        disabled: !isDesktop,
    });

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((left, right) => {
            if (left.isDone !== right.isDone) {
                return left.isDone ? 1 : -1;
            }

            return compareTaskPriority(left.priority, right.priority);
        });
    }, [tasks]);

    function handleAddTask() {
        setSelectedTask(new KanbanTask({
            ...newTask,
            id: 0,
        }))
    }

    return (
        <div
            ref={setNodeRef}
            className={"h-full border rounded-xl overflow-hidden " + (isOver ? "border-cyan-300/60 shadow-lg" : " border-surface shadow-sm") + (className ? " " + className : "")}
        >
            <Card
                title={column.label}
                className="h-full w-full rounded-none border-0"
                pt={{
                    body: { className: "h-full" },
                    content: { className: "h-full flex flex-col gap-3 pb-10" }
                }}
            >
                <ScrollPanel className="grow min-h-0 min-w-0 px-2">
                    <div className="flex flex-col gap-2 min-h-0 overflow-y-auto">
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
                    </div>
                </ScrollPanel>

                <div className="flex flex-row items-center gap-2 pt-2 shrink-0">
                    <InputText
                        placeholder="Ajouter une tâche..."
                        className="w-full"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <div className="flex items-center">
                        <PriorityFlagSelect
                            btnClassName="w-6 h-6 p-4"
                            priority={newTask.priority ?? "normal"}
                            onChange={(priority) => {
                                setNewTask({ ...newTask, priority: priority })
                            }
                            }
                        />
                        <Button
                            className="w-6 h-6 p-4"
                            text
                            icon="pi pi-plus"
                            rounded
                            onClick={handleAddTask}
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}