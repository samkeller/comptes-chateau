import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { format } from "date-fns";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockItem from "@/interfaces/stocks/StockItem";
import StockMovement from "@/interfaces/stocks/StockMovement";
import StockService from "@/services/stocks/StockService";
import StockQuantityBodyTemplate from "../molecules/StockQuantityBodyTemplate";
import StockItemExpansionPanel from "../molecules/StockItemExpansionPanel";

interface StockLocationItemsViewProps {
    items: StockItem[];
    loading: boolean;
    onEdit: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    onQuantityChange: (item: StockItem, quantity: number) => void;
}

const stockService = new StockService();

export default function StockLocationItemsView({ items, loading, onEdit, onDelete, onQuantityChange }: StockLocationItemsViewProps) {
    const [expandedRows, setExpandedRows] = useState<StockItem[]>([]);
    const [movementsByItemId, setMovementsByItemId] = useState<Record<number, StockMovement[] | "loading" | "error">>({});
    const previousQuantityByItemId = useRef<Record<number, number>>({});

    function loadHistory(item: StockItem, force = false): void {
        if (!force && movementsByItemId[item.id]) {
            return;
        }

        setMovementsByItemId((prev) => ({ ...prev, [item.id]: "loading" }));
        stockService.getItemHistory(item.id)
            .then((movements) => setMovementsByItemId((prev) => ({ ...prev, [item.id]: movements })))
            .catch(() => setMovementsByItemId((prev) => ({ ...prev, [item.id]: "error" })));
    }

    // Une quantité modifiée (dialog, +/-1, édition inline) invalide l'historique en cache.
    useEffect(() => {
        items.forEach((item) => {
            const previousQuantity = previousQuantityByItemId.current[item.id];
            previousQuantityByItemId.current[item.id] = item.currentQuantity;

            if (previousQuantity === undefined || previousQuantity === item.currentQuantity) {
                return;
            }

            if (expandedRows.some((row) => row.id === item.id)) {
                loadHistory(item, true);
            } else {
                setMovementsByItemId((prev) => {
                    if (!(item.id in prev)) {
                        return prev;
                    }
                    const next = { ...prev };
                    delete next[item.id];
                    return next;
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    const itemExpansionTemplate = (item: StockItem) => (
        <StockItemExpansionPanel item={item} movements={movementsByItemId[item.id]} />
    );


    return (
        <FillRemainingHeight>
            <DataTable
                value={items}
                size="small"

                // Expansion
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data as StockItem[])}
                onRowExpand={(e) => loadHistory(e.data as StockItem)}
                rowExpansionTemplate={itemExpansionTemplate}

                // Scrollable
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit trouvé"
            >
                <Column expander style={{ width: "5rem" }} />
                <Column
                    header="Produit"
                    field="label"
                    className="grow"
                    body={(item: StockItem) => (
                        <StockQuantityBodyTemplate
                            data={item}
                            onQuantityChange={(newQuantity) => onQuantityChange(item, newQuantity)}
                        />
                    )}
                />
                <Column
                    header="Péremption"
                    field="expirationDate"
                    body={(item: StockItem) => item.expirationDate && format(item.expirationDate, "dd/MM/yyyy")}
                />
                <Column
                    header="Actions"
                    body={(item: StockItem) => (
                        <div className="flex gap-1 min-w-0">
                            <Button icon="pi pi-pencil" text rounded aria-label="Modifier" onClick={() => onEdit(item)} />
                            <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Supprimer" onClick={() => onDelete(item)} />
                        </div>
                    )}
                />
            </DataTable>
        </FillRemainingHeight>
    );
}
