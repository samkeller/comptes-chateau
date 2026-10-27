import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useMemo } from 'react';
import { createMarkdownExtensions } from '@/components/atoms/markdown/markdownExtensions';
import MarkdownToolbar from "./MarkdownToolbar";

interface MarkdownEditorProps {
    value: string,
    onChange: (value: string) => void,
}

/**
 * Éditeur WYSIWYG dont la valeur est du markdown GFM (listes, checklists `- [ ]`, titres...).
 */
export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const extensions = useMemo(() => createMarkdownExtensions(), []);

    const editor = useEditor({
        extensions,
        content: value,
        contentType: "markdown",
        onUpdate: ({ editor }) => {
            onChange(editor.getMarkdown());
        },
    });

    useEffect(() => {
        if (!editor || editor.getMarkdown() === value) {
            return;
        }

        editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }, [editor, value]);

    return (
        <div className="flex flex-col gap-2">
            <div className="sticky top-0 z-20 bg-card pb-2">
                <MarkdownToolbar editor={editor} />
            </div>
                <EditorContent
                    editor={editor}
                    className="markdown-editor-surface rounded-border bg-gray-900 p-4 min-h-[12rem] focus-within:ring-2 focus-within:ring-teal-400/30 focus-within:border-teal-400 transition-all cursor-text"
                    style={{ border: "1px solid #424b57" }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) editor?.commands.focus("end");
                    }}
                />
        </div>
    );
}
