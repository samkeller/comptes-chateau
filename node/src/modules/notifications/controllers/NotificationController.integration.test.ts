import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "../../../tests/testApp";
import NotificationService from "../services/NotificationService";

describe("NotificationController integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: notificationRoutes } = await import("./NotificationController");
        app = createTestApp("/notifications", notificationRoutes);
    });

    it("lists the connected user's notifications, then hides one once dismissed", async () => {
        await new NotificationService().publish({
            type: "KANBAN_TASK_COMMENTED",
            severity: "info",
            title: "Nouveau commentaire",
            message: "Sur « Courses »",
            target: { kind: "kanban", taskId: 4 },
        });

        const listed = await request(app).get("/notifications");

        expect(listed.status).toBe(200);
        expect(listed.body).toEqual([expect.objectContaining({ type: "KANBAN_TASK_COMMENTED", target: { kind: "kanban", taskId: 4 } })]);

        const dismissed = await request(app).post("/notifications/dismiss").send({ key: listed.body[0].key });
        const listedAgain = await request(app).get("/notifications");

        expect(dismissed.status).toBe(204);
        expect(listedAgain.body).toEqual([]);
    });

    it("rejects a dismissal without key", async () => {
        const response = await request(app).post("/notifications/dismiss").send({ key: "  " });

        expect(response.status).toBe(400);
    });
});
