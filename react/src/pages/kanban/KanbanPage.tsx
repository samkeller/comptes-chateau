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
    DragOverlay,
    closestCorners,
} from "@dnd-kit/core";



export default function KanbanPage() {
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);


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

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const draggedTaskId = active.id as number;
        const targetColumnId = over.id as number;

        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (!draggedTask || draggedTask.columnId === targetColumnId) return;

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
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
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
