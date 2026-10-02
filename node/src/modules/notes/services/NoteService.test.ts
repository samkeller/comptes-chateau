import { beforeEach, describe, expect, it } from "vitest";
import type { CreateNoteRequest } from "@chocosous/shared";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { Note } from "../entities/Note";
import { NoteItem } from "../entities/NoteItem";
import NoteService from "./NoteService";

describe("NoteService", () => {
    let service: NoteService;

    beforeEach(() => {
        service = new NoteService(testDataSource.manager);
    });

    it("creates a checklist with ordered unchecked items", async () => {
        const input: CreateNoteRequest = {
            title: "Courses",
            type: "checklist",
            items: [{ label: "Pain" }, { label: "Lait", isChecked: true }],
        };

        const note = await service.create(input, TEST_USER_ID);

        expect(note).toMatchObject({
            title: "Courses",
            type: "checklist",
            content: null,
            items: [
                { label: "Pain", isChecked: false, sortOrder: 0 },
                { label: "Lait", isChecked: true, sortOrder: 1 },
            ],
        });
    });

    it("archives and restores a note with a consistent archivedAt value", async () => {
        const note = await service.create({ title: "Note", type: "text" }, TEST_USER_ID);

        const archived = await service.archive(note.id);
        expect(archived.isArchived).toBe(true);
        expect(archived.archivedAt).not.toBeNull();
        expect(await service.list(true)).toHaveLength(1);

        const restored = await service.unarchive(note.id);
        expect(restored).toMatchObject({ isArchived: false, archivedAt: null });
        expect(await service.list(false)).toHaveLength(1);
    });

    it("allows shared edits but only the author can permanently delete", async () => {
        const note = await service.create({ title: "Partagée", type: "text" }, TEST_USER_ID);
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

    it("appends items and updates checked state without replacing the note", async () => {
        const note = await service.create({ title: "Courses", type: "checklist" }, TEST_USER_ID);
        const item = await service.addItem(note.id, { label: "Pommes" });

        expect(item.sortOrder).toBe(0);
        await service.patchItem(note.id, item.id, { isChecked: true });

        await expect(testDataSource.getRepository(NoteItem).findOneByOrFail({ id: item.id }))
            .resolves.toMatchObject({ label: "Pommes", isChecked: true });
        await expect(service.getById(note.id)).resolves.toMatchObject({ title: "Courses", items: [{ isChecked: true }] });
    });
});
