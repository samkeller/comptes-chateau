import { Button } from "primereact/button";
import { KANBAN_TASK_PRIORITIES, KanbanTaskPriority } from "../../../interfaces/kanban/KanbanTaskPriority";
import { useMemo, useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { ListBox } from "primereact/listbox";
import PriorityFlag, { getPriorityLabel } from "./PriorityFlag";
import { SelectItem } from "primereact/selectitem";

interface PriorityFlagSelectProps {
    priority: KanbanTaskPriority,
    onChange: (priority: KanbanTaskPriority) => void
}


function getPriorityColorSeverity(priority: KanbanTaskPriority): "danger" | "info" | undefined {
    if (priority === "high")
        return "danger";
    if (priority === "low")
        return "info";
}

export default function PriorityFlagSelect({ priority, onChange }: PriorityFlagSelectProps) {

    const op = useRef<OverlayPanel>(null);
    const [showMenu, setShowMenu] = useState(false);
    const severity = useMemo(() => getPriorityColorSeverity(priority), [priority]);

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
                severity={severity}
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
                    className="border-none"
                    value={priority}
                    onChange={v => {
                        v.value && onChange(v.value)
                        op.current?.hide();
                    }}
                    options={menuData}
                    itemTemplate={option => <PriorityFlag priority={option.value} />}
                    pt={{
                        item: {
                            className: "inline"
                        }
                    }}
                />
            </OverlayPanel>
        </>
    )
}