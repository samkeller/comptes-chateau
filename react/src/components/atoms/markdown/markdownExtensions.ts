import { Extension, InputRule, type Extensions } from "@tiptap/core";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";

interface MarkdownExtensionsOptions {
    /** En lecture seule, autorise le clic sur les cases à cocher (le parent persiste le changement). */
    interactiveTasks?: boolean;
}

/**
 * Taper `- ` crée une liste à puces, puis `[ ] ` n'y créerait qu'un texte littéral.
 * Cette règle convertit alors la puce en tâche, comme dans la syntaxe GFM `- [ ] `.
 */
const BulletToTask = Extension.create({
    name: "bulletToTask",
    priority: 1000,

    addInputRules() {
        return [
            new InputRule({
                find: /^\[([ xX])?\]\s$/,
                handler: ({ state, range, match, chain }) => {
                    const { $from } = state.selection;
                    const inBulletItem = $from.depth >= 2
                        && $from.node($from.depth - 1).type.name === "listItem"
                        && $from.node($from.depth - 2).type.name === "bulletList";
                    if (!inBulletItem) return null;

                    chain()
                        .deleteRange(range)
                        .toggleTaskList()
                        .updateAttributes("taskItem", { checked: match[1]?.toLowerCase() === "x" })
                        .run();
                },
            }),
        ];
    },
});

/**
 * Extensions TipTap partagées par l'éditeur et l'affichage lecture seule,
 * pour garantir un rendu et une sérialisation markdown (GFM) identiques.
 */
export function createMarkdownExtensions({ interactiveTasks = false }: MarkdownExtensionsOptions = {}): Extensions {
    return [
        StarterKit,
        TaskList,
        TaskItem.configure({
            nested: true,
            // Accepte le changement natif de la case ; MarkdownRenderer retrouve l'item par son index.
            ...(interactiveTasks && { onReadOnlyChecked: () => true }),
        }),
        BulletToTask,
        Markdown,
    ];
}
