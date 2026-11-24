import { describe, expect, it } from "vitest";
import { kanbanTaskLink, parseKanbanTaskLink } from "./kanbanTaskLink";

describe("kanbanTaskLink", () => {
    it("builds a link that opens a task, optionally on its comments", () => {
        expect(kanbanTaskLink(12)).toBe("/kanban?taskId=12");
        expect(kanbanTaskLink(12, "comments")).toBe("/kanban?taskId=12&tab=comments");
    });

    it("reads back the task and tab from the query string", () => {
        expect(parseKanbanTaskLink(new URLSearchParams("taskId=12&tab=comments"))).toEqual({ taskId: 12, tab: "comments" });
        expect(parseKanbanTaskLink(new URLSearchParams("taskId=12"))).toEqual({ taskId: 12, tab: "task" });
    });

    it("ignores a missing or invalid task id", () => {
        expect(parseKanbanTaskLink(new URLSearchParams(""))).toBeNull();
        expect(parseKanbanTaskLink(new URLSearchParams("taskId=abc"))).toBeNull();
        expect(parseKanbanTaskLink(new URLSearchParams("taskId=-3"))).toBeNull();
    });
});
