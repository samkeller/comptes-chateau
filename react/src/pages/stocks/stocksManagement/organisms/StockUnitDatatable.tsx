import { useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Timeline } from "primereact/timeline";
import { format, parseISO } from "date-fns";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockMovement from "@/interfaces/stocks/StockMovement";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockUnitSummary from "../molecules/StockUnitSummary";
import StockItem from "@/interfaces/stocks/StockItem";

interface StockUnitDatatableProps {
    units: StockItem[];
    loading: boolean;
    onTake: (unit: StockUnit) => void;
}

const stockService = new StockItemsService();

export default function StockUnitDatatable({ units, loading, onTake }: StockUnitDatatableProps) {
    // const [expandedRows, setExpandedRows] = useState<StockUnit[]>([]);
    // const [movementsByItemId, setMovementsByItemId] = useState<Record<number, StockMovement[] | "loading" | "error">>({});

    // function loadHistory(unit: StockUnit): void {
    //     if (movementsByItemId[unit.itemId]) {
    //         return;
    //     }

    //     setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: "loading" }));
    //     stockService.getItemHistory(unit.itemId)
    //         .then((movements) => setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: movements })))
    //         .catch(() => setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: "error" })));
    // }


    return (
        <FillRemainingHeight>
            <></>
            <DataTable
                value={units}
                size="small"
                // expandedRows={expandedRows}
                // onRowToggle={(event) => setExpandedRows(event.data as StockUnit[])}
                // onRowExpand={(event) => loadHistory(event.data as StockUnit)}
                // rowExpansionTemplate={(unit: StockUnit) => renderHistory(unit)}
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit disponible"
            >
                {/* <Column expander style={{ width: "4rem" }} /> */}
                <Column
                    field="label"
                    header="Produit"
                />

            </DataTable>
        </FillRemainingHeight>
    );
}
