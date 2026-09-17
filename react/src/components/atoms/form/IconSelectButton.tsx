import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { useState } from "react";

interface IconSelectButtonData {
    /**
     * Icone affichée.
     */
    icon: string;

    /**
     * Valeur du bouton.
     */
    value: string;
}

interface IconSelectButtonProps {
    options: IconSelectButtonData[];
    defaultValue?: string;
    onSelected(selected: string): void;
}

export default function IconSelectButton({ options, onSelected, defaultValue, }: IconSelectButtonProps) {
    const [value, setValue] = useState<string>(defaultValue ?? options[0]?.value);

    const iconDisplayTemplate = (option: IconSelectButtonData) => {
        return <i className={option.icon} />;
    };

    const handleChange = (e: SelectButtonChangeEvent) => {
        if (e.value == null) {
            return;
        }

        onSelected(e.value);
        setValue(e.value);
    };

    return (
        <SelectButton
            value={value}
            options={options}
            optionLabel="value"
            optionValue="value"
            itemTemplate={iconDisplayTemplate}
            onChange={handleChange}
        />
    );
}
