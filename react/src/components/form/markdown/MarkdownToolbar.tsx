import { Editor } from "@tiptap/react";
import { Toolbar } from "primereact/toolbar";
import { Button, ButtonProps } from "primereact/button";
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

    const btnProps: (isActive: boolean) => ButtonProps = (isActive) => ({
        size: "small",
        type: "button",
        text: true,
        severity: isActive ? "contrast" : undefined,
        className: btnClassnames,
    });

    const btnClassnames = "p-2 w-8 h-8 text-sm"

    const startContent = (
        <div className="flex flex-wrap justify-end gap-1 items-center">
            <Dropdown
                value={getActiveHeadingLevel(editor)}
                options={HEADING_OPTIONS}
                onChange={e => onHeadingChange(e.value as number)}
                className={`w-[9rem] p-2 h-8`}
                pt={{ 
                    input: { className: "p-0 text-[11px]" },
                 }}
            />
            <Button
                {...btnProps(editor.isActive("bold"))}
                label="B"
                tooltip="Gras"
                className={`font-bold ${btnClassnames}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <Button
                {...btnProps(editor.isActive("italic"))}
                label="I"
                tooltip="Italique"
                className={`italic ${btnClassnames}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <Button
                {...btnProps(editor.isActive("strike"))}
                label="S"
                tooltip="Barré"
                className={`line-through ${btnClassnames}`}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <Button
                {...btnProps(editor.isActive("bulletList"))}
                icon="pi pi-list"
                tooltip="Liste à puces"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            />

            <Button
                {...btnProps(editor.isActive("orderedList"))}
                icon="pi pi-list-check"
                tooltip="Liste numérotée"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />

            <Button
                {...btnProps(editor.isActive("codeBlock"))}
                icon="pi pi-code"
                tooltip="Bloc de code"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            />

            <Button
                {...btnProps(editor.isActive("code"))}
                icon="pi pi-code"
                tooltip="Code inline"
                onClick={() => editor.chain().focus().toggleCode().run()}
            />

            <Button
                {...btnProps(editor.isActive("blockquote"))}
                label="❝"
                tooltip="Citation"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />

            <Button
                {...btnProps(editor.isActive("horizontalRule"))}
                label="—"
                tooltip="Séparateur"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />

        </div>
    );

    const endContent = (
        <div className="flex gap-1">
            <Button
                type="button"
                icon="pi pi-undo"
                text
                disabled={!editor.can().chain().focus().undo().run()}
                tooltip="Annuler"
                className={btnClassnames}
                onClick={() => editor.chain().focus().undo().run()}
            />

            <Button
                type="button"
                icon="pi pi-refresh"
                text
                disabled={!editor.can().chain().focus().redo().run()}
                tooltip="Rétablir"
                className={btnClassnames}
                onClick={() => editor.chain().focus().redo().run()}
            />
        </div>
    );

    return <Toolbar
        className="p-0 border-none"
        start={startContent}
        end={endContent}
    />;
}