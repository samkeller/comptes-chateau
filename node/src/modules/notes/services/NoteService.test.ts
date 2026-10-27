import { beforeEach, describe, expect, it } from "vitest";
import type { UpdateNoteRequest } from "@chocosous/shared";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { Note } from "../entities/Note";
import NoteService from "./NoteService";

describe("NoteService", () => {
    let service: NoteService;

    beforeEach(() => {
        service = new NoteService(testDataSource.manager);
    });

    it("creates a text note with content", async () => {
            const input: UpdateNoteRequest = {
                title: "Courses",
                content: "Acheter du pain",
            };

            const note = await service.create(input, TEST_USER_ID);

            expect(note).toMatchObject({
                title: "Courses",
                content: "Acheter du pain",
            });
        });

        it("creates a checklist note with markdown content", async () => {
            const input: UpdateNoteRequest = {
                title: "Courses",
                content: "- [ ] Pain\n- [x] Lait",
            };

            const note = await service.create(input, TEST_USER_ID);

            expect(note).toMatchObject({
                title: "Courses",
                content: "- [ ] Pain\n- [x] Lait",
            });
        });

        it("creates a note with only a title", async () => {
            const note = await service.create({ title: "Rappel" }, TEST_USER_ID);
            expect(note).toMatchObject({ title: "Rappel", content: null });
        });

        it("archives and restores a note with a consistent archivedAt value", async () => {
            const note = await service.create({ title: "Note" }, TEST_USER_ID);

            const archived = await service.archive(note.id);
            expect(archived.isArchived).toBe(true);
            expect(archived.archivedAt).not.toBeNull();
            expect(await service.list(true)).toHaveLength(1);

            const restored = await service.unarchive(note.id);
            expect(restored).toMatchObject({ isArchived: false, archivedAt: null });
            expect(await service.list(false)).toHaveLength(1);
        });

        it("allows shared edits but only the author can permanently delete", async () => {
            const note = await service.create({ title: "Partagée" }, TEST_USER_ID);
            const otherUser = await testDataSource.getRepository(User).save({
                username: "second-user",
                avatar: "default-avatar.png",
                passwordHash: "testpasswordhash",
                totalXp: 0,
            });

            await expect(service.update(note.id, { title: "Modifiée" })).resolves.toMatchObject({ title: "Modifiée" });
            await expect(service.delete(note.id, otherUser.id)).rejects.toMatchObject({
                statusCode: 403,
                code: "NOTE_FORBIDDEN",
            });
            await expect(testDataSource.getRepository(Note).findOneBy({ id: note.id })).resolves.not.toBeNull();

            await service.delete(note.id, TEST_USER_ID);
            await expect(testDataSource.getRepository(Note).findOneBy({ id: note.id })).resolves.toBeNull();
        });

        it("updates note content", async () => {
            const note = await service.create({
                title: "Courses",
                content: "Pain\nLait",
            }, TEST_USER_ID);

            const updated = await service.update(note.id, {
                title: note.title,
                content: "- [ ] Pain\n- [ ] Lait",
            });

            expect(updated).toMatchObject({
                content: "- [ ] Pain\n- [ ] Lait",
            });
        });
});
