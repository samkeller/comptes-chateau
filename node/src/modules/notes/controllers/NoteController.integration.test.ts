import request from "supertest";
import { Router } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "../../../tests/testApp";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { Note } from "../entities/Note";

describe("NoteController integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: noteRoutes } = await import("./NoteController");
        const routes = Router();
        routes.use("/notes", noteRoutes);
        app = createTestApp("/", routes);
    });

    it("creates a checklist note and lists it", async () => {
            const createResponse = await request(app)
                .post("/notes")
                .send({ title: "Courses", content: "- [ ] Pain" });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body).toMatchObject({
                title: "Courses",
                content: "- [ ] Pain",
            });

            const listResponse = await request(app).get("/notes");
            expect(listResponse.body[0]).toMatchObject({
                title: "Courses",
            });
        });

        it("rejects invalid data and prevents non-authors from deleting", async () => {
            const invalidResponse = await request(app)
                .post("/notes")
                .send({ title: "" });
            expect(invalidResponse.status).toBe(400);

            const note = await testDataSource.getRepository(Note).save({
                title: "Autre auteur",
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
            const { default: noteRoutes } = await import("./NoteController");
            const otherUserRoutes = Router();
            otherUserRoutes.use("/notes", noteRoutes);
            const otherUserApp = createTestApp("/", otherUserRoutes, otherUser.id);

            const deleteResponse = await request(otherUserApp).delete(`/notes/${note.id}`);

            expect(deleteResponse.status).toBe(403);
            await expect(testDataSource.getRepository(Note).findOneBy({ id: note.id })).resolves.not.toBeNull();
        });

        it("accepts a note without title when it has content, and rejects emptying both", async () => {
            const createResponse = await request(app)
                .post("/notes")
                .send({ title: "", content: "- [ ] Lait" });
            expect(createResponse.status).toBe(201);
            expect(createResponse.body).toMatchObject({ title: "", content: "- [ ] Lait" });

            const checkedResponse = await request(app)
                .put(`/notes/${createResponse.body.id}`)
                .send({ title: "", content: "- [x] Lait" });
            expect(checkedResponse.status).toBe(200);
            expect(checkedResponse.body.content).toBe("- [x] Lait");

            const emptiedResponse = await request(app)
                .put(`/notes/${createResponse.body.id}`)
                .send({ title: " ", content: "  " });
            expect(emptiedResponse.status).toBe(400);
        });

        it("moves notes between the active and archived lists", async () => {
            const createResponse = await request(app)
                .post("/notes")
                .send({ title: "À classer", content: "Contenu" });
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
