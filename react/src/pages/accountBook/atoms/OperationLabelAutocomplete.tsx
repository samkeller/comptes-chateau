import AccountLineRule from "@/interfaces/AccountLineRule";
import AccountLineCategorizationService from "@/services/AccountLineCategorizationService";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { FloatLabel } from "primereact/floatlabel";
import { useState } from "react";

interface OperationLabelAutocompleteProps {
    operationLabel: string;
    changeLabel: (event: string) => void;
    selectOperation: (operation: AccountLineRule) => void;
}

const accountLineCategorizationService = new AccountLineCategorizationService();
   

export default function OperationLabelAutocomplete({
    operationLabel,
    changeLabel,
    selectOperation,
}: OperationLabelAutocompleteProps) {
    const [suggestedOperations, setSuggestedOperations] = useState<AccountLineRule[]>([]);
    
    /**
     *  Cherches les suggestions d'opérations correspondant au pattern fourni (LIKE).
     * @param event 
     */
    async function searchOperationsSuggestions(event: AutoCompleteCompleteEvent): Promise<void> {
        const query = event.query.trim().toLowerCase();
        const results = await accountLineCategorizationService.search(query);

        setSuggestedOperations(results);
    }

    /**
     * Met à jour le label de l'opération et les informations de poste et nature associées à l'opération suggérée.
     * @param event 
     */
    function changeOperationLabelAutocomplete(event: AutoCompleteChangeEvent<string>): void {
        changeLabel(event.value ?? "");

        const matchingPattern = event.value?.toLowerCase();
        console.log("Operation label changed to:", event.value, suggestedOperations.map(op => op.pattern));
        console.log("Suggested operations:", suggestedOperations);
        // Récupères les informations de poste et nature associées à l'opération suggérée
        const suggestedOperation = suggestedOperations.find((op) => op.pattern.toLowerCase() === matchingPattern);
        console.log("Suggested operation:", suggestedOperation);

        if (suggestedOperation) {
            selectOperation(suggestedOperation);
        }
    }
    return (
        <FloatLabel className="flex-1">
            <AutoComplete
                id="operation"
                value={operationLabel}
                onChange={changeOperationLabelAutocomplete}
                completeMethod={searchOperationsSuggestions} // Autocomplete search method
                suggestions={suggestedOperations.map(v => v.label)} // Suggestions autocomplete
                className="w-full"
                inputClassName="w-full"
            />
            <label htmlFor="operation">Opération</label>
        </FloatLabel>
    )
}