import { Card } from "primereact/card";
import KanbanTask from "../../interfaces/kanban/KanbanTask"
import PriorityFlag from "./atoms/PriorityFlag";
import { useDraggable } from "@dnd-kit/core";
import Markdown from "react-markdown";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";
import UserAvatar from "../../components/atoms/UserAvatar";
import { AvatarGroup } from "primereact/avatargroup";
import TailwindTag from "@/components/atoms/TailwindTag";

interface KanbanTaskCardProps {
    task: KanbanTask,
    setSelectedTask?: (task: KanbanTask) => void,
}

export default function KanbanTaskCard({ task, setSelectedTask }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: task.id,
    });

    const visibleTags = task.tags.slice(0, 3);
    const extraTagsCount = task.tags.length - visibleTags.length;
    const hasDescription = Boolean(task.description?.trim());

    const header = (
        <>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    <TailwindTag>
                        {`#${task.id}`}
                    </TailwindTag>
                    <span className="line-clamp-1 text-[0.95rem] font-bold leading-5">
                        {task.title}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {task.assignees.length > 0 && (
                        <AvatarGroup>
                            {task.assignees.map((assignee) => <UserAvatar key={assignee.id} user={assignee} />)}
                        </AvatarGroup>
                    )}

                    <TailwindTag>
                        <PriorityFlag priority={task.priority} showLabel={true} />
                    </TailwindTag>
                </div>
            </div>
            {visibleTags.length > 0 && (
                <div className="flex items-start gap-1 mt-2">
                    {visibleTags.map((tag) => <KanbanTagDisplay key={tag} tag={tag} />)}
                    {extraTagsCount > 0 && (
                        <TailwindTag>
                            {`+${extraTagsCount}`}
                        </TailwindTag>
                    )}
                </div>
            )}
        </>

    );

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="group"
            style={{
                cursor: "grab",
            }}
        >
            <Card
                title={header}
                className="cursor-pointer rounded-xl border border-surface bg-slate-800/90 p-2 shadow-sm transition-all duration-200 hover:border-cyan-300/60 hover:shadow-lg"
                pt={{
                    title: { className: "m-0" },
                    content: { className: "pt-2" },
                }}
                onClick={() => setSelectedTask && setSelectedTask(task)}
            >
                {hasDescription ? (
                    <div className="line-clamp-3 rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200/90 tiptap [&_p]:m-0">
                        <Markdown>
                            {task.description}
                        </Markdown>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-slate-500/60 px-3 py-2 text-sm italic text-slate-400">
                        Aucune description
                    </div>
                )}
            </Card>
        </div>
    )
}