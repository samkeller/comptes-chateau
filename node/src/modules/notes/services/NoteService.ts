import type {
    CreateNoteItemInput,
    CreateNoteRequest,
    NoteDto,
    NoteItemDto,
    PatchNoteItemRequest,
    UpdateNoteRequest,
} from "@chocosous/shared";
import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { badRequest, forbidden, notFound } from "../../../utils/AppError";
import { Note } from "../entities/Note";
import { NoteItem } from "../entities/NoteItem";
import { toNoteDto, toNoteItemDto } from "../mappers/NoteMapper";

const MAX_NOTE_ITEMS = 200;

export default class NoteService {
    private readonly noteRepo: Repository<Note>;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.noteRepo = manager.getRepository(Note);
    }

    async list(archived: boolean): Promise<NoteDto[]> {
        const notes = await this.noteRepo.find({
            where: { isArchived: archived },
            relations: { items: true },
            order: { isPinned: "DESC", updatedAt: "DESC" },
        });
        return notes.map(toNoteDto);
    }

    async getById(id: number): Promise<NoteDto> {
        return toNoteDto(await this.findNoteOrThrow(id));
    }

    async create(body: CreateNoteRequest, authorId: number): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const noteRepo = manager.getRepository(Note);
            const itemRepo = manager.getRepository(NoteItem);
            const note = await noteRepo.save(noteRepo.create({
                title: body.title,
                type: body.type,
                content: body.type === "text" ? body.content ?? null : null,
                isPinned: body.isPinned ?? false,
                isArchived: false,
                archivedAt: null,
                authorId,
            }));

            if (body.type === "checklist" && body.items?.length) {
                await itemRepo.save(body.items.map((item, index) => this.createItem(item, note, index)));
            }

            return toNoteDto(await this.findNoteOrThrow(note.id, manager));
        });
    }

    async update(id: number, body: UpdateNoteRequest): Promise<NoteDto> {
        return this.manager.transaction(async (manager) => {
            const noteRepo = manager.getRepository(Note);
            const itemRepo = manager.getRepository(NoteItem);
            const note = await this.findNoteOrThrow(id, manager);

            if (body.items !== undefined && note.type !== "checklist") {
                throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
            }
            if (body.content !== undefined && note.type === "checklist" && body.content !== null) {
                throw badRequest("NOTE_CONTENT_REQUIRE_TEXT", "Une checklist ne peut pas contenir de texte Markdown");
            }

            await noteRepo.update(id, {
                title: body.title,
                ...(body.content !== undefined && note.type === "text" ? { content: body.content } : {}),
                ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
            });

            if (body.items !== undefined) {
                await itemRepo.delete({ noteId: id });
                if (body.items.length > 0) {
                    await itemRepo.save(body.items.map((item, index) => this.createItem(item, note, index)));
                }
            }

            return toNoteDto(await this.findNoteOrThrow(id, manager));
        });
    }

    async patchItem(noteId: number, itemId: number, changes: PatchNoteItemRequest): Promise<NoteItemDto> {
        return this.manager.transaction(async (manager) => {
            const note = await this.findNoteOrThrow(noteId, manager);
            if (note.type !== "checklist") {
                throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
            }
            const itemRepo = manager.getRepository(NoteItem);
            const item = await itemRepo.findOneBy({ id: itemId, noteId });
            if (!item) throw notFound("NOTE_ITEM_NOT_FOUND", "Item de note introuvable");

            Object.assign(item, changes);
            await itemRepo.save(item);
            await this.touchNote(manager, note);
            return toNoteItemDto(item);
        });
    }

    async addItem(noteId: number, input: CreateNoteItemInput): Promise<NoteItemDto> {
        return this.manager.transaction(async (manager) => {
            const note = await this.findNoteOrThrow(noteId, manager);
            if (note.type !== "checklist") {
                throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
            }
            const itemRepo = manager.getRepository(NoteItem);
            const count = await itemRepo.countBy({ noteId });
            if (count >= MAX_NOTE_ITEMS) {
                throw badRequest("NOTE_ITEM_LIMIT", `Une checklist ne peut pas dépasser ${MAX_NOTE_ITEMS} items`);
            }
            const lastItem = await itemRepo.findOne({
                where: { noteId },
                order: { sortOrder: "DESC" },
            });
            const nextOrder = (lastItem?.sortOrder ?? -1) + 1;
            const item = this.createItem(input, note, nextOrder);
            await itemRepo.save(item);
            await this.touchNote(manager, note);
            return toNoteItemDto(item);
        });
    }

    async deleteItem(noteId: number, itemId: number): Promise<void> {
        await this.manager.transaction(async (manager) => {
            const note = await this.findNoteOrThrow(noteId, manager);
            if (note.type !== "checklist") {
                throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
            }
            const itemRepo = manager.getRepository(NoteItem);
            const item = await itemRepo.findOneBy({ id: itemId, noteId });
            if (!item) throw notFound("NOTE_ITEM_NOT_FOUND", "Item de note introuvable");
            await itemRepo.remove(item);
            await this.touchNote(manager, note);
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

    async delete(id: number, requestingUserId: number): Promise<void> {
        const note = await this.findNoteOrThrow(id);
        if (note.authorId !== requestingUserId) {
            throw forbidden("NOTE_FORBIDDEN", "Seul l’auteur peut supprimer définitivement cette note");
        }
        await this.noteRepo.delete({ id });
    }

    private createItem(input: CreateNoteItemInput, note: Note, defaultOrder: number): NoteItem {
        return Object.assign(new NoteItem(), {
            noteId: note.id,
            note,
            label: input.label,
            isChecked: input.isChecked ?? false,
            sortOrder: input.sortOrder ?? defaultOrder,
        });
    }

    private async touchNote(manager: EntityManager, note: Note): Promise<void> {
        await manager.getRepository(Note).update(note.id, { title: note.title });
    }

    private async findNoteOrThrow(id: number, manager: EntityManager = this.manager): Promise<Note> {
        const note = await manager.getRepository(Note).findOne({
            where: { id },
            relations: { items: true },
        });
        if (!note) throw notFound("NOTE_NOT_FOUND", "Note introuvable");
        return note;
    }
}
