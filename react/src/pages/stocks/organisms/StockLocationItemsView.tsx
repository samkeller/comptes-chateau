import { useOutletContext } from "react-router-dom";
import { ProgressSpinner } from "primereact/progressspinner";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import { useScreen } from "@/hooks/useScreen";
import { StockItemsOutletContext } from "@/pages/stocks/StockItemsOutletContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useState } from "react";
import StockItem from "@/interfaces/stocks/StockItem";
import { format } from "date-fns";
import { Button } from "primereact/button";
import StockQuantityBodyTemplate from "../atoms/StockQuantityBodyTemplate";

export default function StockLocationItemsView() {
    // TODO: check mobile
    const { isDesktop } = useScreen();
    const { items, loading, onShowHistory, onEdit, onDelete } =
        useOutletContext<StockItemsOutletContext>();
    const [expandedRows, setExpandedRows] = useState<StockItem[]>([]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <ProgressSpinner />
            </div>
        );
    }

    if (items.length === 0) {
        return <div className="text-surface-500">Aucun produit dans ce lieu.</div>;
    }

    const itemExpansionTemplate = (item: StockItem) => (
        <div className="flex flex-col gap-1 text-sm text-surface-500">
            {item.barcode && <span>Code-barres : {item.barcode}</span>}
            {item.expirationDate && <span>Péremption : {format(item.expirationDate, "dd/MM/yyyy")}</span>}
            {item.imageUrl && <span className="truncate">Image : {item.imageUrl}</span>}
        </div>
    );


    return (
        <FillRemainingHeight>
            {/* {itemsGrid} */}
            <DataTable
                value={items}
                size="small"

                // Expansion
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data as StockItem[])}
                rowExpansionTemplate={itemExpansionTemplate}

                // Scrollable
                scrollable
                scrollHeight={"flex"}
                className="pb-4 w-full"
            >
                <Column expander={true} style={{ width: '5rem' }} />
                <Column
                    header="Produit"
                    field="label"
                    className="grow"
                    body={(d) => (
                        <StockQuantityBodyTemplate
                            data={d}
                            // TODO / ERR: onEdit =/= modifier un objet mais ouvrir une dialog. A corriger !
                            onQuantityChange={(newQuantity) => onEdit({ ...d, currentQuantity: newQuantity })}
                        />
                    )}
                />
                <Column
                    header="Péremption"
                    field="expirationDate"
                    body={(item) => item.expirationDate && format(item.expirationDate, "dd/MM/yyyy")}
                />
                <Column
                    header="Actions"
                    body={(item) => (
                        <div className="flex gap-1 min-w-0">
                            <Button icon="pi pi-pencil" text rounded aria-label="Modifier" onClick={() => onEdit(item)} />
                            <Button icon="pi pi-history" text rounded aria-label="Historique" onClick={() => onShowHistory(item)} />
                            <Button
                                icon="pi pi-trash"
                                rounded text
                                severity="danger"
                                onClick={() => onDelete(item)}
                            />

                        </div>

                    )}
                />
            </DataTable>
        </FillRemainingHeight>
    );
}
