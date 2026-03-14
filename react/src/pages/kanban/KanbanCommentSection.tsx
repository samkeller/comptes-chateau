import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import Markdown from "react-markdown";
import KanbanService from "../../services/kanban/KanbanService";
import UserService from "../../services/UserService";
import MarkdownEditor from "../../components/form/markdown/MarkdownEditor";
import UserAvatar from "../../components/atoms/UserAvatar";
import { KanbanComment } from "../../interfaces/kanban/KanbanComment";
import { User } from "../../interfaces/User";
import { showGlobalToast } from "../../services/GlobalToast";

interface KanbanCommentSectionProps {
    taskId: number;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function KanbanCommentSection({ taskId }: KanbanCommentSectionProps) {
    const service = useRef(new KanbanService()).current;
    const userService = useRef(new UserService()).current;

    const [comments, setComments] = useState<KanbanComment[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [newContent, setNewContent] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        Promise.all([
            service.getTaskComments(taskId),
            userService.me(),
        ]).then(([fetchedComments, me]) => {
            setComments(fetchedComments);
            setCurrentUser(me);
        }).catch(() => {
            showGlobalToast({ severity: "error", summary: "Impossible de charger les commentaires." });
        }).finally(() => {
            setLoading(false);
        });
    }, [taskId]);

    async function handleSubmit() {
        if (newContent.trim().length === 0) return;

        setSubmitting(true);
        try {
            const created = await service.createComment(taskId, newContent);
            setComments(prev => [...prev, created]);
            setNewContent("");
        } catch {
            showGlobalToast({ severity: "error", summary: "Erreur lors de l'envoi du commentaire." });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(commentId: number) {
        try {
            await service.deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch {
            showGlobalToast({ severity: "error", summary: "Erreur lors de la suppression du commentaire." });
        }
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Commentaires {!loading && `(${comments.length})`}
            </h3>

            <div className="flex flex-col gap-3 overflow-y-auto grow pr-1">
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
                    const isOwn = currentUser?.id === comment.authorId;

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
                                        {formatDate(comment.createdAt)}
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
                                    <Markdown>{comment.content}</Markdown>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-600/40 pt-3 shrink-0">
                <MarkdownEditor
                    value={newContent}
                    onChange={setNewContent}
                />
                <div className="flex justify-end">
                    <Button
                        label="Envoyer"
                        icon="pi pi-send"
                        rounded
                        text
                        disabled={newContent.trim().length === 0 || submitting}
                        loading={submitting}
                        onClick={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
