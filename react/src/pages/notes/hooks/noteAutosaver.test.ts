import type { UpdateNoteRequest, NoteDto } from "@chocosous/shared";
import { describe, expect, it, vi } from "vitest";
import { NoteAutosaver, toNoteBody } from "./noteAutosaver";

function buildNote(overrides: Partial<NoteDto> = {}): NoteDto {
    return {
        id: 1,
        title: "Titre",
        content: "Contenu",
        isPinned: false,
        isArchived: false,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        authorId: 1,
        ...overrides,
    };
}

function buildService() {
    return {
        create: vi.fn((body: UpdateNoteRequest) => Promise.resolve(buildNote({ id: 10, title: body.title, content: body.content ?? null }))),
        update: vi.fn((id: number, body: UpdateNoteRequest) => Promise.resolve(buildNote({ id, title: body.title, content: body.content ?? null }))),
    };
}

describe("toNoteBody", () => {
    it("accepte un titre seul", () => {
        expect(toNoteBody({ title: " Courses ", content: "" })).toEqual({ title: "Courses", content: null });
    });

    it("accepte un contenu seul, sans titre", () => {
        expect(toNoteBody({ title: "", content: "- [ ] Lait" })).toEqual({ title: "", content: "- [ ] Lait" });
    });

    it("refuse une note sans titre ni contenu", () => {
        expect(toNoteBody({ title: "  ", content: " \n " })).toBeNull();
    });
});

describe("NoteAutosaver", () => {
    it("ne crée rien tant que le brouillon est vide", async () => {
        const service = buildService();
        const autosaver = new NoteAutosaver(null, service);

        await expect(autosaver.save({ title: "", content: "" })).resolves.toBeNull();
        expect(service.create).not.toHaveBeenCalled();
    });

    it("crée la note au premier contenu puis la met à jour avec son id", async () => {
        const service = buildService();
        const autosaver = new NoteAutosaver(null, service);

        await autosaver.save({ title: "", content: "- [ ] Lait" });
        await autosaver.save({ title: "", content: "- [x] Lait" });

        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(10, { title: "", content: "- [x] Lait" });
    });

    it("n'appelle pas l'API si rien n'a changé", async () => {
        const service = buildService();
        const autosaver = new NoteAutosaver(buildNote(), service);

        await expect(autosaver.save({ title: "Titre", content: "Contenu" })).resolves.toBeNull();
        expect(service.update).not.toHaveBeenCalled();
    });

    it("sérialise les enregistrements concurrents sans créer de doublon", async () => {
        const service = buildService();
        const autosaver = new NoteAutosaver(null, service);

        await Promise.all([
            autosaver.save({ title: "a", content: "" }),
            autosaver.save({ title: "ab", content: "" }),
        ]);

        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(10, { title: "ab", content: null });
    });

    it("peut réessayer après un échec", async () => {
        const service = buildService();
        service.create.mockRejectedValueOnce(new Error("réseau"));
        const autosaver = new NoteAutosaver(null, service);

        await expect(autosaver.save({ title: "a", content: "" })).rejects.toThrow("réseau");
        await expect(autosaver.save({ title: "a", content: "" })).resolves.toMatchObject({ id: 10 });
    });

    it("n'enregistre plus rien une fois fermé", async () => {
        const service = buildService();
        const autosaver = new NoteAutosaver(buildNote(), service);
        autosaver.close();

        await expect(autosaver.save({ title: "Autre", content: "" })).resolves.toBeNull();
        expect(service.update).not.toHaveBeenCalled();
    });
});
