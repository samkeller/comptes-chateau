import type { CreateNoteItemInput, NoteItemDto, PatchNoteItemRequest } from "@chocosous/shared";
import { In, type EntityManager, type Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { badRequest, notFound } from "../../../utils/AppError";
import { Note } from "../entities/Note";
import { NoteItem } from "../entities/NoteItem";
import { toNoteItemDto } from "../mappers/NoteMapper";
import type NoteService from "./NoteService";

const MAX_NOTE_ITEMS = 200;

export default class NoteItemService {
    private readonly noteItemRepo: Repository<NoteItem>;

    constructor(
        private readonly noteService: NoteService,
        private readonly manager: EntityManager = AppDataSource.manager
    ) {
        this.noteItemRepo = manager.getRepository(NoteItem);
    }

    async getForNotes(noteIds: number[]): Promise<NoteItem[]> {
        if (noteIds.length === 0) return [];
        return this.noteItemRepo.find({
            where: { noteId: In(noteIds) },
            order: { sortOrder: "ASC", id: "ASC" },
        });
    }

    async getForNote(noteId: number): Promise<NoteItem[]> {
        return this.noteItemRepo.find({
            where: { noteId },
            order: { sortOrder: "ASC", id: "ASC" },
        });
    }

    /** Supprime les items lors d'une conversion de checklist vers une note texte. */
    async deleteForNote(noteId: number): Promise<void> {
        await this.noteItemRepo.delete({ noteId });
    }

    /**
     * Crée les items initiaux dans la même transaction que la note.
     */
    async createForNote(note: Note, inputs: CreateNoteItemInput[]): Promise<NoteItem[]> {
        if (note.type !== "checklist") {
            throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
        }
        if (inputs.length > MAX_NOTE_ITEMS) {
            throw badRequest("NOTE_ITEM_LIMIT", `Une checklist ne peut pas dépasser ${MAX_NOTE_ITEMS} items`);
        }
        if (inputs.length === 0) return [];

        const items = inputs.map((input, index) => this.noteItemRepo.create({
            noteId: note.id,
            label: input.label,
            isChecked: input.isChecked ?? false,
            sortOrder: input.sortOrder ?? index,
        }));
        return this.noteItemRepo.save(items);
    }

    /**
     * Remplace toute la liste, comportement utilisé par la mise à jour complète d'une note.
     */
    async replaceForNote(note: Note, inputs: CreateNoteItemInput[]): Promise<NoteItem[]> {
        if (note.type !== "checklist") {
            throw badRequest("NOTE_ITEMS_REQUIRE_CHECKLIST", "Seules les checklists peuvent contenir des items");
        }
        if (inputs.length > MAX_NOTE_ITEMS) {
            throw badRequest("NOTE_ITEM_LIMIT", `Une checklist ne peut pas dépasser ${MAX_NOTE_ITEMS} items`);
        }
        const itemRepo = this.noteItemRepo;
        await itemRepo.delete({ noteId: note.id });
        return this.createForNote(note, inputs);
    }

    /**
     * Ajoute l'item à la fin de la liste, sauf si un ordre explicite est fourni.
     */
    async add(noteId: number, input: CreateNoteItemInput): Promise<NoteItemDto> {
        return this.manager.transaction(async (manager) => {
            const noteItemService = new NoteItemService(this.noteService, manager);
            const note = await noteItemService.noteService.getChecklistOrThrow(noteId);
            const itemRepo = noteItemService.noteItemRepo;
            const count = await itemRepo.countBy({ noteId });
            if (count >= MAX_NOTE_ITEMS) {
                throw badRequest("NOTE_ITEM_LIMIT", `Une checklist ne peut pas dépasser ${MAX_NOTE_ITEMS} items`);
            }
            const lastItem = await itemRepo.findOne({
                where: { noteId },
                order: { sortOrder: "DESC", id: "DESC" },
            });
            const item = await itemRepo.save(itemRepo.create({
                noteId,
                label: input.label,
                isChecked: input.isChecked ?? false,
                sortOrder: input.sortOrder ?? (lastItem?.sortOrder ?? -1) + 1,
            }));
            await noteItemService.noteService.touchUpdatedAt(note);
            return toNoteItemDto(item);
        });
    }

    /** Modifie un item et actualise la date de la note dans la même transaction. */
    async patch(noteId: number, itemId: number, changes: PatchNoteItemRequest): Promise<NoteItemDto> {
        return this.manager.transaction(async (manager) => {
            const noteItemService = new NoteItemService(this.noteService, manager);

            const note = await noteItemService.noteService.getChecklistOrThrow(noteId);
            const itemRepo = noteItemService.noteItemRepo;
            const item = await itemRepo.findOneBy({ id: itemId, noteId });
            if (!item) throw notFound("NOTE_ITEM_NOT_FOUND", "Item de note introuvable");

            Object.assign(item, changes);
            await itemRepo.save(item);
            await noteItemService.noteService.touchUpdatedAt(note);
            return toNoteItemDto(item);
        });
    }

    /** Supprime un item appartenant à la note et actualise la date de modification. */
    async delete(noteId: number, itemId: number): Promise<void> {
        await this.manager.transaction(async (manager) => {
            const noteItemService = new NoteItemService(this.noteService, manager);

            const note = await this.noteService.getChecklistOrThrow(noteId);
            const itemRepo = this.noteItemRepo;
            const item = await itemRepo.findOneBy({ id: itemId, noteId });
            if (!item) throw notFound("NOTE_ITEM_NOT_FOUND", "Item de note introuvable");

            await itemRepo.remove(item);
            await this.noteService.touchUpdatedAt(note);
        });
    }

}
