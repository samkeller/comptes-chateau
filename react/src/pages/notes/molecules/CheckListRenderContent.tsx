import { NoteDto, NoteItemDto } from "@chocosous/shared";
import { Checkbox } from "primereact/checkbox";
import { Chip } from "primereact/chip";

interface CheckListRenderContentProps {
    note: NoteDto;
    toggleItem: (note: NoteDto, item: NoteItemDto) => Promise<void>;
}
export default function CheckListRenderContent({ note, toggleItem }: CheckListRenderContentProps) {
    const unCheckedItems = note.items.filter((item) => !item.isChecked);
    const checkedItems = note.items.filter((item) => item.isChecked);

    const displayLimit = 5;
    /**
     * On prend 5 éléments non chéqués sauf si il y en a moins, auquel cas on prend tous les éléments non cochés.
     */
    const allItems = [...unCheckedItems, ...checkedItems];
    const finalList = allItems.slice(0, displayLimit);

    const displayedUnCheckedCount = finalList.filter((item) => !item.isChecked).length;

    const displayedCheckedCount = finalList.filter((item) => item.isChecked).length;
    const remainingUncheckedCount = unCheckedItems.length - displayedUnCheckedCount;
    const remainingCheckedCount = checkedItems.length - displayedCheckedCount;

    const customInputId = (noteId: number, itemId: number) => `note-${noteId}-item-${itemId}`;

    return (
        <div className="mt-2 flex flex-col">
            {note.items.length === 0 && (
                <span className="py-2 text-sm italic text-surface-500">-</span>
            )}
            {finalList.map((item) => (
                <div
                    key={item.id}
                    className={`
                                flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-1 
                                ${!note.isArchived ? "hover:bg-surface-100" : ""}
                                `}
                    onClick={(event) => {
                        event.stopPropagation()
                        if (note.isArchived) return;
                        toggleItem(note, item)
                    }}
                >
                    <Checkbox
                        inputId={customInputId(note.id, item.id)}
                        checked={item.isChecked}
                        disabled={note.isArchived}
                        className={`h-5 w-5 shrink-0 accent-teal-400 ${!note.isArchived ? "cursor-pointer" : ""}`}
                        aria-label={`${item.isChecked ? "Décocher" : "Cocher"} ${item.label}`}
                    />
                    <label
                        htmlFor={customInputId(note.id, item.id)}
                        className={`line-clamp-2 text-sm ${item.isChecked ? "line-through opacity-60" : ""
                            } ${!note.isArchived ? "cursor-pointer" : ""}`}
                    >
                        {item.label}
                    </label>
                </div>
            ))}
            <div className="mt-1 flex min-w-0 flex-nowrap gap-1 overflow-hidden">
                {remainingUncheckedCount > 0 && (
                    <Chip
                        className="min-w-0 flex-1 text-xs truncate"
                        label={`+${remainingUncheckedCount} restantes`}
                    />
                )}
                {remainingCheckedCount > 0 && (
                    <Chip
                        className="min-w-0 flex-1 text-xs truncate"
                        label={`✓ ${remainingCheckedCount} terminées`}
                    />
                )}
            </div>
        </div>
    );
}