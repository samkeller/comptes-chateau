import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";
import { useDraggable } from "@dnd-kit/core";
import UserAvatar from "../../components/atoms/UserAvatar";
import { AvatarGroup } from "primereact/avatargroup";
import TailwindTag from "@/components/atoms/TailwindTag";
import { useScreen } from "@/hooks/useScreen";
import { Button } from "primereact/button";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask?: (task: KanbanTask, initialTab?: "task" | "comments") => void,
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    const { isDesktop } = useScreen();
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: task.id,
        disabled: !isDesktop,
    });
    const header = (
        <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="line-clamp-2 wrap-break-words text-[0.95rem] font-bold leading-5">
                    {task.title}
                </span>
            </div>

            <div className="flex items-center gap-1 self-start sm:self-auto">
                {task.assignees.length > 0 && (
                    <AvatarGroup>
                        {task.assignees.map((assignee) => <UserAvatar key={assignee.id} user={assignee} />)}
                    </AvatarGroup>
                )}

                <div className="text-sm">
                    <TailwindTag>
                        <PriorityFlag priority={task.priority} />
                    </TailwindTag>
                </div>
                {task.isDone && (
                    <span aria-label="Terminée" className="text-green-400">
                        <i className="pi pi-check-circle" />
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            // Si PC -> On ajoute les fonctions DnD
            {...(isDesktop && listeners)}
            {...(isDesktop && attributes)}
            className={`group relative ${isDesktop ? "cursor-grab" : ""}`}
        >
            <Card
                title={header}
                className={`w-full cursor-pointer rounded-xl border p-2 shadow-sm transition-all duration-200 hover:shadow-lg ${task.isDone
                    ? "border-green-500/40 bg-slate-800/50 opacity-60 hover:border-green-400/60"
                    : "border-surface bg-slate-800/90 hover:border-cyan-300/60"
                    }`}
                pt={{
                    title: { className: "m-0" },
                    content: { className: "pt-2" },
                }}
                onClick={() => setSelectedTask && setSelectedTask(task)}
            >
                <Button
                    label={`Commentaires (${task.commentCount})`}
                    icon="pi pi-comments"
                    text
                    size="small"
                    className="min-h-11 min-w-11"
                    aria-label={`Ouvrir les commentaires (${task.commentCount})`}
                    onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTask?.(task, "comments");
                    }}
                />
            </Card>
        </div >
    )
}