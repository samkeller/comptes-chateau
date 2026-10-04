import type { CreateNoteItemInput } from "@chocosous/shared";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { useState } from "react";

export type NoteItemDraft = CreateNoteItemInput & { id?: number };

interface NoteChecklistEditorProps {
    items: NoteItemDraft[];
    onItemChecked: (item: NoteItemDraft, index: number, checked: boolean | undefined) => void;
    onItemLabelChange: (index: number, label: string) => void;
    onItemLabelBlur: (item: NoteItemDraft, label: string) => void;
    onItemRemove: (item: NoteItemDraft, index: number) => void;
    onAddItem: (label: string) => Promise<boolean>;
}

export default function NoteChecklistEditor({
    items,
    onItemChecked,
    onItemLabelChange,
    onItemLabelBlur,
    onItemRemove,
    onAddItem,
}: NoteChecklistEditorProps) {
    const [newItemLabel, setNewItemLabel] = useState("");

    async function handleAddItem(): Promise<void> {
        if (await onAddItem(newItemLabel)) {
            setNewItemLabel("");
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="font-medium">Liste</label>
            {items.map((item, index) => (
                <div key={item.id ?? `draft-${index}`} className="flex items-center gap-2">
                    <Checkbox
                        inputId={`note-item-${index}`}
                        checked={item.isChecked ?? false}
                        onChange={(event) => onItemChecked(item, index, event.checked)}
                    />
                    <InputText
                        value={item.label}
                        onChange={(event) => onItemLabelChange(index, event.target.value)}
                        onBlur={(event) => onItemLabelBlur(item, event.currentTarget.value)}
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
                        onClick={() => onItemRemove(item, index)}
                    />
                </div>
            ))}
            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleAddItem();
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
                    rounded text
                    aria-label="Ajouter un élément"
                    disabled={!newItemLabel.trim()}
                />
            </form>
        </div>
    );
}
