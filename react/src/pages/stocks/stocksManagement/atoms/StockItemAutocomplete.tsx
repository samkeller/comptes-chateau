import { useEffect, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import type StockItem from "@/interfaces/stocks/StockItem";
import StockItemsService from "@/services/stocks/StockItemsService";

interface StockItemAutocompleteProps {
    className?: string;
    onChange: (value: string) => void;
    onSelect: (stockItem: StockItem) => void;
}

const stockItemService = new StockItemsService();

export default function StockItemAutocomplete({
    className,
    onChange,
    onSelect,
}: StockItemAutocompleteProps) {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [stockItemSearch, setStockItemSearch] = useState("");
    const [suggestions, setSuggestions] = useState<StockItem[]>([]);

    useEffect(() => {
        stockItemService.getAllStockItems().then((data) => {
            setStockItems(data);
        });
    }, []);

    const completeMethod = (event: { query: string }) => {
        const query = event.query.toLowerCase();

        setSuggestions(
            stockItems.filter((item) =>
                item.label.toLowerCase().includes(query)
            )
        );
    };

    return (
        <AutoComplete
            className={className}
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
            onSelect={(event) => {
                const stockItem = event.value as StockItem;

                setStockItemSearch(stockItem.label);
                onSelect(stockItem);
            }}
        />
    );
}
