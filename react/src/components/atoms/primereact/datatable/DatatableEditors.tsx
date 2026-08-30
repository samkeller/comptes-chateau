import type { ColumnEditorOptions } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { SelectItemOptionsType } from "primereact/selectitem";

export const textEditor = (options: ColumnEditorOptions) => (
    <InputText
        value={options.value ?? ""}
        onChange={(event) => options.editorCallback?.(event.target.value)}
    />
);

export const numberEditor = (options: ColumnEditorOptions) => (
    <InputNumber
        value={options.value ?? 0}
        onValueChange={(event) => options.editorCallback?.(event.value)}
    />
);

export const dateEditor = (options: ColumnEditorOptions) => (
    <Calendar
        value={options.value}
        onChange={(event) => options.editorCallback?.(event.value)}
        showIcon
    />
);

interface SelectOption {
    id: number;
    label: string;
}

/**
 * Editor for a dropdown column in a PrimeReact DataTable.
 * @param options - Column editor options provided by PrimeReact.
 * @param dropdownOptions - Array of options to display in the dropdown.
 */
export const dropdownEditor = (options: ColumnEditorOptions, dropdownOptions: SelectOption[]) => (
    <Dropdown
        value={options.value}
        options={dropdownOptions}
        onChange={(event) => options.editorCallback?.(event.value)}
        optionLabel="label"
        optionValue="id"
    />
);