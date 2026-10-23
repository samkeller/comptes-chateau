import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { createMarkdownExtensions } from "./markdown/markdownExtensions";
import { setTaskItemChecked } from "./markdown/setTaskItemChecked";

interface MarkdownRendererProps {
    children: string | null | undefined;
    /**
     * Si fourni, les cases à cocher sont interactives : appelé avec le markdown mis à jour.
     * Sans ce callback, le rendu est strictement en lecture seule.
     */
    onChange?: (markdown: string) => void;
    className?: string;
}

/**
 * Rendu markdown en lecture seule, basé sur le même moteur (TipTap) que l'éditeur
 * pour garantir un affichage identique.
 */
export function MarkdownRenderer({ children, onChange, className = "" }: MarkdownRendererProps) {
    const markdown = children ?? "";
    const interactive = onChange !== undefined;
    const containerRef = useRef<HTMLDivElement>(null);
    const extensions = useMemo(() => createMarkdownExtensions({ interactiveTasks: interactive }), [interactive]);

    const editor = useEditor({
        extensions,
        content: markdown,
        contentType: "markdown",
        editable: false,
    }, [extensions]);

    useEffect(() => {
        if (!editor || editor.getMarkdown() === markdown) return;
        editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
    }, [editor, markdown]);

    // Les cases sont créées par TipTap hors de React : React ne propage pas leur onChange, on écoute donc le DOM.
    useEffect(() => {
        const container = containerRef.current;
        if (!editor || !onChange || !container) return;

        function handleCheckboxChange(event: Event): void {
            const target = event.target;
            if (!editor || !onChange || !container) return;
            if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

            const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
            if (!setTaskItemChecked(editor, checkboxes.indexOf(target), target.checked)) return;

            onChange(editor.getMarkdown());
        }

        container.addEventListener("change", handleCheckboxChange);
        return () => container.removeEventListener("change", handleCheckboxChange);
    }, [editor, onChange]);

    // Un clic sur une case ne doit pas déclencher l'action du parent (ex. ouverture d'une carte).
    function handleClick(event: MouseEvent<HTMLElement>): void {
        if (interactive && event.target instanceof Element && event.target.closest("label")) {
            event.stopPropagation();
        }
    }

    return (
        <div
            ref={containerRef}
            className={`markdown-viewer ${className}`}
            data-interactive={interactive}
            onClick={handleClick}
        >
            <EditorContent editor={editor} />
        </div>
    );
}
