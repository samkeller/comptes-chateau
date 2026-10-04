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

    /** Récupère une note et ses items dans l'ordre défini par la checklist. */
    async getById(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        return toNoteDto(note, await this.noteItemService.getForNote(id));
    }

    /** Crée la note et ses items dans une transaction afin de ne jamais exposer une checklist partielle. */
    async create(body: CreateNoteRequest, authorId: number): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const noteService = new NoteService(manager);

            const note = await noteService.noteRepo.save(noteService.noteRepo.create({
                title: body.title,
                type: body.type,
                content: body.type === "text" ? body.content ?? null : null,
                isPinned: body.isPinned ?? false,
                isArchived: false,
                archivedAt: null,
                authorId,
            }));
            const items = body.type === "checklist" && body.items?.length
                ? await noteService.noteItemService.createForNote(note, body.items)
                : [];

            return toNoteDto(note, items);
        });
    }

    /**
     * Met à jour la note dans une transaction. Lors d'un changement de type, le client doit fournir
     * le contenu texte ou la nouvelle liste complète pour garder les deux représentations cohérentes.
     */
    async update(id: number, body: UpdateNoteRequest): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const noteService = new NoteService(manager);
            const note = await noteService.findNoteOrThrow(id);
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
                await noteService.noteItemService.deleteForNote(note.id);
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
                await noteService.noteItemService.replaceForNote(note, body.items);
            }

            const updatedNote = await noteService.findNoteOrThrow(id);
            return toNoteDto(updatedNote, await noteService.noteItemService.getForNote(id));
        });
    }

    /** Archive une note une seule fois et conserve la date de sa première mise en archive. */
    async archive(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        if (!note.isArchived) {
            await this.noteRepo.update(id, { isArchived: true, archivedAt: new Date() });
        }
        return this.getById(id);
    }

    /** Restaure une note et efface sa date d'archivage. */
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
    async getChecklistOrThrow(id: number): Promise<Note> {
        const note = await this.findNoteOrThrow(id);
        if (note.type !== "checklist") {
            throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
        }
        return note;
    }

    /**
     * Met à jour le timestamp de la note après une modification portée par un item.
     */
    async touchUpdatedAt(note: Note): Promise<void> {
        await this.manager.getRepository(Note).update(note.id, { updatedAt: new Date() });
    }

    private async findNoteOrThrow(id: number): Promise<Note> {
        const note = await this.manager.getRepository(Note).findOneBy({ id });
        if (!note) throw notFound("NOTE_NOT_FOUND", "Note introuvable");
        return note;
    }
}
