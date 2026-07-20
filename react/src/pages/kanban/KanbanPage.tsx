import { ProgressSpinner } from "primereact/progressspinner";
import { PageTemplate } from "../PageTemplate";
import { useEffect, useMemo, useState } from "react";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import KanbanColumnDisplay from "./KanbanColumnDisplay";
import KanbanColumn from "../../interfaces/kanban/KanbanColumn";
import KanbanTaskDialog from "./KanbanTaskDialog";
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
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);

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
        setActiveId(null);

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

    const activeTask = activeId ? tasks.find(t => t.id === activeId) ?? null : null;

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
                sensors={sensors}
                collisionDetection={closestCorners}
                autoScroll={false}
                onDragEnd={handleDragEnd}
                onDragStart={(event) => setActiveId(event.active.id as number)}
            >
                {loading ? (
                    <div className="w-full flex justify-center p-20">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <FillRemainingHeight>
                        <div className="flex flex-col w-full h-full gap-3">
                            <KanbanFilters
                                allUsers={allUsers}
                                allTags={allTags}
                                filters={filters}
                                changeFilters={setFilters}
                            />
                            <div className="flex flex-col xl:flex-row w-full h-full gap-4 xl:gap-6">
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
                                {
                                    columns.map(column => (
                                        <div className="flex-1 min-w-0" key={column.id}>
                                            <KanbanColumnDisplay
                                                column={column}
                                                tasks={displayedTasks.filter(t => t.columnId === column.id)}
                                                setSelectedTask={setSelectedTask}
                                                activeId={activeId}
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
