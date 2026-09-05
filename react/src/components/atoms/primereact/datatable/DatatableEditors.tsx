import type { ColumnEditorOptions } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputNumber, InputNumberProps } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

export const textEditor = (options: ColumnEditorOptions) => (
    <InputText
        value={options.value ?? ""}
        onChange={(event) => options.editorCallback?.(event.target.value)}
    />
);

export const numberEditor = (options: ColumnEditorOptions, InputProps?: Omit<InputNumberProps, "value" | "onValueChange">) => (
    <InputNumber
        value={options.value ?? 0}
        onValueChange={(event) => options.editorCallback?.(event.value)}
        {...InputProps}
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

type DropdownOptions = string[] | SelectOption[];

/**
 * Editor générique pour les colonnes PrimeReact utilisant un Dropdown.
 *
 * Deux formats d'options sont supportés :
 * - `string[]` : lorsque la valeur affichée est directement la valeur métier.
 * - `SelectOption[]` : lorsque le libellé affiché et la valeur métier sont distincts.
 *  Dans ce cas, `optionLabel` et `optionValue` doivent être fournis pour indiquer les propriétés correspondantes.
 *
 * @param options - Options d'édition fournies par PrimeReact.
 * @param dropdownOptions - Options affichées dans le Dropdown.
 *
 * @example
 * // Valeur et libellé identiques
 * dropdownEditor(options, ["g", "kg", "L"]);
 *
 * @example
 * // Valeur métier différente du libellé
 * dropdownEditor(
 *     options,
 *     stockLocations,
 * );
 */
export const dropdownEditor = (
    options: ColumnEditorOptions,
    dropdownOptions: DropdownOptions
) => {
    const isDropdownOptionsStringArray = (options: DropdownOptions): options is string[] => {
        return options.length === 0 || typeof options[0] === "string";
    }

    return (
        <Dropdown
            value={options.value}
            options={dropdownOptions}
            {...(isDropdownOptionsStringArray(dropdownOptions)
                ? {}
                : { optionLabel: "label", optionValue: "id" }
            )}
            onChange={(event) => options.editorCallback?.(event.value)}
        />
    );
};
