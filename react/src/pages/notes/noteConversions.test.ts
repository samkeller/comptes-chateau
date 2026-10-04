import { describe, expect, it } from "vitest";
import { checklistToMarkdown, markdownToChecklist } from "./noteConversions";

describe("noteConversions", () => {
    it("converts Markdown lines and existing task list state into checklist items", () => {
        expect(markdownToChecklist("# Courses\n\n- [x] Pain\n2. Lait\nÀ prendre")).toEqual([
            { label: "Courses", isChecked: false, sortOrder: 0 },
            { label: "Pain", isChecked: true, sortOrder: 1 },
            { label: "Lait", isChecked: false, sortOrder: 2 },
            { label: "À prendre", isChecked: false, sortOrder: 3 },
        ]);
    });

    it("converts checklist checked states to Markdown task list lines", () => {
        expect(checklistToMarkdown([
            { label: "Pain", isChecked: true },
            { label: "Lait", isChecked: false },
        ])).toBe("- [x] Pain\n- [ ] Lait");
    });
});
