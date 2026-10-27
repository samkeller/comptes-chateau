export interface NoteDto {
    id: number;
    title: string;
    content: string | null;
    isPinned: boolean;
    isArchived: boolean;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: number;
}
