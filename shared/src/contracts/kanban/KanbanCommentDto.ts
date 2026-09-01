/** Commentaire de tâche kanban tel que renvoyé par l'API. */
export interface KanbanCommentResponse {
    id: number;
    taskId: number;
    content: string;
    authorId: number;
    authorUsername: string;
    authorAvatar: string;
    createdAt: string;
}
