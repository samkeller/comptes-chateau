import type { CreateNoteRequest, NoteDto, UpdateNoteRequest } from "@chocosous/shared";
import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { badRequest, forbidden, notFound } from "../../../utils/AppError";
import { Note } from "../entities/Note";
import { NoteItem } from "../entities/NoteItem";
import { toNoteDto } from "../mappers/NoteMapper";
import NoteItemService from "./NoteItemService";

export default class NoteService {
    private readonly noteRepo: Repository<Note>;
    private readonly noteItemService: NoteItemService;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.noteRepo = manager.getRepository(Note);
        this.noteItemService = new NoteItemService(this, manager);
    }

    /**
     * Récupère les notes du filtre demandé, épinglées en premier puis triées par dernière modification.
     */
    async list(archived: boolean): Promise<NoteDto[]> {
        const notes = await this.noteRepo.find({
            where: { isArchived: archived },
            order: { isPinned: "DESC", updatedAt: "DESC" },
        });
        const items = await this.noteItemService.getForNotes(notes.map((note) => note.id));
        const itemsByNote = new Map<number, NoteItem[]>();

        for (const item of items) {
            const noteItems = itemsByNote.get(item.noteId) ?? [];
            noteItems.push(item);
            itemsByNote.set(item.noteId, noteItems);
        }

        return notes.map((note) => toNoteDto(note, itemsByNote.get(note.id)));
    }

    async getById(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        return toNoteDto(note, await this.noteItemService.getForNote(id));
    }

    async create(body: CreateNoteRequest, authorId: number): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const noteRepo = manager.getRepository(Note);
            const note = await noteRepo.save(noteRepo.create({
                title: body.title,
                type: body.type,
                content: body.type === "text" ? body.content ?? null : null,
                isPinned: body.isPinned ?? false,
                isArchived: false,
                archivedAt: null,
                authorId,
            }));
            const items = body.type === "checklist" && body.items?.length
                ? await this.noteItemService.createForNote(note, body.items, manager)
                : [];

            return toNoteDto(note, items);
        });
    }

    /**
     * Met à jour les champs de la note et remplace les items seulement si `items` est fourni.
     */
    async update(id: number, body: UpdateNoteRequest): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const note = await this.findNoteOrThrow(id, manager);
            const targetType = body.type ?? note.type;

            if (body.items !== undefined && targetType !== "checklist") {
                throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
            }
            if (body.content !== undefined && targetType === "checklist" && body.content !== null) {
                throw badRequest("NOTE_CONTENT_REQUIRE_TEXT", "Une checklist ne peut pas contenir de texte Markdown");
            }

            if (targetType !== note.type && targetType === "checklist" && body.items === undefined) {
                throw badRequest("NOTE_CONVERSION_ITEMS_REQUIRED", "La conversion en checklist doit fournir ses items");
            }
            if (targetType !== note.type && targetType === "text" && body.content === undefined) {
                throw badRequest("NOTE_CONVERSION_CONTENT_REQUIRED", "La conversion en note texte doit fournir son contenu");
            }

            if (note.type === "checklist" && targetType === "text") {
                await this.noteItemService.replaceForNote(note, [], manager);
            }

            await manager.getRepository(Note).update(id, {
                title: body.title,
                ...(targetType !== note.type ? { type: targetType } : {}),
                ...(targetType === "checklist" ? { content: null } : {}),
                ...(body.content !== undefined && targetType === "text" ? { content: body.content } : {}),
                ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
            });
            note.type = targetType;

            if (body.items !== undefined) {
                await this.noteItemService.replaceForNote(note, body.items, manager);
            }

            const updatedNote = await this.findNoteOrThrow(id, manager);
            return toNoteDto(updatedNote, await this.noteItemService.getForNote(id, manager));
        });
    }

    async archive(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        if (!note.isArchived) {
            await this.noteRepo.update(id, { isArchived: true, archivedAt: new Date() });
        }
        return this.getById(id);
    }

    async unarchive(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        if (note.isArchived) {
            await this.noteRepo.update(id, { isArchived: false, archivedAt: null });
        }
        return this.getById(id);
    }

    /**
     * Supprime définitivement une note uniquement à la demande de son auteur.
     */
    async delete(id: number, requestingUserId: number): Promise<void> {
        const note = await this.findNoteOrThrow(id);
        if (note.authorId !== requestingUserId) {
            throw forbidden("NOTE_FORBIDDEN", "Seul l’auteur peut supprimer définitivement cette note");
        }
        await this.noteRepo.delete({ id });
    }

    /**
     * Fournit au service des items une note existante de type checklist, sans lui ouvrir l'accès au dépôt Note.
     */
    async getChecklistOrThrow(id: number, manager: EntityManager = this.manager): Promise<Note> {
        const note = await this.findNoteOrThrow(id, manager);
        if (note.type !== "checklist") {
            throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
        }
        return note;
    }

    /**
     * Met à jour le timestamp de la note après une modification portée par un item.
     */
    async touchUpdatedAt(note: Note, manager: EntityManager = this.manager): Promise<void> {
        await manager.getRepository(Note).update(note.id, { updatedAt: new Date() });
    }

    private async findNoteOrThrow(id: number, manager: EntityManager = this.manager): Promise<Note> {
        const note = await manager.getRepository(Note).findOneBy({ id });
        if (!note) throw notFound("NOTE_NOT_FOUND", "Note introuvable");
        return note;
    }
}
