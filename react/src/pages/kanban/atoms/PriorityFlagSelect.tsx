import { Button } from "primereact/button";
import { KANBAN_TASK_PRIORITIES, type KanbanTaskPriority } from "@chocosous/shared";
import { useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { ListBox } from "primereact/listbox";
import PriorityFlag, { getPriorityColor, getPriorityLabel } from "./PriorityFlag";
import { SelectItem } from "primereact/selectitem";

interface PriorityFlagSelectProps {
    priority: KanbanTaskPriority,
    onChange: (priority: KanbanTaskPriority) => void
    btnClassName?: string
}

export default function PriorityFlagSelect({ priority, onChange, btnClassName }: PriorityFlagSelectProps) {

    const op = useRef<OverlayPanel>(null);
    const [showMenu, setShowMenu] = useState(false);

    const menuData: SelectItem[] = KANBAN_TASK_PRIORITIES.map(v => {
        return {
            label: getPriorityLabel(v),
            value: v
        } as SelectItem
    })

    return (
        <>
            <Button
                icon={`pi pi-flag-fill`}
                className={btnClassName}
                style={{ color: getPriorityColor(priority) }}
                text
                rounded
                size="small"
                tooltip="Priorité"
                onClick={(e) => {
                    setShowMenu(!showMenu);
                    op.current?.toggle(e);
                }}
            />
            <OverlayPanel ref={op}>
                <ListBox
                    className="border-0 text-xs"
                    value={priority}
                    onChange={v => {
                        v.value && onChange(v.value)
                        op.current?.hide();
                    }}
                    options={menuData}
                    itemTemplate={option => <PriorityFlag priority={option.value} />}
                    pt={{
                        list: { className: "flex gap-2" },
                    }}
                />
            </OverlayPanel>
        </>
    )
}