import type { CreateNoteItemInput, NoteItemDto } from "@chocosous/shared";

const LIST_PREFIX = /^\s*(?:[-*+]|\d+\.)\s+(?:\[([ xX])\]\s*)?/;
const HEADING_PREFIX = /^\s{0,3}#{1,6}\s+/;

export function markdownToChecklist(markdown: string): CreateNoteItemInput[] {
    return markdown
        .split(/\r?\n/)
        .map((line) => {
            const listPrefix = line.match(LIST_PREFIX);
            const isChecked = listPrefix?.[1]?.toLowerCase() === "x";
            const label = line
                .replace(LIST_PREFIX, "")
                .replace(HEADING_PREFIX, "")
                .trim();
            return { label, isChecked };
        })
        .filter((item) => item.label.length > 0)
        .map((item, sortOrder) => ({ ...item, sortOrder }));
}

export function checklistToMarkdown(items: Array<Pick<NoteItemDto, "label"> & { isChecked?: boolean }>): string {
    return items
        .map((item) => `- [${item.isChecked ? "x" : " "}] ${item.label}`)
        .join("\n");
}
