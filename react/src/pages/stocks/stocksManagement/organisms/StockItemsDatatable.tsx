import { useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockItem from "@/interfaces/stocks/StockItem";
import StockItemUnitsView from "./StockItemUnitsView";

interface StockItemsDatatableProps {
    units: StockItem[];
    loading: boolean;
    // onTake: (unit: StockItem) => void; TODO ?
}

const stockService = new StockItemsService();

export default function StockItemsDatatable({ units, loading }: StockItemsDatatableProps) {
    const [expandedRows, setExpandedRows] = useState<StockItem[]>([]);

    const stockUnitExpansionTemplate = (unit: StockItem) => {
        return <StockItemUnitsView stockItemId={unit.id} />
    }

    return (
        <FillRemainingHeight>
            <DataTable
                value={units}
                size="small"
                // Expanded rows
                expandedRows={expandedRows}
                onRowToggle={(event) => setExpandedRows(event.data as StockItem[])}
                // onRowExpand={(event) => loadHistory(event.data as StockUnit)}
                rowExpansionTemplate={stockUnitExpansionTemplate}
                
                // Scroll
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit disponible"
            >
                <Column expander style={{ width: "4rem" }} />
                <Column
                    field="label"
                    header="Produit"
                    body={(item: StockItem) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold">{item.label}</span>
                        </div>
                    )}
                />
                <Column
                    header="Compte"
                    field="stockUnitsCount"

                />
            </DataTable>
        </FillRemainingHeight>
    );
}
