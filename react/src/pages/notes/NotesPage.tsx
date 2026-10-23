import type { NoteDto } from "@chocosous/shared";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import InputSearch from "@/components/atoms/primereact/InputSearch";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useMemo, useState } from "react";
import { useGlobalToast } from "@/context/GlobalToastContext";
import { PageTemplate } from "@/pages/PageTemplate";
import NotesService from "@/services/notes/NotesService";
import NoteEditorDialog from "./NoteEditorDialog";
import { useScreen } from "@/hooks/useScreen";
import NoteCardContent from "./molecules/NoteCardContent";

const notesService = new NotesService();
export default function NotesPage() {
    const showToast = useGlobalToast();
    const [notes, setNotes] = useState<NoteDto[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const view = showArchived ? "archived" : "active";
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    /**
     * État du dialogue d'édition de note.
     * Contient la note en cours d'édition ou `null` si aucun dialogue n'est ouvert.
     */
    const [editor, setEditor] = useState<{ note: NoteDto | null } | null>(null);
    const { width, isMobile } = useScreen()
    const noteMinWidth = 300;
    const noteColumnCount = Math.max(1, Math.floor(width / noteMinWidth));

    useEffect(() => {
        let isCurrentRequest = true;
        void notesService.getAll(showArchived)
            .then((data) => {
                if (isCurrentRequest) setNotes(data);
            })
            .finally(() => {
                if (isCurrentRequest) setLoading(false);
            });
        return () => {
            isCurrentRequest = false;
        };
    }, [showArchived]);

    const displayedNotes = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        return notes
            .filter((note) => note.isArchived === (view === "archived"))
            .filter((note) => !normalizedSearch || [
                note.title,
                note.content ?? "",
            ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
            .sort((left, right) => {
                if (view === "active" && left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
                return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
            });
    }, [notes, search, view]);

    function replaceNote(updatedNote: NoteDto): void {
        setNotes((current) => [...current.filter((note) => note.id !== updatedNote.id), updatedNote]);
    }

    async function updateChecklistContent(note: NoteDto, newContent: string): Promise<void> {
        // Mise à jour optimiste : la case reste cochée sans attendre le serveur.
        replaceNote({ ...note, content: newContent });
        try {
            const updatedNote = await notesService.update(note.id, {
                title: note.title,
                content: newContent,
            });
            // On garde l'ancienne date pour que la carte ne saute pas pendant qu'on coche plusieurs items.
            replaceNote({ ...updatedNote, updatedAt: note.updatedAt });
        } catch {
            replaceNote(note); // Rollback
        }
    }

    async function togglePin(note: NoteDto): Promise<void> {
        const updatedNote = await notesService.update(note.id, {
            title: note.title,
            content: note.content,
            isPinned: !note.isPinned,
        });
        replaceNote(updatedNote);
    }

    async function toggleArchive(note: NoteDto): Promise<void> {
        const updatedNote = note.isArchived
            ? await notesService.unarchive(note.id)
            : await notesService.archive(note.id);
        setNotes((current) => current.filter((currentNote) => currentNote.id !== updatedNote.id));
        setEditor(null);
        showToast({
            severity: "success",
            summary: updatedNote.isArchived ? "Note archivée." : "Note désarchivée.",
        });
    }

    function changeArchiveView(): void {
        setLoading(true);
        setShowArchived((current) => !current);
    }

    function removeNote(noteId: number): void {
        setNotes((current) => current.filter((note) => note.id !== noteId));
        setEditor(null);
        showToast({ severity: "success", summary: "Note supprimée." });
    }

    return (
        <PageTemplate pageTitle="Notes">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <InputSearch
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Rechercher une note"
                        aria-label="Rechercher une note"
                        className="w-full flex-1"
                    />
                    <Button
                        {...(!isMobile && { label: "Afficher les notes archivées" })}
                        icon={showArchived ? "pi pi-check-circle" : "pi pi-circle"}
                        outlined={!showArchived}
                        size="small"
                        className="shrink-0"
                        onClick={changeArchiveView}
                        {...(isMobile && { tooltip: "Afficher les notes archivées", tooltipOptions: { position: "bottom" } })}
                    />
                    <Button
                        label="Nouvelle note"
                        icon="pi pi-plus"
                        size="small"
                        className="shrink-0"
                        onClick={() => setEditor({ note: null })}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><ProgressSpinner /></div>
                ) : displayedNotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface p-10 text-center text-surface-500">
                        {search ? "Aucune note ne correspond à la recherche." : view === "archived"
                            ? "Aucune note archivée."
                            : "Aucune note pour le moment. Créez votre première note."}
                    </div>
                ) : (
                    <div
                        className="w-full"
                        style={{ columnCount: noteColumnCount, columnGap: "0.75rem" }}
                    >
                        {displayedNotes.map((note) => (
                            <article
                                key={note.id}
                                tabIndex={0}
                                aria-label={`Ouvrir la note ${note.title}`}
                                onClick={() => setEditor({ note })}
                                onKeyDown={(event) => {
                                    if (event.target !== event.currentTarget) return;
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setEditor({ note });
                                    }
                                }}
                                className="mb-3 inline-block w-full break-inside-avoid cursor-pointer rounded-xl focus-visible:outline focus-visible:outline-primary"
                            >
                                <Card
                                    className="w-full border border-surface shadow-sm transition-colors hover:border-primary"
                                    pt={{
                                        content: {
                                            className: "py-2"
                                        }
                                    }}
                                >
                                    <div className="flex min-w-0 items-center justify-end gap-2">
                                        {note.title && (
                                            <span className="min-w-0 flex-1 truncate text-lg font-semibold">{note.title}</span>
                                        )}
                                        {view === "active" && (
                                            <Button
                                                icon={note.isPinned ? "pi pi-bookmark-fill" : "pi pi-bookmark"}
                                                rounded
                                                text
                                                aria-label={note.isPinned ? "Désépingler" : "Épingler"}
                                                size="small"
                                                className="p-0 h-6 w-6"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void togglePin(note);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <NoteCardContent
                                        note={note}
                                        onContentChange={(newContent) => void updateChecklistContent(note, newContent)}
                                    />
                                </Card>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {editor !== null && (
                <NoteEditorDialog
                    note={editor.note}
                    onClose={() => setEditor(null)}
                    onSaved={replaceNote}
                    onDeleted={removeNote}
                    onArchive={(note) => void toggleArchive(note)}
                />
            )}
        </PageTemplate>
    );
}
