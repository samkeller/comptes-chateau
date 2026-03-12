import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import KanbanTaskDialog from "./KanbanTaskDialog";
import PriorityFlag from "./atoms/PriorityFlag";
import FillRemainingHeight from "../../components/layout/FillRemainingHeight";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core";



export default function KanbanPage() {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [overColumnId, setOverColumnId] = useState<number | null>(null);


    useEffect(() => {
        loadBoard();
    }, []);

    function loadBoard() {
        setLoading(true);
        service.getBoardData()
            .then(boardData => {
                setColumns(boardData.columns);
                setTasks(boardData.tasks);
                setLoading(false);
            });
    }

    function handleDragOver(event: DragOverEvent) {
        const { over } = event;
        setOverColumnId(over ? over.id as number : null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setOverColumnId(null);

        if (!over) return;

        const draggedTaskId = active.id as number;
        const targetColumnId = over.id as number;

        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (!draggedTask || draggedTask.columnId === targetColumnId) return;

        setTasks(prev => prev.map(t =>
            t.id === draggedTaskId ? new KanbanTask({ ...t, columnId: targetColumnId }) : t
        ));

        const updatedTask = new KanbanTask({
            ...draggedTask,
            columnId: targetColumnId,
        });

        service.saveKanbanTask(updatedTask).then(() => {
            loadBoard();
        });
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) ?? null : null;


    return (
        <PageTemplate pageTitle="Kanban">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragStart={(event) => setActiveId(event.active.id as number)}
            >
                {loading ? (
                    <div className="w-full flex justify-content-center p-5">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <FillRemainingHeight>
                        <div className="flex flex-row w-full h-full gap-3">
                            {
                                selectedTask && (
                                    <KanbanTaskDialog
                                        columns={columns}
                                        task={selectedTask}
                                        closeDialog={(reloadList) => {
                                            setSelectedTask(null);
                                            if (reloadList) {
                                                loadBoard();
                                            }
                                        }}
                                    />
                                )
                            }
                            {
                                columns.map(column => (
                                    <div className="flex-1" key={column.id}>
                                        <KanbanColumnDisplay
                                            column={column}
                                            tasks={tasks.filter(t => t.columnId === column.id)}
                                            reloadTasks={loadBoard}
                                            setSelectedTask={setSelectedTask}
                                            activeId={activeId}
                                            ghostTask={overColumnId === column.id ? activeTask : null}
                                        />
                                    </div>
                                ))
                            }
                        </div>
                    </FillRemainingHeight>
                )}
                <DragOverlay>
                    {activeTask ? (
                        <div style={{
                            width: "100%",
                            maxWidth: "420px",
                            opacity: 0.92,
                            pointerEvents: "none",
                        }}>
                            <Card
                                className="p-2 border-round bg-gray-700"
                                title={(
                                    <div className="flex align-items-center justify-content-between">
                                        <span>{activeTask.title}</span>
                                        <PriorityFlag priority={activeTask.priority} />
                                    </div>
                                )}
                            >
                                <small>{activeTask.description}</small>
                            </Card>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </PageTemplate>
    );
}
