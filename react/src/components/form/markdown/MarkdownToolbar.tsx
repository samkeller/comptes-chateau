import { Editor } from "@tiptap/react";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { SelectItem } from "primereact/selectitem";

interface MarkdownToolbarProps {
    editor: Editor | null;
}

type HeadingLevel = 1 | 2 | 3;

const HEADING_OPTIONS: SelectItem[] = [
    { value: 0, label: "Paragraphe" },
    { value: 1, label: "Titre 1" },
    { value: 2, label: "Titre 2" },
    { value: 3, label: "Titre 3" },
];

function getActiveHeadingLevel(editor: Editor): number {
    for (const level of [1, 2, 3] as HeadingLevel[]) {
        if (editor.isActive("heading", { level })) {
            return level;
        }
    }
    return 0;
}

export default function MarkdownToolbar({ editor }: MarkdownToolbarProps) {
    if (!editor) return null;

    function onHeadingChange(level: number) {
        if (!editor) return;
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().toggleHeading({ level: level as HeadingLevel }).run();
        }
    }

    const startContent = (
        <div className="flex gap-1 items-center">
            <Dropdown
                value={getActiveHeadingLevel(editor)}
                options={HEADING_OPTIONS}
                onChange={e => onHeadingChange(e.value as number)}
                className="w-[9rem]"
            />
            <Button
                type="button"
                label="B"
                tooltip="Gras"
                text
                className="font-bold"
                severity={editor.isActive("bold") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleBold().run()}
            />

            <Button
                type="button"
                label="I"
                tooltip="Italique"
                text
                className="italic"
                severity={editor.isActive("italic") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            />

            <Button
                type="button"
                icon="pi pi-list"
                tooltip="Liste à puces"
                text
                severity={editor.isActive("bulletList") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            />

            <Button
                type="button"
                icon="pi pi-list-check"
                tooltip="Liste numérotée"
                text
                severity={editor.isActive("orderedList") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />

            <Button
                type="button"
                icon="pi pi-code"
                tooltip="Bloc de code"
                text
                severity={editor.isActive("codeBlock") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            />

            <Button
                type="button"
                label="❝"
                tooltip="Citation"
                text
                severity={editor.isActive("blockquote") ? "contrast" : undefined}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
        </div>
    );

    const endContent = (
        <div className="flex gap-1">
            <Button
                type="button"
                icon="pi pi-undo"
                text
                onClick={() => editor.chain().focus().undo().run()}
            />

            <Button
                type="button"
                icon="pi pi-refresh"
                text
                onClick={() => editor.chain().focus().redo().run()}
            />
        </div>
    );

    return <Toolbar start={startContent} end={endContent} />;
}