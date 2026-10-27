import type { NoteDto } from "@chocosous/shared";
import { Button } from "primereact/button";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import MarkdownEditor from "@/components/form/markdown/MarkdownEditor";
import { useGlobalToast } from "@/context/GlobalToastContext";
import { useScreen } from "@/hooks/useScreen";
import NotesService from "@/services/notes/NotesService";
import { toNoteBody } from "./hooks/noteAutosaver";
import { useNoteAutosave } from "./hooks/useNoteAutosave";

interface NoteEditorDialogProps {
    /** Note à modifier, ou `null` pour en créer une (créée dès le premier contenu saisi). */
    note: NoteDto | null;
    onClose: () => void;
    onSaved: (note: NoteDto) => void;
    onDeleted: (noteId: number) => void;
    onArchive: (note: NoteDto) => void;
}

const notesService = new NotesService();

export default function NoteEditorDialog({
    note,
    onClose,
    onSaved,
    onDeleted,
    onArchive,
}: NoteEditorDialogProps) {
    const { isMobile } = useScreen();
    const showToast = useGlobalToast();
    const [title, setTitle] = useState(note?.title ?? "");
    const [content, setContent] = useState(note?.content ?? "");

    const { savedNote, saving, flush, discard, getSavedNote } = useNoteAutosave({
        note,
        draft: { title, content },
        onSaved,
        onError: () => showToast({ severity: "error", summary: "Impossible de sauvegarder la note." }),
    });

    /**
     * Enregistre les dernières modifications avant de fermer.
     * Une note existante vidée de tout contenu est supprimée (une note vide est invalide).
     */
    async function closeDialog(): Promise<void> {
        if (!(await flush())) return;

        const persistedNote = getSavedNote();
        if (persistedNote && !toNoteBody({ title, content })) {
            discard();
            try {
                await notesService.delete(persistedNote.id);
                onDeleted(persistedNote.id);
            } catch {
                showToast({ severity: "error", summary: "Impossible de supprimer la note vide." });
            }
        }
        onClose();
    }

    async function archiveNote(): Promise<void> {
        if (!(await flush())) return;
        const persistedNote = getSavedNote();
        if (persistedNote) onArchive(persistedNote);
    }

    async function deleteNote(): Promise<void> {
        if (!savedNote) return;
        discard();
        try {
            await notesService.delete(savedNote.id);
            onDeleted(savedNote.id);
            onClose();
        } catch {
            showToast({ severity: "error", summary: "Impossible de supprimer la note." });
        }
    }

    function confirmDelete(): void {
        confirmDialog({
            message: "Voulez-vous vraiment supprimer cette note ?",
            header: "Confirmation de suppression",
            defaultFocus: "accept",
            acceptClassName: "p-button-danger",
            accept: () => void deleteNote(),
        });
    }

    const header = (
        <div className="flex flex-row gap-2 justify-between w-full">
            <h2 className="text-lg font-semibold">
                {saving && <i className="pi pi-spin pi-spinner mr-2" />}
                {savedNote ? "Modifier la note" : "Nouvelle note"}
            </h2>
            {savedNote && (
                <div className="flex gap-2">
                    <Button
                        tooltip={savedNote.isArchived ? "Désarchiver" : "Archiver"}
                        className="py-0 h-8 w-8"
                        icon={savedNote.isArchived ? "pi pi-inbox" : "pi pi-box"}
                        severity="secondary"
                        rounded text
                        onClick={() => void archiveNote()}
                    />
                    <Button
                        tooltip="Supprimer"
                        className="py-0 h-8 w-8"
                        icon="pi pi-trash"
                        severity="danger"
                        rounded text
                        onClick={confirmDelete}
                    />
                </div>
            )}
        </div>
    );

    return (
        <Dialog
            visible
            onHide={() => void closeDialog()}
            header={header}
            className={isMobile
                ? "m-0 h-dvh max-h-dvh w-screen max-w-none rounded-none"
                : "w-[min(42rem,90vw)]"
            }
            contentClassName="max-h-[70dvh] overflow-y-auto"
            draggable={false}
            dismissableMask
        >
            <div className="flex flex-col gap-4">
                <InputText
                    autoFocus={!note}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Titre"
                    maxLength={255}
                    aria-label="Titre de la note"
                    className="text-lg font-semibold"
                />

                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                />
            </div>
            <ConfirmDialog />
        </Dialog>
    );
}
