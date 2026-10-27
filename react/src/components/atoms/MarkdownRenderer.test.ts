// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

async function render(markdown: string, onChange?: (markdown: string) => void): Promise<void> {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root.render(createElement(MarkdownRenderer, { onChange, children: markdown }));
    });
}

/** Dernier markdown notifié, sans le saut de ligne final que TipTap ajoute après une liste. */
function lastMarkdown(onChange: ReturnType<typeof vi.fn>): string {
    return (onChange.mock.lastCall?.[0] as string).trimEnd();
}

function checkboxes(): HTMLInputElement[] {
    return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
}

describe("MarkdownRenderer", () => {
    it("affiche les titres, listes et checklists", async () => {
        await render("# Titre\n\n- puce\n\n- [ ] Lait\n- [x] Pain");

        expect(container.querySelector("h1")?.textContent).toBe("Titre");
        expect(container.querySelectorAll("ul[data-type='taskList'] > li")).toHaveLength(2);
        expect(checkboxes().map((box) => box.checked)).toEqual([false, true]);
    });

    it("affiche une tâche vide comme une case à cocher", async () => {
        await render("- [ ] Lait\n- [ ] ");

        expect(container.textContent).not.toContain("[ ]");
        expect(checkboxes()).toHaveLength(2);
    });

    it("n'est pas éditable", async () => {
        await render("Bonjour");
        expect(container.querySelector("[contenteditable='true']")).toBeNull();
    });

    it("notifie le markdown mis à jour quand on coche une case", async () => {
        const onChange = vi.fn();
        await render("Courses\n\n- [ ] Lait\n- [ ] Pain", onChange);

        await act(async () => {
            checkboxes()[1].click();
        });

        expect(lastMarkdown(onChange)).toBe("Courses\n\n- [ ] Lait\n- [x] Pain");
        expect(checkboxes().map((box) => box.checked)).toEqual([false, true]);
    });

    it("permet de cocher puis décocher la même case", async () => {
        const onChange = vi.fn();
        await render("- [ ] Lait", onChange);

        await act(async () => checkboxes()[0].click());
        await act(async () => checkboxes()[0].click());

        expect(onChange.mock.calls.map(([markdown]) => (markdown as string).trimEnd())).toEqual(["- [x] Lait", "- [ ] Lait"]);
    });

    it("ne remonte pas le clic sur une case au parent", async () => {
        const onParentClick = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => {
            root.render(createElement("article", { onClick: onParentClick },
                createElement(MarkdownRenderer, { onChange: vi.fn(), children: "- [ ] Lait" })));
        });

        await act(async () => checkboxes()[0].click());

        expect(onParentClick).not.toHaveBeenCalled();
    });

    it("laisse les cases figées sans callback", async () => {
        await render("- [ ] Lait");

        await act(async () => checkboxes()[0].click());

        expect(checkboxes()[0].checked).toBe(false);
    });

    it("se met à jour quand le contenu change", async () => {
        await render("- [ ] Lait");

        await act(async () => {
            root.render(createElement(MarkdownRenderer, { children: "- [x] Lait" }));
        });

        expect(checkboxes()[0].checked).toBe(true);
    });
});
