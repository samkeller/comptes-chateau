import type { NoteDto } from "@chocosous/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import NotesService from "@/services/notes/NotesService";
import { NoteAutosaver, type NoteDraft } from "./noteAutosaver";

const AUTOSAVE_DELAY_MS = 1000;
const notesService = new NotesService();

interface UseNoteAutosaveOptions {
    note: NoteDto | null;
    draft: NoteDraft;
    onSaved: (note: NoteDto) => void;
    onError: () => void;
}

interface UseNoteAutosaveResult {
    /** Note telle qu'enregistrée en base (`null` tant qu'elle n'a jamais été créée). */
    savedNote: NoteDto | null;
    saving: boolean;
    /** Dernière note enregistrée, lue sans dépendre du dernier rendu. */
    getSavedNote: () => NoteDto | null;
    /** Enregistre immédiatement le brouillon. Retourne `false` en cas d'échec. */
    flush: () => Promise<boolean>;
    /** Annule les enregistrements en attente et interdit les suivants. */
    discard: () => void;
}

/** Enregistre automatiquement le brouillon après une courte inactivité. */
export function useNoteAutosave({ note, draft, onSaved, onError }: UseNoteAutosaveOptions): UseNoteAutosaveResult {
    const [autosaver] = useState(() => new NoteAutosaver(note, notesService));
    const [savedNote, setSavedNote] = useState<NoteDto | null>(note);
    const [pendingSaves, setPendingSaves] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latest = useRef({ draft, onSaved, onError });

    useEffect(() => {
        latest.current = { draft, onSaved, onError };
    });

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }, []);

    const flush = useCallback(async (): Promise<boolean> => {
        clearTimer();
        setPendingSaves((count) => count + 1);
        try {
            const saved = await autosaver.save(latest.current.draft);
            if (saved) {
                setSavedNote(saved);
                latest.current.onSaved(saved);
            }
            return true;
        } catch {
            latest.current.onError();
            return false;
        } finally {
            setPendingSaves((count) => count - 1);
        }
    }, [autosaver, clearTimer]);

    const discard = useCallback(() => {
        clearTimer();
        autosaver.close();
    }, [autosaver, clearTimer]);

    useEffect(() => {
        timeoutRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
        return clearTimer;
    }, [draft.title, draft.content, flush, clearTimer]);

    // Démontage (ex. navigation) : on n'attend pas le délai pour ne pas perdre la dernière saisie.
    useEffect(() => () => {
        void autosaver.save(latest.current.draft)
            .then((saved) => { if (saved) latest.current.onSaved(saved); })
            .catch(() => latest.current.onError());
    }, [autosaver]);

    const getSavedNote = useCallback(() => autosaver.note, [autosaver]);

    return { savedNote, saving: pendingSaves > 0, getSavedNote, flush, discard };
}
