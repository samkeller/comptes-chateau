import { describe, expect, it } from "vitest";
import { CreateKanbanTaskSchema } from "./CreateKanbanTaskDto";
import { CreateKanbanCommentSchema } from "./CreateKanbanCommentDto";

describe("Kanban validation schemas", () => {
    it("rejects task title with only spaces", () => {
        const parsed = CreateKanbanTaskSchema.safeParse({
            title: "   ",
            columnId: 1,
        });

        expect(parsed.success).toBe(false);
    });

    it("trims valid task title", () => {
        const parsed = CreateKanbanTaskSchema.safeParse({
            title: "  Ma tache  ",
            columnId: 1,
        });

        expect(parsed.success).toBe(true);
        if (!parsed.success) {
            return;
        }

        expect(parsed.data.title).toBe("Ma tache");
    });

    it("rejects comment content with only spaces", () => {
        const parsed = CreateKanbanCommentSchema.safeParse({
            content: "    ",
        });

        expect(parsed.success).toBe(false);
    });

    it("trims valid comment content", () => {
        const parsed = CreateKanbanCommentSchema.safeParse({
            content: "  Hello  ",
        });

        expect(parsed.success).toBe(true);
        if (!parsed.success) {
            return;
        }

        expect(parsed.data.content).toBe("Hello");
    });
});
