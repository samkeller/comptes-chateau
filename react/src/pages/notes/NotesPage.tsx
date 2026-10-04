import type { NoteDto, NoteItemDto, NoteType } from "@chocosous/shared";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import InputSearch from "@/components/atoms/primereact/InputSearch";
import { ProgressSpinner } from "primereact/progressspinner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalToast } from "@/context/GlobalToastContext";
import { PageTemplate } from "@/pages/PageTemplate";
import NotesService from "@/services/notes/NotesService";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import NoteEditorDialog from "./NoteEditorDialog";

export default function NotesPage() {
    const service = useMemo(() => new NotesService(), []);
    const showToast = useGlobalToast();
    const [notes, setNotes] = useState<NoteDto[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const view = showArchived ? "archived" : "active";
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [editingNote, setEditingNote] = useState<NoteDto | null>(null);
    const [creatingType, setCreatingType] = useState<NoteType | null>(null);
    const mutationVersions = useRef(new Map<string, number>());

    const fetchNotes = useCallback(async (): Promise<NoteDto[]> => {
        const [activeNotes, archivedNotes] = await Promise.all([
                service.getAll(false),
                service.getAll(true),
        ]);
        return [...activeNotes, ...archivedNotes];
    }, [service]);

    useEffect(() => {
        let isCurrent = true;
        void fetchNotes()
            .then((data) => {
                if (isCurrent) setNotes(data);
            })
            .catch(() => {
                if (isCurrent) setLoadError(true);
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });
        return () => {
            isCurrent = false;
        };
    }, [fetchNotes]);

    function loadNotes(): void {
        setLoading(true);
        setLoadError(false);
        void fetchNotes()
            .then(setNotes)
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    }

    function retryLoading(): void {
        setLoading(true);
        setLoadError(false);
        void loadNotes();
    }

    const displayedNotes = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        return notes
            .filter((note) => note.isArchived === (view === "archived"))
            .filter((note) => !normalizedSearch || [
                note.title,
                note.content ?? "",
                ...note.items.map((item) => item.label),
            ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
            .sort((left, right) => {
                if (view === "active" && left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
                return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
            });
    }, [notes, search, view]);

    function replaceNote(updatedNote: NoteDto): void {
        setNotes((current) => [...current.filter((note) => note.id !== updatedNote.id), updatedNote]);
    }

    function updateItemInState(noteId: number, item: NoteItemDto): void {
        setNotes((current) => current.map((note) => note.id === noteId
            ? {
                ...note,
                items: note.items.some((currentItem) => currentItem.id === item.id)
                    ? note.items.map((currentItem) => currentItem.id === item.id ? item : currentItem)
                    : [...note.items, item].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id),
            }
            : note));
        setEditingNote((current) => current?.id === noteId
            ? {
                ...current,
                items: current.items.some((currentItem) => currentItem.id === item.id)
                    ? current.items.map((currentItem) => currentItem.id === item.id ? item : currentItem)
                    : [...current.items, item].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id),
            }
            : current);
    }

    function deleteItemFromState(noteId: number, itemId: number): void {
        setNotes((current) => current.map((note) => note.id === noteId
            ? { ...note, items: note.items.filter((item) => item.id !== itemId) }
            : note));
        setEditingNote((current) => current?.id === noteId
            ? { ...current, items: current.items.filter((item) => item.id !== itemId) }
            : current);
    }

    async function toggleItem(note: NoteDto, item: NoteItemDto): Promise<void> {
        const key = `${note.id}:${item.id}`;
        const version = (mutationVersions.current.get(key) ?? 0) + 1;
        mutationVersions.current.set(key, version);
        const optimisticItem = { ...item, isChecked: !item.isChecked };
        updateItemInState(note.id, optimisticItem);

        try {
            await service.updateItem(note.id, item.id, { isChecked: optimisticItem.isChecked });
        } catch {
            if (mutationVersions.current.get(key) === version) {
                updateItemInState(note.id, item);
                showToast({ severity: "error", summary: "Impossible de cocher cet élément. Réessayez." });
            }
        }
    }

    async function togglePin(note: NoteDto): Promise<void> {
        try {
            const updatedNote = await service.update(note.id, {
                title: note.title,
                isPinned: !note.isPinned,
            });
            replaceNote(updatedNote);
        } catch {
            showToast({ severity: "error", summary: "Impossible de modifier l’épinglage." });
        }
    }

    async function toggleArchive(note: NoteDto): Promise<void> {
        try {
            const updatedNote = note.isArchived
                ? await service.unarchive(note.id)
                : await service.archive(note.id);
            replaceNote(updatedNote);
            setEditingNote(null);
            showToast({
                severity: "success",
                summary: updatedNote.isArchived ? "Note archivée." : "Note désarchivée.",
            });
        } catch {
            showToast({ severity: "error", summary: "Impossible de modifier l’archivage." });
        }
    }

    function saveNote(note: NoteDto): void {
        replaceNote(note);
        setCreatingType(null);
    }

    function removeNote(noteId: number): void {
        setNotes((current) => current.filter((note) => note.id !== noteId));
        setEditingNote(null);
        showToast({ severity: "success", summary: "Note supprimée." });
    }

    return (
        <PageTemplate pageTitle="Notes">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        label={showArchived ? "Afficher les notes actives" : "Afficher les archives"}
                        icon={showArchived ? "pi pi-file" : "pi pi-inbox"}
                        outlined={!showArchived}
                        aria-pressed={showArchived}
                        onClick={() => setShowArchived((current) => !current)}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <span className="p-input-icon-left flex-1">
                            <i className="pi pi-search" />
                            <InputSearch
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher une note"
                                aria-label="Rechercher une note"
                                className="w-full"
                            />
                        </span>
                        {view === "active" && (
                            <Button
                                label="Nouvelle note"
                                icon="pi pi-plus"
                                onClick={() => setCreatingType("text")}
                            />
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><ProgressSpinner /></div>
                ) : loadError ? (
                    <div className="flex flex-col items-center gap-3 p-8 text-center">
                        <p>Impossible de charger les notes.</p>
                        <Button label="Réessayer" icon="pi pi-refresh" onClick={retryLoading} />
                    </div>
                ) : displayedNotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface p-10 text-center text-surface-500">
                        {search ? "Aucune note ne correspond à la recherche." : view === "archived"
                            ? "Aucune note archivée."
                            : "Aucune note pour le moment. Créez une note ou une checklist."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {displayedNotes.map((note) => (
                            <article
                                key={note.id}
                                tabIndex={0}
                                aria-label={`Ouvrir la note ${note.title}`}
                                onClick={() => setEditingNote(note)}
                                onKeyDown={(event) => {
                                    if (event.target !== event.currentTarget) return;
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setEditingNote(note);
                                    }
                                }}
                                className="cursor-pointer rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                            >
                            <Card className="w-full border border-surface shadow-sm transition-colors hover:border-primary">
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                    <span className="min-w-0 flex-1 truncate text-lg font-semibold">{note.title}</span>
                                    {view === "active" && (
                                        <Button
                                            icon={note.isPinned ? "pi pi-bookmark-fill" : "pi pi-bookmark"}
                                            rounded
                                            text
                                            aria-label={note.isPinned ? "Désépingler" : "Épingler"}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                void togglePin(note);
                                            }}
                                        />
                                    )}
                                </div>
                                {note.type === "text" ? (
                                    note.content ? (
                                        <div className="mt-2 max-h-32 overflow-hidden text-sm text-surface-500">
                                            <MarkdownRenderer>{note.content}</MarkdownRenderer>
                                        </div>
                                    ) : (
                                        <span className="mt-2 block text-sm italic text-surface-500">Note vide</span>
                                    )
                                ) : (
                                    <div className="mt-2 flex flex-col">
                                        {note.items.length === 0 && (
                                            <span className="py-2 text-sm italic text-surface-500">Checklist vide</span>
                                        )}
                                        {note.items.slice(0, 5).map((item) => (
                                            <label
                                                key={item.id}
                                                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 ${
                                                    note.isArchived ? "cursor-default" : "hover:bg-surface-800"
                                                }`}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={item.isChecked}
                                                    disabled={note.isArchived}
                                                    onChange={() => void toggleItem(note, item)}
                                                    className="h-5 w-5 shrink-0 accent-teal-400"
                                                    aria-label={`${item.isChecked ? "Décocher" : "Cocher"} ${item.label}`}
                                                />
                                                <span className={`line-clamp-2 text-sm ${item.isChecked ? "line-through opacity-60" : ""}`}>
                                                    {item.label}
                                                </span>
                                            </label>
                                        ))}
                                        {note.items.length > 5 && (
                                            <span className="mt-2 text-sm text-surface-500">
                                                + {note.items.length - 5} autres éléments
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Card>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {(editingNote || creatingType) && (
                <NoteEditorDialog
                    note={editingNote}
                    initialType={creatingType ?? "text"}
                    onClose={() => {
                        setEditingNote(null);
                        setCreatingType(null);
                    }}
                    onSaved={saveNote}
                    onDeleted={removeNote}
                    onArchive={(note) => void toggleArchive(note)}
                    onItemChanged={updateItemInState}
                    onItemDeleted={deleteItemFromState}
                />
            )}
        </PageTemplate>
    );
}
