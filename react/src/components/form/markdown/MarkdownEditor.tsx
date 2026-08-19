import { Editor } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import MarkdownToolbar from "./MarkdownToolbar";
import { useEffect } from 'react';

interface MarkdownEditorProps {
    value: string,
    onChange: (value: string) => void,
}

type MarkdownStorage = {
    manager?: {
        serialize: (doc: object) => string,
    },
}

function getEditorMarkdown(editor: Editor): string {
    const editorWithMarkdown = editor as Editor & { getMarkdown?: () => string };
    if (typeof editorWithMarkdown.getMarkdown === "function") {
        return editorWithMarkdown.getMarkdown();
    }

    const markdownStorage = editor.storage.markdown as MarkdownStorage | undefined;
    if (markdownStorage?.manager) {
        return markdownStorage.manager.serialize(editor.getJSON());
    }

    return editor.getText();
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit, Markdown],
        content: value,
        contentType: "markdown",
        onUpdate: ({ editor }) => {
            onChange(getEditorMarkdown(editor));
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentValue = getEditorMarkdown(editor);
        if (currentValue === value) {
            return;
        }

        editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
    }, [editor, value]);

    return (
        <div className="flex flex-col gap-2">
           <MarkdownToolbar editor={editor} />
            <EditorContent
                editor={editor}
                className="markdown-editor-surface rounded-border bg-gray-900 p-4 min-h-[12rem] focus-within:ring-2 focus-within:ring-teal-400/30 focus-within:border-teal-400 transition-all cursor-text"
                style={{ border: "1px solid #424b57" }}
                onClick={() => editor?.chain().focus().run()}
            />
        </div>
    );
}
