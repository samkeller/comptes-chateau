import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "../../../tests/testApp";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { Note } from "../entities/Note";

describe("NoteController integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: noteRoutes } = await import("../routes/NoteRoutes");
        app = createTestApp("/notes", noteRoutes);
    });

    it("creates a checklist, toggles an item, and lists it", async () => {
        const createResponse = await request(app)
            .post("/notes")
            .send({ title: "Courses", type: "checklist", items: [{ label: "Pain" }] });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toMatchObject({
            title: "Courses",
            type: "checklist",
            items: [{ label: "Pain", isChecked: false, sortOrder: 0 }],
        });

        const itemId = createResponse.body.items[0].id as number;
        const toggleResponse = await request(app)
            .patch(`/notes/${createResponse.body.id}/items/${itemId}`)
            .send({ isChecked: true });
        const listResponse = await request(app).get("/notes");

        expect(toggleResponse.status).toBe(200);
        expect(toggleResponse.body.isChecked).toBe(true);
        expect(listResponse.body[0].items[0].isChecked).toBe(true);
    });

    it("rejects invalid data and prevents non-authors from deleting", async () => {
        const invalidResponse = await request(app)
            .post("/notes")
            .send({ title: "", type: "text" });
        expect(invalidResponse.status).toBe(400);

        const note = await testDataSource.getRepository(Note).save({
            title: "Autre auteur",
            type: "text",
            content: null,
            isPinned: false,
            isArchived: false,
            archivedAt: null,
            authorId: TEST_USER_ID,
        });
        const otherUser = await testDataSource.getRepository(User).save({
            username: "second-user",
            avatar: "default-avatar.png",
            passwordHash: "testpasswordhash",
            totalXp: 0,
        });
        const otherUserApp = createTestApp("/notes", (await import("../routes/NoteRoutes")).default, otherUser.id);

        const deleteResponse = await request(otherUserApp).delete(`/notes/${note.id}`);

        expect(deleteResponse.status).toBe(403);
        await expect(testDataSource.getRepository(Note).findOneBy({ id: note.id })).resolves.not.toBeNull();
    });

    it("moves notes between the active and archived lists", async () => {
        const createResponse = await request(app)
            .post("/notes")
            .send({ title: "À classer", type: "text", content: "Contenu" });
        const noteId = createResponse.body.id as number;

        const archiveResponse = await request(app).patch(`/notes/${noteId}/archive`);
        const activeList = await request(app).get("/notes");
        const archivedList = await request(app).get("/notes?archived=true");

        expect(archiveResponse.status).toBe(200);
        expect(archiveResponse.body.isArchived).toBe(true);
        expect(activeList.body).toHaveLength(0);
        expect(archivedList.body).toHaveLength(1);

        const restoreResponse = await request(app).patch(`/notes/${noteId}/unarchive`);
        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body).toMatchObject({ isArchived: false, archivedAt: null });
    });
});
