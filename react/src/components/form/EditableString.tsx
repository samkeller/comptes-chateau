
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tooltip } from "primereact/tooltip";
import { KeyboardEvent, useEffect, useId, useState } from "react";

interface EditableStringProps {
    value: string;
    onValidate: (newValue: string) => void | Promise<void>;
    emptyLabel?: string;
    className?: string;
    disabled?: boolean;
}

export default function EditableString({
    value,
    onValidate,
    emptyLabel = "-",
    className,
    disabled = false,
}: EditableStringProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const id = useId();
    const customTooltipClass = "editable-string-tooltip-" + id.replace(/:/g, "-");

    useEffect(() => {
        if (!isEditing) {
            setDraftValue(value);
        }
    }, [value, isEditing]);

    const startEdition = () => {
        if (disabled) {
            return;
        }
        setDraftValue(value);
        setIsEditing(true);
    };

    const cancelEdition = () => {
        setDraftValue(value);
        setIsEditing(false);
    };

    const validateEdition = async () => {
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        try {
            await onValidate(draftValue);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            void validateEdition();
            return;
        }
        if (event.key === "Escape") {
            cancelEdition();
        }
    };

    if (isEditing) {
        return (
            <div className={"w-full flex align-items-center gap-2 " + (className ?? "")}>
                <InputText
                    className="w-full px-2 py-1"
                    value={draftValue}
                    onChange={(event) => setDraftValue(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    autoFocus
                    disabled={isSaving}
                />
                <Button
                    text
                    icon="pi pi-check"
                    tooltip="Valider"
                    tooltipOptions={{ position: "top" }}
                    onClick={() => {
                        void validateEdition();
                    }}
                    loading={isSaving}
                    className={"py-0 h-2rem w-2rem"}
                    disabled={isSaving}
                />
                <Button
                    text
                    icon="pi pi-times"
                    tooltip="Annuler"
                    tooltipOptions={{ position: "top" }}
                    onClick={cancelEdition}
                    className={"py-0 h-2rem w-2rem"}
                    disabled={isSaving}
                />
            </div>
        );
    }

    return (
        <div
            className={"w-full flex align-items-center justify-content-between gap-2 " + (className ?? "")}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <span>{value.trim().length > 0 ? value : emptyLabel}</span>
            <>
                <Tooltip target={"." + customTooltipClass} position="top" />
                <Button
                    text
                    rounded
                    icon="pi pi-pencil"
                    visible={isHovering && !disabled}
                    onClick={startEdition}
                    className={"py-0 h-2rem w-2rem " + customTooltipClass}
                    data-pr-tooltip="Modifier"
                />
            </>
        </div>
    );
}