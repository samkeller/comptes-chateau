import type { UpdateNoteRequest, NoteDto } from "@chocosous/shared";
import type NotesService from "@/services/notes/NotesService";

export interface NoteDraft {
    title: string;
    content: string;
}

type NotePersistence = Pick<NotesService, "create" | "update">;

/**
 * Convertit un brouillon en payload API.
 * Retourne `null` si la note est invalide : il faut au moins un titre OU du contenu.
 */
export function toNoteBody(draft: NoteDraft): UpdateNoteRequest | null {
    const title = draft.title.trim();
    const content = draft.content.trim() ? draft.content : null;
    return title || content ? { title, content } : null;
}

/**
 * Persiste les brouillons d'une note : crée la note au premier enregistrement valide,
 * puis la met à jour. Les enregistrements sont sérialisés pour ne jamais créer de doublon
 * ni écraser un contenu récent par un plus ancien.
 */
export class NoteAutosaver {
    private saved: NoteDto | null;
    private lastBody: UpdateNoteRequest | null;
    private queue: Promise<unknown> = Promise.resolve();
    private closed = false;

    constructor(initialNote: NoteDto | null, private readonly service: NotePersistence) {
        this.saved = initialNote;
        this.lastBody = initialNote ? { title: initialNote.title, content: initialNote.content } : null;
    }

    get note(): NoteDto | null {
        return this.saved;
    }

    /** Interdit tout enregistrement futur (ex. note supprimée). */
    close(): void {
        this.closed = true;
    }

    /** Retourne la note enregistrée, ou `null` si rien n'avait à l'être. */
    save(draft: NoteDraft): Promise<NoteDto | null> {
        const run = this.queue.then(() => this.persist(draft));
        this.queue = run.catch(() => undefined);
        return run;
    }

    private async persist(draft: NoteDraft): Promise<NoteDto | null> {
        const body = toNoteBody(draft);
        if (this.closed || !body) return null;
        if (this.lastBody && this.lastBody.title === body.title && this.lastBody.content === body.content) return null;

        const saved = this.saved
            ? await this.service.update(this.saved.id, body)
            : await this.service.create(body);

        this.saved = saved;
        this.lastBody = body;
        return saved;
    }
}
