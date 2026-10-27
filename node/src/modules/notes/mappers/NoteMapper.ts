import type { NoteDto } from "@chocosous/shared";
import { Note } from "../entities/Note";

export function toNoteDto(note: Note): NoteDto {
    return {
        id: note.id,
        title: note.title,
        content: note.content,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        archivedAt: note.archivedAt?.toISOString() ?? null,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        authorId: note.authorId,
    };
}
