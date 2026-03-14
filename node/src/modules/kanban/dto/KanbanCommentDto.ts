export interface KanbanCommentDto {
    id: number;
    taskId: number;
    content: string;
    authorId: number;
    authorUsername: string;
    authorAvatar: string;
    createdAt: string;
}
