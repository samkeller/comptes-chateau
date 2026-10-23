import type { Editor } from "@tiptap/core";

/**
 * Coche ou décoche la n-ième tâche (ordre du document, sous-tâches incluses).
 * Retourne `false` si l'index ne correspond à aucune tâche.
 */
export function setTaskItemChecked(editor: Editor, index: number, checked: boolean): boolean {
    const { state, view } = editor;
    let currentIndex = 0;
    let position: number | null = null;
    let attrs: Record<string, unknown> = {};

    state.doc.descendants((node, pos) => {
        if (position !== null) return false;
        if (node.type.name !== "taskItem") return true;
        if (currentIndex === index) {
            position = pos;
            attrs = { ...node.attrs, checked };
            return false;
        }
        currentIndex++;
        return true;
    });

    if (position === null) return false;

    view.dispatch(state.tr.setNodeMarkup(position, undefined, attrs));
    return true;
}
