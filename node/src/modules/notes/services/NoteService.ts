import type { NoteDto, UpdateNoteRequest } from "@chocosous/shared";
import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { forbidden, notFound } from "../../../utils/AppError";
import { Note } from "../entities/Note";
import { toNoteDto } from "../mappers/NoteMapper";

export default class NoteService {
    private readonly noteRepo: Repository<Note>;

    constructor(private readonly manager: EntityManager = AppDataSource.manager) {
        this.noteRepo = manager.getRepository(Note);
    }

    async list(archived: boolean): Promise<NoteDto[]> {
        const notes = await this.noteRepo.find({
            where: { isArchived: archived },
            order: { isPinned: "DESC", updatedAt: "DESC" },
        });
        return notes.map(toNoteDto);
    }

    async getById(id: number): Promise<NoteDto> {
        const note = await this.findNoteOrThrow(id);
        return toNoteDto(note);
    }

    async create(body: UpdateNoteRequest, authorId: number): Promise<NoteDto> {
        const note = this.noteRepo.create({
            title: body.title,
            content: body.content ?? null,
            isPinned: body.isPinned ?? false,
            isArchived: false,
            archivedAt: null,
            authorId,
        });
        const saved = await this.noteRepo.save(note);
        return toNoteDto(saved);
    }

    async update(id: number, body: UpdateNoteRequest): Promise<NoteDto> {
        await this.findNoteOrThrow(id);

        await this.noteRepo.update(id, {
            title: body.title,
            ...(body.content !== undefined ? { content: body.content } : {}),
            ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
        });

        const updatedNote = await this.findNoteOrThrow(id);
        return toNoteDto(updatedNote);
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
            throw forbidden("NOTE_FORBIDDEN", "Seul l'auteur peut supprimer définitivement cette note");
        }
        await this.noteRepo.delete({ id });
    }

    private async findNoteOrThrow(id: number): Promise<Note> {
        const note = await this.noteRepo.findOneBy({ id });
        if (!note) throw notFound("NOTE_NOT_FOUND", "Note introuvable");
        return note;
    }
}
