import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import { NoteDto } from "@chocosous/shared";

interface TextRenderContentProps {
    note: NoteDto;
}
export default function TextRenderContent({ note }: TextRenderContentProps) {
    return note.content ? (
        <div className="mt-2 max-h-32 overflow-hidden text-sm text-surface-500">
            <MarkdownRenderer>{note.content}</MarkdownRenderer>
        </div>
    ) : (
        <span className="mt-2 block text-sm italic text-surface-500">Note vide</span>
    );
}