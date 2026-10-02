import type { NoteDto, NoteItemDto } from "@chocosous/shared";
import { Note } from "../entities/Note";
import { NoteItem } from "../entities/NoteItem";

export function toNoteItemDto(item: NoteItem): NoteItemDto {
    return {
        id: item.id,
        noteId: item.noteId,
        label: item.label,
        isChecked: item.isChecked,
        sortOrder: item.sortOrder,
    };
}

export function toNoteDto(note: Note): NoteDto {
    return {
        id: note.id,
        title: note.title,
        type: note.type,
        content: note.content,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        archivedAt: note.archivedAt?.toISOString() ?? null,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        authorId: note.authorId,
        items: (note.items ?? [])
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)
            .map(toNoteItemDto),
    };
}
