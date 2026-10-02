import { useEffect, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import type StockItem from "@/interfaces/stocks/StockItem";
import StockItemsService from "@/services/stocks/StockItemsService";
import { Button } from "primereact/button";

interface StockItemAutocompleteProps {
    className?: string;
    refreshKey?: number;
    onChange: (value: string) => void;
    onSelect: (stockItem: StockItem | null) => void;
}

const stockItemService = new StockItemsService();

export default function StockItemAutocomplete({
    className,
    refreshKey,
    onChange,
    onSelect,
}: StockItemAutocompleteProps) {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [stockItemSearch, setStockItemSearch] = useState("");
    const [suggestions, setSuggestions] = useState<StockItem[]>([]);
    /** Dans le cas d'une édition, enregistre le label d'"origine" pour toujours l'afficher*/
    const [originalLabel, setOriginalLabel] = useState("");

    useEffect(() => {
        stockItemService.getAllStockItems().then((data) => {
            setStockItems(data);
        });
    }, [refreshKey]);

    const completeMethod = (event: { query: string }) => {
        const query = event.query.toLowerCase();

        setSuggestions(
            stockItems.filter((item) =>
                item.label.toLowerCase().includes(query)
            )
        );
    };

    const clearSelection = () => {
        setStockItemSearch("");
        setOriginalLabel("");
        onChange("");
        onSelect(null);
    };

    const selectAutocompleteItem = (stockItem: StockItem) => {
        setStockItemSearch(stockItem.label);
        setOriginalLabel(stockItem.label);
        onSelect(stockItem);
    };

    return (
        <div className="relative">
            <AutoComplete
                className={className}
                inputClassName="w-full"
                value={stockItemSearch}
                suggestions={suggestions}
                field="label"
                completeMethod={completeMethod}
                onChange={(event) => {
                    // Vérifie qu'on ne trigger pas le onSelect
                    const value = event.value;

                    if (typeof value === "string") {
                        setStockItemSearch(value);
                        onChange(value);
                    }
                }}
                onSelect={(event) => selectAutocompleteItem(event.value as StockItem)}
            />
            {originalLabel && stockItemSearch !== originalLabel && (
                <div className="pointer-events-none absolute right-12 top-1/2 max-w-[calc(100%-3.5rem)] -translate-y-1/2 truncate px-1 text-sm text-gray-500 line-through">
                    {originalLabel}
                </div>
            )}
            <Button
                icon="pi pi-times"
                tooltip="Réinitialiser"
                rounded text
                size="small"
                onClick={clearSelection}
                disabled={stockItemSearch === ""}
                className="absolute! right-1 top-1/2 -translate-y-1/2"
            />
        </div>
    );
}
