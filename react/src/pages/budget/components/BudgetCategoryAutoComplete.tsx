import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { useMemo, useState } from "react";

interface BudgetCategoryAutoCompleteProps {
    value: string;
    categories: string[];
    onChange: (value: string) => void;
    inputId?: string;
}

export default function BudgetCategoryAutoComplete({
    value = "",
    categories,
    onChange,
    inputId,
}: BudgetCategoryAutoCompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const normalizedCategories = useMemo(
        () => categories
            .map((category) => category.trim())
            .filter((category) => category.length > 0),
        [categories],
    );

    const completeCategorySearch = (event: AutoCompleteCompleteEvent): void => {
        const query = event.query.trim().toLowerCase();

        if (query.length === 0) {
            setSuggestions(normalizedCategories.slice(0, 8));
            return;
        }

        setSuggestions(
            normalizedCategories
                .filter((category) => category.toLowerCase().includes(query))
                .slice(0, 8),
        );
    };

    return (
        <AutoComplete
            inputId={inputId}
            value={value}
            suggestions={suggestions}
            completeMethod={completeCategorySearch}
            onChange={(event) => onChange(String(event.value ?? ""))}
            forceSelection={false}
            dropdown
            className="w-full"
        />
    );
}
