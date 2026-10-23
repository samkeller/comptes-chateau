import type { NoteDto } from "@chocosous/shared";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";

interface NoteCardContentProps {
    note: NoteDto;
    /** Si fourni, les cases à cocher sont interactives et reçoivent le contenu markdown mis à jour. */
    onContentChange?: (newContent: string) => void;
}

/** Aperçu du contenu markdown d'une note dans sa carte. */
export default function NoteCardContent({ note, onContentChange }: NoteCardContentProps) {
    if (!note.content?.trim()) {
        return null;
    }

    return (
        <MarkdownRenderer
            className="mt-2 max-h-48 overflow-hidden text-sm text-surface-500"
            onChange={note.isArchived ? undefined : onContentChange}
        >
            {note.content}
        </MarkdownRenderer>
    );
}
