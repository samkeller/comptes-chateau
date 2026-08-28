import { useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Timeline } from "primereact/timeline";
import { format, parseISO } from "date-fns";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockMovement from "@/interfaces/stocks/StockMovement";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockService from "@/services/stocks/StockService";
import StockUnitSummary from "../molecules/StockUnitSummary";

interface StockLocationItemsViewProps {
    units: StockUnit[];
    loading: boolean;
    onTake: (unit: StockUnit) => void;
}

const stockService = new StockService();

export default function StockLocationItemsView({ units, loading, onTake }: StockLocationItemsViewProps) {
    const [expandedRows, setExpandedRows] = useState<StockUnit[]>([]);
    const [movementsByItemId, setMovementsByItemId] = useState<Record<number, StockMovement[] | "loading" | "error">>({});

    function loadHistory(unit: StockUnit): void {
        if (movementsByItemId[unit.itemId]) {
            return;
        }

        setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: "loading" }));
        stockService.getItemHistory(unit.itemId)
            .then((movements) => setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: movements })))
            .catch(() => setMovementsByItemId((previous) => ({ ...previous, [unit.itemId]: "error" })));
    }

    function renderHistory(unit: StockUnit) {
        const movements = movementsByItemId[unit.itemId];

        if (movements === "loading") {
            return <span className="text-sm text-surface-500">Chargement de l'historique...</span>;
        }

        if (movements === "error") {
            return <span className="text-sm text-red-500">Impossible de charger l'historique.</span>;
        }

        if (!movements || movements.length === 0) {
            return <span className="text-sm text-surface-500">Aucun mouvement pour ce produit.</span>;
        }

        return (
            <Timeline
                value={movements}
                opposite={(movement: StockMovement) => (
                    <span className="text-xs whitespace-nowrap">
                        {format(parseISO(movement.occurredAt), "dd/MM/yyyy HH:mm")}
                    </span>
                )}
                marker={(movement: StockMovement) => (
                    <span className={`pi ${movement.type === "IN" ? "pi-arrow-circle-up text-green-600" : "pi-arrow-circle-down text-red-500"}`} />
                )}
                content={(movement: StockMovement) => (
                    <span className="text-sm">
                        {movement.type === "IN" ? "+" : "-"}{movement.quantity} {unit.unit}
                        {movement.source && <span className="text-surface-400"> - {movement.source}</span>}
                    </span>
                )}
            />
        );
    }

    return (
        <FillRemainingHeight>
            <DataTable
                value={units}
                size="small"
                expandedRows={expandedRows}
                onRowToggle={(event) => setExpandedRows(event.data as StockUnit[])}
                onRowExpand={(event) => loadHistory(event.data as StockUnit)}
                rowExpansionTemplate={(unit: StockUnit) => renderHistory(unit)}
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
