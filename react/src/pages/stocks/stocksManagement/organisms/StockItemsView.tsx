import { useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockUnitSummary from "../molecules/StockUnitSummary";

interface StockItemsViewProps {
    units: StockUnit[];
    loading: boolean;
    onTake: (unit: StockUnit) => void;
}

export default function StockItemsView({ units, loading, onTake }: StockItemsViewProps) {
    const [expandedRows, setExpandedRows] = useState<StockUnit[]>([]);

    return (
        <FillRemainingHeight>
            <DataTable
                value={units}
                size="small"
                expandedRows={expandedRows}
                onRowToggle={(event) => setExpandedRows(event.data as StockUnit[])}
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit disponible"
            >
                <Column expander style={{ width: "4rem" }} />
                <Column header="Produit" body={(unit: StockUnit) => <StockUnitSummary unit={unit} />} />
                <Column header="Lieu" body={(unit: StockUnit) => unit.location.label} />
                <Column
                    header="Actions"
                    body={(unit: StockUnit) => (
                        <Button label="Prendre" icon="pi pi-check" size="small" onClick={() => onTake(unit)} />
                    )}
                />
            </DataTable>
        </FillRemainingHeight>
    );
}
