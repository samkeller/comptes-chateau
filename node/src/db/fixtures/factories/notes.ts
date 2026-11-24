import type { DeepPartial, EntityManager } from "typeorm";
import { Note } from "../../../modules/notes/entities/Note";
import { EntityFactory } from "../EntityFactory";

export class NoteFactory extends EntityFactory<Note, "authorId"> {
    constructor(manager: EntityManager) {
        super(manager, Note);
    }

    protected defaults(sequence: number): DeepPartial<Note> {
        return { title: `Note ${sequence}`, content: null, isPinned: false, isArchived: false, archivedAt: null };
    }
}
