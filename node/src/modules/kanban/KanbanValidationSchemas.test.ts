import { describe, expect, it } from "vitest";
import {
    CreateKanbanTaskSchema,
    CreateKanbanCommentSchema,
    UpdateKanbanTaskSchema,
} from "@chocosous/shared";

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

    it("accepts partial task updates while rejecting an empty update", () => {
        expect(UpdateKanbanTaskSchema.safeParse({ title: "  Ma tâche  " })).toMatchObject({
            success: true,
            data: { title: "Ma tâche" },
        });
        expect(UpdateKanbanTaskSchema.safeParse({})).toMatchObject({ success: false });
    });

    it("rejects task titles longer than the database column", () => {
        expect(CreateKanbanTaskSchema.safeParse({
            title: "a".repeat(256),
            columnId: 1,
        }).success).toBe(false);
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
