import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanTask } from "../entities/KanbanTask";
import { User } from "../../core/entities/User";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";

describe("KanbanController integration", () => {
    let app: ReturnType<typeof createTestApp>;
    let taskId: number;

    beforeAll(async () => {
        const { default: kanbanRoutes } = await import("../routes/KanbanRoutes");
        app = createTestApp("/kanban", kanbanRoutes);
    });

    async function createTask(): Promise<void> {
        const column = await testDataSource.getRepository(KanbanColumn).save({
            label: "À faire",
            order: 1,
        });
        const task = await testDataSource.getRepository(KanbanTask).save({
            title: "Courses",
            description: "Lait",
            tags: [],
            priority: "normal",
            columnId: column.id,
            column,
            assignees: [],
            isDone: false,
            doneByUserId: null,
        });
        taskId = task.id;
    }

    it("partially updates a task and returns HTTP 200", async () => {
        await createTask();

        const response = await request(app)
            .patch(`/kanban/task/${taskId}`)
            .send({ title: "Courses du week-end" });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: taskId,
            title: "Courses du week-end",
            description: "Lait",
        });
    });

    it("returns a not-found error when updating a task to a missing column", async () => {
        await createTask();

        const response = await request(app)
            .patch(`/kanban/task/${taskId}`)
            .send({ columnId: 999 });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe("KANBAN_COLUMN_NOT_FOUND");
    });

    it("awards completion XP only once when the done endpoint is called repeatedly", async () => {
        await createTask();

        const firstResponse = await request(app).patch(`/kanban/task/mark-done/${taskId}`);
        const secondResponse = await request(app).patch(`/kanban/task/mark-done/${taskId}`);
        const user = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        const task = await testDataSource.getRepository(KanbanTask).findOneByOrFail({ id: taskId });

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);
        expect(user.totalXp).toBe(140);
        expect(task).toMatchObject({ isDone: true, doneByUserId: TEST_USER_ID });
    });
});
