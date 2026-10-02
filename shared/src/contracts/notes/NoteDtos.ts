import type { NoteType } from "./NoteTypes";

export interface NoteItemDto {
    id: number;
    noteId: number;
    label: string;
    isChecked: boolean;
    sortOrder: number;
}

export interface NoteDto {
    id: number;
    title: string;
    type: NoteType;
    content: string | null;
    isPinned: boolean;
    isArchived: boolean;
    archivedAt: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: number;
    items: NoteItemDto[];
}

export interface CreateNoteItemInput {
    label: string;
    isChecked?: boolean;
    sortOrder?: number;
}
