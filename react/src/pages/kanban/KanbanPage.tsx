import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import KanbanTaskDialog from "./KanbanTaskDialog";
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
import KanbanTaskCard from "./KanbanTaskCard";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";
import { MultiSelect } from "primereact/multiselect";



export default function KanbanPage() {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [overColumnId, setOverColumnId] = useState<number | null>(null);

    // Filters
    const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);


    useEffect(() => {
        loadData();
    }, []);

    function loadData() {
        setLoading(true);
        Promise.all([service.getBoardData(), service.getAllTags()])
            .then(([boardData, tagData]) => {
                setColumns(boardData.columns);
                setTasks(boardData.tasks);
                setAllTags(tagData);
                setActiveTagFilters(tagData);
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
            loadData();
        });
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) ?? null : null;

    const displayedTasks = useMemo(() => {
        if (activeTagFilters.length === 0) {
            return tasks;
        }

        const selectedTags = new Set(activeTagFilters);

        return tasks.filter(task => task.tags.some(tag => selectedTags.has(tag.trim().toLowerCase())));
    }, [tasks, activeTagFilters]);


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
                    <div className="w-full flex justify-center p-20">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <FillRemainingHeight>
                        <div className="flex flex-col w-full h-full gap-3">
                            <div className="flex items-center justify-end gap-2">
                                <i className="pi pi-filter" />
                                <MultiSelect
                                    value={activeTagFilters}
                                    options={allTags.map(tag => ({ label: tag, value: tag }))}
                                    onChange={(e) => setActiveTagFilters(e.value)}
                                    placeholder="Tags"
                                    className="w-60"
                                    itemTemplate={(option) => option && <KanbanTagDisplay tag={option.value} />}
                                    selectedItemTemplate={(option) => option && <KanbanTagDisplay tag={option} />}
                                />
                            </div>
                            <div className="flex flex-row w-full h-full gap-6">
                                {
                                    selectedTask && (
                                        <KanbanTaskDialog
                                            columns={columns}
                                            allTags={allTags.map(entry => entry)}
                                            task={selectedTask}
                                            closeDialog={(reloadList) => {
                                                setSelectedTask(null);
                                                if (reloadList) {
                                                    loadData();
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
                                                tasks={displayedTasks.filter(t => t.columnId === column.id)}
                                                setSelectedTask={setSelectedTask}
                                                activeId={activeId}
                                                ghostTask={overColumnId === column.id ? activeTask : null}
                                            />
                                        </div>
                                    ))
                                }
                            </div>
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
                            <KanbanTaskCard
                                task={activeTask}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </PageTemplate>
    );
}
