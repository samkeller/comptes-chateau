import type { CreateNoteItemInput, NoteDto, NoteItemDto, NoteType } from "@chocosous/shared";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { useScreen } from "@/hooks/useScreen";
import { useGlobalToast } from "@/context/GlobalToastContext";
import NotesService from "@/services/notes/NotesService";
import { checklistToMarkdown, markdownToChecklist } from "./noteConversions";
import { SelectButton } from "primereact/selectbutton";
import NoteChecklistEditor, { type NoteItemDraft } from "./molecules/NoteChecklistEditor";
import NoteTextEditor from "./molecules/NoteTextEditor";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";

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

const notesService = new NotesService();
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
    const { isMobile } = useScreen();
    const showToast = useGlobalToast();
    const [title, setTitle] = useState(note?.title ?? "");
    const [content, setContent] = useState(note?.content ?? "");
    const [items, setItems] = useState<NoteItemDraft[]>(() => note?.items.map((item) => ({ ...item })) ?? []);
    const [draftType, setDraftType] = useState<NoteType>(note?.type ?? initialType);
    const [hasTypeToggled, setHasTypeToggled] = useState(false);
    const [saving, setSaving] = useState(false);
    const isCreating = note === null;
    const isLocalItemEditing = isCreating || hasTypeToggled;

    function toggleType(newType: NoteType): void {
        if (newType === draftType) return;
        setHasTypeToggled(true);
        if (draftType === "text") {
            setItems(markdownToChecklist(content));
        } else {
            setContent(checklistToMarkdown(items));
        }
        setDraftType(newType);
    }

    async function saveNote(): Promise<void> {
        if (!title.trim()) {
            showToast({ severity: "warn", summary: "Le titre est obligatoire." });
            return;
        }
        setSaving(true);
        try {
            const shouldReplaceItems = hasTypeToggled || note?.type !== "checklist";
            const savedNote = isCreating
                ? await notesService.create({
                    title: title.trim(),
                    type: draftType,
                    ...(draftType === "text"
                        ? { content }
                        : { items }
                    ),
                })
                : await notesService.update(note.id, {
                    title: title.trim(),
                    type: draftType,
                    ...(draftType === "text"
                        ? { content }
                        : shouldReplaceItems
                            ? { items }
                            : {})
                });
            onSaved(savedNote);
            showToast({ severity: "success", summary: isCreating ? "Note créée." : "Note modifiée." });
            onClose();
        } catch {
            showToast({ severity: "error", summary: "Impossible d'enregistrer la note." });
        } finally {
            setSaving(false);
        }
    }

    async function addChecklistItem(newItemLabel: string): Promise<boolean> {
        const label = newItemLabel.trim();
        if (!label) return false;
        if (isLocalItemEditing) {
            setItems((current) => [...current, { label }]);
            return true;
        }
        try {
            const item = await notesService.addItem(note.id, { label });
            setItems((current) => [...current, item]);
            onItemChanged(note.id, item);
            return true;
        } catch {
            showToast({ severity: "error", summary: "Impossible d'ajouter l'élément." });
            return false;
        }
    }

    async function changeItem(item: NoteItemDraft, index: number, changes: Partial<CreateNoteItemInput>): Promise<void> {
        const nextItem = { ...item, ...changes };
        if (isLocalItemEditing) {
            setItems((current) => current.map((entry, entryIndex) =>
                item.id !== undefined ? entry.id === item.id ? nextItem : entry : entryIndex === index ? nextItem : entry
            ));
            return;
        }
        if (item.id === undefined) return;
        setItems((current) => current.map((entry) => entry.id === item.id ? nextItem : entry));
        try {
            const updated = await notesService.updateItem(note.id, item.id, changes);
            onItemChanged(note.id, updated);
        } catch {
            setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
            showToast({ severity: "error", summary: "Impossible de modifier l'élément." });
        }
    }

    async function saveItemLabel(item: NoteItemDraft, label: string): Promise<void> {
        if (isLocalItemEditing || !note) return;
        if (item.id === undefined) return;
        const savedItem = note.items.find((entry) => entry.id === item.id);
        if (!savedItem) return;
        const normalizedLabel = label.trim();
        if (!normalizedLabel) {
            setItems((current) => current.map((entry) => entry.id === item.id
                ? { ...entry, label: savedItem.label }
                : entry));
            return;
        }
        if (normalizedLabel === savedItem.label) return;
        setItems((current) => current.map((entry) => entry.id === item.id
            ? { ...entry, label: normalizedLabel }
            : entry));
        try {
            const updated = await notesService.updateItem(note.id, savedItem.id, { label: normalizedLabel });
            onItemChanged(note.id, updated);
        } catch {
            setItems((current) => current.map((entry) => entry.id === savedItem.id
                ? { ...entry, label: savedItem.label }
                : entry));
            showToast({ severity: "error", summary: "Impossible de modifier l'élément." });
        }
    }

    async function removeItem(item: NoteItemDraft, index: number): Promise<void> {
        if (isLocalItemEditing) {
            setItems((current) => current.filter((entry, itemIndex) =>
                item.id !== undefined ? entry.id !== item.id : itemIndex !== index
            ));
            return;
        }
        if (!note || item.id === undefined) return;
        try {
            await notesService.deleteItem(note.id, item.id);
            setItems((current) => current.filter((entry) => entry.id !== item.id));
            onItemDeleted(note.id, item.id);
        } catch {
            showToast({ severity: "error", summary: "Impossible de supprimer l'élément." });
        }
    }

    async function deleteNote(): Promise<void> {
        if (!note) return;
        try {
            await notesService.delete(note.id);
            onDeleted(note.id);
            onClose();
        } catch {
            showToast({ severity: "error", summary: "Impossible de supprimer la note." });
        }
    }

    const header = (
        <div className="flex flex-row gap-2 justify-between w-full">
            <h2 className="text-lg font-semibold">{isCreating ? "Nouvelle note" : "Modifier la note"}</h2>
            <div className="flex gap-2">
                {!isCreating && (
                    <>
                        <Button
                            tooltip={note.isArchived ? "Désarchiver" : "Archiver"}
                            className="py-0 h-8 w-8"
                            icon={note.isArchived ? "pi pi-inbox" : "pi pi-box"}
                            severity="secondary"
                            rounded text
                            onClick={() => onArchive(note)}
                        />
                        <Button
                            tooltip={"Supprimer"}
                            className="py-0 h-8 w-8"
                            icon="pi pi-trash"
                            severity="danger"
                            rounded text
                            onClick={() => {
                                confirmDialog({
                                    message: 'Voulez-vous vraiment supprimer cette note ?',
                                    header: 'Confirmation de suppression',
                                    defaultFocus: 'accept',
                                    acceptClassName: 'p-button-danger',
                                    accept: () => deleteNote(),
                                });
                            }}
                        />
                        <ConfirmDialog />
                    </>
                )}
            </div>
        </div>
    )

    const footer = (
        <div className="flex flex-wrap justify-end gap-2">
            <Button label="Fermer" text onClick={onClose} />
            <Button
                label={isCreating ? "Créer" : "Enregistrer"}
                icon="pi pi-check"
                loading={saving}
                disabled={!title.trim()}
                onClick={() => void saveNote()}
            />
        </div>
    );

    return (
        <Dialog
            visible
            onHide={onClose}
            header={header}
            footer={footer}
            className={isMobile
                ? "m-0 h-dvh max-h-dvh w-screen max-w-none rounded-none"
                : "w-[min(42rem,90vw)]"
            }
            contentClassName="max-h-[70dvh] overflow-y-auto"
            draggable={false}
            dismissableMask={!saving}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center">
                    <InputText
                        autoFocus
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Titre"
                        maxLength={255}
                        aria-label="Titre de la note"
                        className="grow text-lg font-semibold"
                    />
                    <SelectButton
                        value={draftType}
                        options={[
                            { label: "Texte", value: "text", icon: "pi pi-align-left" },
                            { label: "Checklist", value: "checklist", icon: "pi pi-check-square" }
                        ]}
                        itemTemplate={(item) => (
                            <span className="flex items-center gap-2">
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </span>
                        )}
                        allowEmpty={false}
                        onChange={(e) => toggleType(e.value)}
                        aria-label="Changer le type de note"
                    />
                </div>


                {draftType === "text" ? (
                    <NoteTextEditor value={content} onChange={setContent} />
                ) : (
                    <NoteChecklistEditor
                        items={items}
                        onItemChecked={(item, index, checked) => void changeItem(item, index, { isChecked: checked })}
                        onItemLabelChange={(index, label) => setItems((current) => current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, label } : entry
                        ))}
                        onItemLabelBlur={(item, label) => void saveItemLabel(item, label)}
                        onItemRemove={(item, index) => void removeItem(item, index)}
                        onAddItem={addChecklistItem}
                    />
                )}
            </div>
        </Dialog>
    );
}
