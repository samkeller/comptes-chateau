import type { CreateNoteItemInput, NoteDto, NoteItemDto, NoteType } from "@chocosous/shared";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { useScreen } from "@/hooks/useScreen";
import { useGlobalToast } from "@/context/GlobalToastContext";
import MarkdownEditor from "@/components/form/markdown/MarkdownEditor";
import { MarkdownRenderer } from "@/components/atoms/MarkdownRenderer";
import NotesService from "@/services/notes/NotesService";
import { checklistToMarkdown, markdownToChecklist } from "./noteConversions";

interface NoteEditorDialogProps {
    note: NoteDto | null;
    initialType: NoteType;
    onClose: () => void;
    onSaved: (note: NoteDto) => void;
    onDeleted: (noteId: number) => void;
    onItemChanged: (noteId: number, item: NoteItemDto) => void;
    onItemDeleted: (noteId: number, itemId: number) => void;
    onArchive: (note: NoteDto) => void;
}

export default function NoteEditorDialog({
    note,
    initialType,
    onClose,
    onSaved,
    onDeleted,
    onItemChanged,
    onItemDeleted,
    onArchive,
}: NoteEditorDialogProps) {
    const service = new NotesService();
    const { isMobile } = useScreen();
    const showToast = useGlobalToast();
    const [title, setTitle] = useState(note?.title ?? "");
    const [content, setContent] = useState(note?.content ?? "");
    const [items, setItems] = useState<CreateNoteItemInput[]>(note?.items ?? []);
    const [draftType, setDraftType] = useState<NoteType>(note?.type ?? initialType);
    const [hasTypeToggled, setHasTypeToggled] = useState(false);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const isCreating = note === null;
    const type = draftType;
    const isDraftChecklist = isCreating || note?.type !== "checklist" || hasTypeToggled;

    function toggleType(): void {
        setHasTypeToggled(true);
        if (type === "text") {
            setItems(markdownToChecklist(content));
            setDraftType("checklist");
        } else {
            setContent(checklistToMarkdown(items));
            setDraftType("text");
        }
    }

    async function saveNote(): Promise<void> {
        if (!title.trim()) {
            showToast({ severity: "warn", summary: "Le titre est obligatoire." });
            return;
        }
        setSaving(true);
        try {
            const savedNote = isCreating
                ? await service.create({
                    title: title.trim(),
                    type,
                    ...(type === "text" ? { content } : { items }),
                })
                : await service.update(note.id, {
                    title: title.trim(),
                    type,
                    ...(type === "text" ? { content } : note.type !== "checklist" || hasTypeToggled ? { items } : {}),
                });
            onSaved(savedNote);
            showToast({ severity: "success", summary: isCreating ? "Note créée." : "Note modifiée." });
            onClose();
        } catch {
            showToast({ severity: "error", summary: "Impossible d’enregistrer la note." });
        } finally {
            setSaving(false);
        }
    }

    async function addChecklistItem(): Promise<void> {
        const label = newItemLabel.trim();
        if (!label) return;
        if (isDraftChecklist) {
            setItems((current) => [...current, { label }]);
            setNewItemLabel("");
            return;
        }
        try {
            const item = await service.addItem(note.id, { label });
            setItems((current) => [...current, item]);
            onItemChanged(note.id, item);
            setNewItemLabel("");
        } catch {
            showToast({ severity: "error", summary: "Impossible d’ajouter l’élément." });
        }
    }

    async function changeItem(item: CreateNoteItemInput, index: number, changes: Partial<CreateNoteItemInput>): Promise<void> {
        const nextItem = { ...item, ...changes };
        if (isDraftChecklist) {
            setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? nextItem : entry));
            return;
        }
        const currentItem = note.items[index];
        if (!currentItem) return;
        setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? nextItem : entry));
        try {
            const updated = await service.updateItem(note.id, currentItem.id, changes);
            onItemChanged(note.id, updated);
        } catch {
            setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? item : entry));
            showToast({ severity: "error", summary: "Impossible de modifier l’élément." });
        }
    }

    async function saveItemLabel(index: number): Promise<void> {
        if (isDraftChecklist || !note) return;
        const item = items[index];
        const savedItem = note.items[index];
        if (!item || !savedItem || item.label === savedItem.label) return;
        try {
            const updated = await service.updateItem(note.id, savedItem.id, { label: item.label });
            onItemChanged(note.id, updated);
        } catch {
            setItems((current) => current.map((entry, entryIndex) =>
                entryIndex === index ? { ...entry, label: savedItem.label } : entry
            ));
            showToast({ severity: "error", summary: "Impossible de modifier l’élément." });
        }
    }

    async function removeItem(index: number): Promise<void> {
        if (isDraftChecklist) {
            setItems((current) => current.filter((_item, itemIndex) => itemIndex !== index));
            return;
        }
        const item = note.items[index];
        if (!item) return;
        try {
            await service.deleteItem(note.id, item.id);
            setItems((current) => current.filter((_entry, itemIndex) => itemIndex !== index));
            onItemDeleted(note.id, item.id);
        } catch {
            showToast({ severity: "error", summary: "Impossible de supprimer l’élément." });
        }
    }

    async function deleteNote(): Promise<void> {
        if (!note) return;
        try {
            await service.delete(note.id);
            onDeleted(note.id);
            onClose();
        } catch {
            showToast({ severity: "error", summary: "Impossible de supprimer la note." });
        }
    }

    const footer = (
        <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
                {!isCreating && (
                    <>
                        <Button
                            label={note.isArchived ? "Désarchiver" : "Archiver"}
                            icon={note.isArchived ? "pi pi-inbox" : "pi pi-box"}
                            severity="secondary"
                            outlined
                            onClick={() => onArchive(note)}
                        />
                        <Button
                            label={confirmDelete ? "Confirmer" : "Supprimer"}
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            onClick={() => confirmDelete ? void deleteNote() : setConfirmDelete(true)}
                        />
                        {confirmDelete && (
                            <Button label="Annuler" text onClick={() => setConfirmDelete(false)} />
                        )}
                    </>
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Fermer" text onClick={onClose} />
                <Button
                    label={isCreating ? "Créer" : "Enregistrer"}
                    icon="pi pi-check"
                    loading={saving}
                    disabled={!title.trim()}
                    onClick={() => void saveNote()}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            visible
            onHide={onClose}
            header={isCreating ? "Nouvelle note" : "Modifier la note"}
            footer={footer}
            className={isMobile ? "m-0 h-dvh max-h-dvh w-screen max-w-none rounded-none" : "w-[min(42rem,90vw)]"}
            contentClassName="max-h-[70dvh] overflow-y-auto"
            draggable={false}
            dismissableMask={!saving}
        >
            <div className="flex flex-col gap-4">
                <InputText
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Titre"
                    maxLength={255}
                    aria-label="Titre de la note"
                    className="w-full text-lg font-semibold"
                />
                <div className="flex items-center justify-between rounded-lg border border-surface px-3 py-2">
                    <span className="font-medium">Contenu de la note</span>
                    <Button
                        label={type === "text" ? "Texte" : "Checklist"}
                        icon={type === "text" ? "pi pi-align-left" : "pi pi-check-square"}
                        outlined
                        aria-label={`Changer le type en ${type === "text" ? "checklist" : "texte"}`}
                        onClick={toggleType}
                    />
                </div>
                {type === "text" ? (
                    <div className="flex flex-col gap-2">
                        <label className="font-medium">Contenu</label>
                        <MarkdownEditor value={content} onChange={setContent} />
                        {content && (
                            <details className="rounded-lg border border-surface p-3">
                                <summary className="cursor-pointer">Aperçu</summary>
                                <MarkdownRenderer>{content}</MarkdownRenderer>
                            </details>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <label className="font-medium">Liste</label>
                        {items.map((item, index) => (
                            <div key={note?.items[index]?.id ?? `draft-${index}`} className="flex items-center gap-2">
                                <Checkbox
                                    inputId={`note-item-${index}`}
                                    checked={item.isChecked ?? false}
                                    onChange={(event) => void changeItem(item, index, { isChecked: event.checked })}
                                />
                                <InputText
                                    value={item.label}
                                    onChange={(event) => setItems((current) => current.map((entry, entryIndex) =>
                                        entryIndex === index ? { ...entry, label: event.target.value } : entry
                                    ))}
                                    onBlur={() => void saveItemLabel(index)}
                                    maxLength={500}
                                    aria-label={`Élément ${index + 1}`}
                                    className={`min-h-11 flex-1 ${item.isChecked ? "line-through opacity-60" : ""}`}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    severity="danger"
                                    aria-label={`Supprimer ${item.label}`}
                                    onClick={() => void removeItem(index)}
                                />
                            </div>
                        ))}
                        <form
                            className="flex gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void addChecklistItem();
                            }}
                        >
                            <InputText
                                value={newItemLabel}
                                onChange={(event) => setNewItemLabel(event.target.value)}
                                placeholder="Ajouter un élément"
                                maxLength={500}
                                className="min-h-11 flex-1"
                            />
                            <Button
                                type="submit"
                                icon="pi pi-plus"
                                aria-label="Ajouter un élément"
                                disabled={!newItemLabel.trim()}
                            />
                        </form>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
