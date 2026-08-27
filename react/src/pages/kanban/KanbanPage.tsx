import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useMemo, useState } from "react";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import KanbanTaskDialog from "./organisms/KanbanTaskDialog";
import FillRemainingHeight from "../../components/layout/FillRemainingHeight";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import KanbanTaskCard from "./KanbanTaskCard";
import { User } from "../../interfaces/User";
import KanbanFilters, { KanbanFiltersData } from "./KanbanFilters";
import { CreateKanbanTaskDto } from "@/services/kanban/dto/CreateKanbanTaskDto";
import { useScreen } from "@/hooks/useScreen";
import { Button } from "primereact/button";

export default function KanbanPage() {
    const { isMobile } = useScreen()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );
    const service = new KanbanService();

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [activeTaskDragId, setActiveTaskDragId] = useState<number | null>(null);
    const [mobileDisplayedColumn, setMobileDisplayedColumn] = useState<number>(0);

    const [filters, setFilters] = useState<KanbanFiltersData>({ users: [], tags: [], showDone: false });

    useEffect(() => {
        loadData()
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [boardData, tagsData] = await Promise.all([
                service.getBoardData(),
                service.getAllTags(),
            ]);

            setColumns(boardData.columns);
            setTasks(boardData.tasks);
            setAllTags(tagsData);
            setAllUsers(boardData.users);
        } finally {
            setLoading(false);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTaskDragId(null);

        if (!over) return;

        const draggedTaskId = active.id as number;
        const targetColumnId = over.id as number;

        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (!draggedTask || draggedTask.columnId === targetColumnId) return;

        const updatedTask: CreateKanbanTaskDto = {
            ...draggedTask,
            columnId: targetColumnId,
        };

        service.saveKanbanTask(updatedTask, draggedTaskId)
            .then(() => loadData())
    }

    const activeTask = activeTaskDragId ? tasks.find(t => t.id === activeTaskDragId) ?? null : null;

    const displayedTasks = useMemo(() => {
        const selectedTags = new Set(filters.tags);
        const byTag = selectedTags.size === 0
            ? tasks
            : tasks.filter(task => task.tags.some(tag => selectedTags.has(tag.trim().toLowerCase())));


        const byTagsAndUsers = filters.users.length === 0 ?
            byTag
            : byTag.filter(task => task.assignees.some(assignee => filters.users.some(user => user.id === assignee.id)));

        return filters.showDone
            ? byTagsAndUsers
            : byTagsAndUsers.filter(task => !task.isDone);
    }, [tasks, filters]);

    return (
        <PageTemplate pageTitle="Kanban">
            <DndContext
                sensors={isMobile ? [] : sensors}
                collisionDetection={closestCorners}
                autoScroll={false}
                onDragEnd={handleDragEnd}
                onDragStart={(event) => setActiveTaskDragId(event.active.id as number)}
            >
                {loading ? (
                    <div className="w-full flex justify-center p-20">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <FillRemainingHeight>
                        <div className="flex h-full w-full flex-col gap-3">
                            <KanbanFilters
                                allUsers={allUsers}
                                allTags={allTags}
                                filters={filters}
                                changeFilters={setFilters}
                            />

                            {
                                isMobile && (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            icon="pi pi-arrow-left"
                                            rounded text
                                            size="small"
                                            onClick={() => mobileDisplayedColumn - 1 >= 0 && setMobileDisplayedColumn(mobileDisplayedColumn - 1)}
                                            tooltip="Colonne précédente"
                                            tooltipOptions={{ position: "bottom" }}
                                        />
                                        <Button
                                            icon="pi pi-arrow-right"
                                            rounded text
                                            size="small"
                                            onClick={() => mobileDisplayedColumn + 1 < columns.length && setMobileDisplayedColumn(mobileDisplayedColumn + 1)}
                                            tooltip="Colonne suivante"
                                            tooltipOptions={{ position: "bottom" }}
                                        />
                                    </div>
                                )
                            }
                            <div className={"flex min-h-0 flex-1 flex-row gap-3 overflow-hidden"}>
                                {
                                    selectedTask && (
                                        <KanbanTaskDialog
                                            columns={columns}
                                            allTags={allTags.map(entry => entry)}
                                            allUsers={allUsers.map(user => new User(user))}
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
                                <div className="flex min-h-0 flex-1 flex-row gap-3 overflow-hidden">
                                    {isMobile ? (
                                        columns[mobileDisplayedColumn] ? (
                                            <KanbanColumnDisplay
                                                column={columns[mobileDisplayedColumn]}
                                                tasks={displayedTasks.filter(
                                                    t => t.columnId === columns[mobileDisplayedColumn]?.id
                                                )}
                                                setSelectedTask={setSelectedTask}
                                                activeId={activeTaskDragId}
                                                className="w-full"
                                            />
                                        ) : (
                                            <div className="flex w-full items-center justify-center text-gray-400">
                                                Aucune colonne disponible
                                            </div>
                                        )
                                    ) : (
                                        columns.map(column => (
                                            <KanbanColumnDisplay
                                                key={column.id}
                                                column={column}
                                                tasks={displayedTasks.filter(
                                                    t => t.columnId === column.id
                                                )}
                                                setSelectedTask={setSelectedTask}
                                                activeId={activeTaskDragId}
                                                className="min-w-0 flex-1"
                                            />
                                        ))
                                    )}
                                </div>
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
