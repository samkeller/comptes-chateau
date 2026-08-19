import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import KanbanService from "../../../services/kanban/KanbanService";
import MarkdownEditor from "../../../components/form/markdown/MarkdownEditor";
import UserAvatar from "../../../components/atoms/UserAvatar";
import { KanbanComment } from "../../../interfaces/kanban/KanbanComment";
import { useConnectedUser } from "../../../context/ConnectedUserContext";
import { User } from "@/interfaces/User";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import { ScrollPanel } from "primereact/scrollpanel";

interface KanbanCommentSectionProps {
    taskId: number;
}

function toCommentDateFormat(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const service = new KanbanService();

export default function KanbanCommentSection({ taskId }: KanbanCommentSectionProps) {
    const { connectedUser } = useConnectedUser();

    const [comments, setComments] = useState<KanbanComment[]>([]);
    const [newContent, setNewContent] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        service.getTaskComments(taskId)
            .then(setComments)
            .finally(() => {
                setLoading(false);
            });
    }, [taskId]);

    function handleSubmit() {
        if (newContent.trim().length === 0) return;

        setSubmitting(true);
        service
            .createComment(taskId, newContent)
            .then((created) => {
                setComments(prev => [...prev, created]);
                setNewContent("");
            })
            .finally(() => {
                setSubmitting(false);
            });
    }

    function handleDelete(commentId: number) {
        service
            .deleteComment(commentId)
            .then(() => {
                setComments(prev => prev.filter(c => c.id !== commentId));
            })
    }

    return (
        <FillRemainingHeight>
            <ScrollPanel className="w-full h-full">
                <div className="flex h-full min-h-0 flex-col">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                        Commentaires {!loading && `(${comments.length})`}
                    </h3>
                    <ScrollPanel className="min-h-50 flex-1">
                        <div className="flex flex-col gap-2">
                            {loading && (
                                <div className="text-slate-400 text-sm italic">Chargement…</div>
                            )}
                            {!loading && comments.length === 0 && (
                                <div className="rounded-lg border border-dashed border-slate-500/60 px-3 py-4 text-sm italic text-slate-400 text-center">
                                    Aucun commentaire pour le moment
                                </div>
                            )}
                            {comments.map(comment => {
                                const commentUser = new User({
                                    id: comment.authorId,
                                    username: comment.authorUsername,
                                    avatar: comment.authorAvatar,
                                });
                                const isOwn = connectedUser?.id === comment.authorId;

                                return (
                                    <div key={comment.id} className="flex gap-2 group">
                                        <div className="shrink-0 mt-1">
                                            <UserAvatar user={commentUser} />
                                        </div>
                                        <div className="flex flex-col gap-1 grow min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-semibold text-slate-200">
                                                    {comment.authorUsername}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {toCommentDateFormat(comment.createdAt)}
                                                </span>
                                                {isOwn && (
                                                    <Button
                                                        icon="pi pi-trash"
                                                        text
                                                        rounded
                                                        severity="danger"
                                                        size="small"
                                                        className="ml-auto py-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDelete(comment.id)}
                                                        tooltip="Supprimer"
                                                    />
                                                )}
                                            </div>
                                            <div className="tiptap rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200/90 [&_p]:m-0">
                                                <MarkdownRenderer>{comment.content}</MarkdownRenderer>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollPanel>

                    <div className="border-t border-slate-600/40 py-3">
                        <div className="h-full w-full relative">
                            <MarkdownEditor
                                value={newContent}
                                onChange={setNewContent}
                            />
                            <Button
                                className="absolute! right-2 bottom-2 z-10!"
                                icon="pi pi-send"
                                rounded
                                text
                                disabled={newContent.trim().length === 0 || submitting}
                                loading={submitting}
                                onClick={handleSubmit}
                                tooltip="Envoyer"
                                tooltipOptions={{ position: "left" }}
                            />
                        </div>
                    </div>
                </div>
            </ScrollPanel>
        </FillRemainingHeight>
    );
}
