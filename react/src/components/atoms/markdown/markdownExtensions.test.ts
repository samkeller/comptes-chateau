// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";
import { createMarkdownExtensions } from "./markdownExtensions";
import { setTaskItemChecked } from "./setTaskItemChecked";

const editors: Editor[] = [];

function createEditor(markdown: string, options: { editable?: boolean } = {}): Editor {
    const editor = new Editor({
        element: document.createElement("div"),
        extensions: createMarkdownExtensions({ interactiveTasks: options.editable === false }),
        content: markdown,
        contentType: "markdown",
        editable: options.editable ?? true,
    });
    editors.push(editor);
    return editor;
}
function getMarkdown(editor: Editor): string {
    return editor.getMarkdown().trimEnd();
}

function typeText(editor: Editor, text: string): void {
    for (const char of text) {
        const { from, to } = editor.state.selection;
        const handled = editor.view.someProp("handleTextInput", (handler) => handler(editor.view, from, to, char, () => editor.state.tr));
        if (!handled) editor.view.dispatch(editor.state.tr.insertText(char, from, to));
    }
}

afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy());
});

describe("markdown GFM <-> TipTap", () => {
    it("conserve les checklists à l'identique", () => {
        const markdown = "- [ ] Lait\n- [x] Pain";
        expect(getMarkdown(createEditor(markdown))).toBe(markdown);
    });

    it("distingue listes à puces, listes numérotées et checklists", () => {
        const editor = createEditor("- puce\n\n1. un\n\n- [x] tâche");
        const types = editor.getJSON().content?.map((node) => node.type);
        expect(types).toEqual(["bulletList", "orderedList", "taskList"]);
    });

    it("permet un texte libre avant et après une checklist", () => {
        const markdown = "Courses\n\n- [ ] Lait\n- [x] Pain\n\nÀ ne pas oublier";
        expect(getMarkdown(createEditor(markdown))).toBe(markdown);
    });

    it("rend les cases avec leur état coché", () => {
        const editor = createEditor("- [ ] Lait\n- [x] Pain");
        const checkboxes = Array.from(editor.view.dom.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
        expect(checkboxes.map((box) => box.checked)).toEqual([false, true]);
    });
});

describe("saisie manuelle des checklists", () => {
    it("transforme `[ ] ` en tâche", () => {
        const editor = createEditor("");
        typeText(editor, "[ ] Lait");
        expect(getMarkdown(editor)).toBe("- [ ] Lait");
    });

    it("transforme `- [ ] ` en tâche", () => {
        const editor = createEditor("");
        typeText(editor, "- [ ] Lait");
        expect(getMarkdown(editor)).toBe("- [ ] Lait");
    });

    it("transforme `- [x] ` en tâche cochée", () => {
        const editor = createEditor("");
        typeText(editor, "- [x] Lait");
        expect(getMarkdown(editor)).toBe("- [x] Lait");
    });

    it("transforme un paragraphe en checklist via la commande de la barre d'outils", () => {
        const editor = createEditor("Lait");
        editor.chain().focus().toggleTaskList().run();
        expect(getMarkdown(editor)).toBe("- [ ] Lait");
    });
});

describe("setTaskItemChecked", () => {
    it("coche et décoche la tâche ciblée sans toucher aux autres", () => {
        const editor = createEditor("- [ ] a\n- [ ] b\n- [x] c");

        expect(setTaskItemChecked(editor, 1, true)).toBe(true);
        expect(getMarkdown(editor)).toBe("- [ ] a\n- [x] b\n- [x] c");

        expect(setTaskItemChecked(editor, 2, false)).toBe(true);
        expect(getMarkdown(editor)).toBe("- [ ] a\n- [x] b\n- [ ] c");
    });

    it("compte les tâches de plusieurs checklists dans l'ordre du document", () => {
        const editor = createEditor("- [ ] a\n\ntexte\n\n- [ ] b");
        setTaskItemChecked(editor, 1, true);
        expect(getMarkdown(editor)).toBe("- [ ] a\n\ntexte\n\n- [x] b");
    });

    it("gère les sous-tâches", () => {
        const editor = createEditor("- [ ] parent\n  - [ ] enfant\n- [ ] suivant");
        setTaskItemChecked(editor, 1, true);
        expect(getMarkdown(editor)).toBe("- [ ] parent\n  - [x] enfant\n- [ ] suivant");
    });

    it("fonctionne sur un éditeur en lecture seule", () => {
        const editor = createEditor("- [ ] a", { editable: false });
        expect(setTaskItemChecked(editor, 0, true)).toBe(true);
        expect(getMarkdown(editor)).toBe("- [x] a");
    });

    it("retourne false si l'index n'existe pas", () => {
        const editor = createEditor("- [ ] a");
        expect(setTaskItemChecked(editor, 3, true)).toBe(false);
        expect(getMarkdown(editor)).toBe("- [ ] a");
    });
});

describe("tâches vides", () => {
    it("reste une tâche (et non du texte brut) après un aller-retour markdown", () => {
        const editor = createEditor("- [ ] Lait\n- [ ] \n- [ ] Pain");
        expect(editor.getJSON().content?.[0].type).toBe("taskList");
        expect(editor.getMarkdown()).toBe("- [ ] Lait\n- [ ] \n- [ ] Pain");
    });

    it("une nouvelle checklist vide est sérialisée en tâche valide", () => {
        const editor = createEditor("");
        editor.chain().focus().toggleTaskList().run();

        const reloaded = createEditor(editor.getMarkdown());
        expect(reloaded.getJSON().content?.[0].type).toBe("taskList");
    });
});