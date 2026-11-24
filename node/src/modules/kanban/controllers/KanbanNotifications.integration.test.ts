import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import NotificationService from "../../notifications/services/NotificationService";
import { TEST_USER_ID, testDataSource, fixtures } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";

/** Notifications de l'utilisateur, sans les providers d'état (comptes, stocks, jobs). */
async function eventsOf(userId: number) {
    return new NotificationService(testDataSource.manager, []).getForUser(userId);
}

describe("Kanban notifications", () => {
    let app: ReturnType<typeof createTestApp>;
    let columnId: number;
    let otherUserId: number;

    beforeAll(async () => {
        const { default: kanbanRoutes } = await import("../routes/KanbanRoutes");
        app = createTestApp("/kanban", kanbanRoutes);
    });

    beforeEach(async () => {
        columnId = (await fixtures.kanbanColumns.create({ label: "À faire" })).id;
        otherUserId = (await fixtures.users.create({ username: "gaelle" })).id;
    });

    it("notifies a user assigned to a new task, but not the creator assigning themselves", async () => {
        const created = await request(app)
            .post("/kanban/task")
            .send({ title: "Courses", columnId, assigneeIds: [TEST_USER_ID, otherUserId] });

        expect(await eventsOf(otherUserId)).toEqual([expect.objectContaining({
            type: "KANBAN_TASK_ASSIGNED",
            severity: "info",
            message: expect.stringContaining("Courses"),
            target: { kind: "kanban", taskId: created.body.id },
        })]);
        expect(await eventsOf(TEST_USER_ID)).toEqual([]);
    });

    it("notifies only newly added assignees when a task is updated", async () => {
        const created = await request(app).post("/kanban/task").send({ title: "Courses", columnId, assigneeIds: [] });

        await request(app).patch(`/kanban/task/${created.body.id}`).send({ assigneeIds: [otherUserId] });
        await request(app).patch(`/kanban/task/${created.body.id}`).send({ title: "Courses du samedi", assigneeIds: [otherUserId] });

        expect(await eventsOf(otherUserId)).toEqual([expect.objectContaining({ type: "KANBAN_TASK_ASSIGNED" })]);
    });

    it("notifies every other user when a task is commented", async () => {
        const created = await request(app).post("/kanban/task").send({ title: "Courses", columnId });

        await request(app).post(`/kanban/task/${created.body.id}/comments`).send({ content: "Pense au lait" });

        expect(await eventsOf(otherUserId)).toEqual([expect.objectContaining({
            type: "KANBAN_TASK_COMMENTED",
            message: expect.stringContaining("Pense au lait"),
            target: { kind: "kanban", taskId: created.body.id, tab: "comments" },
        })]);
        expect(await eventsOf(TEST_USER_ID)).toEqual([]);
    });
});
