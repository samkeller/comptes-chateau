import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockUnitSummary from "../molecules/StockUnitSummary";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { showGlobalToast } from "@/services/GlobalToast";
import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";

interface StockItemUnitsViewProps {
    stockItemId: number;
}

const stockUnitsService = new StockUnitsService()

export default function StockItemUnitsView({ stockItemId }: StockItemUnitsViewProps) {
    const [units, setUnits] = useState<StockUnit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        loadStockUnits(stockItemId);
    }, [stockItemId]);

    const loadStockUnits = async (itemId: number) => {
        setLoading(true);
        stockUnitsService.getStockUnitsByItemId(itemId)
            .then((units) => {
                console.log(units)
                setUnits(units);
            })
            .catch((error) => {
                showGlobalToast({
                    severity: "error",
                    summary: "Erreur",
                    detail: "Impossible de charger les unités du stock",
                })
            })
            .finally(() => {
                setLoading(false);
            });
    }

    /**
     * TODO ONTAKE
     * @param unit 
     */
    const onTake = (unit: StockUnit) => { }

    const expirationDateBodyTemplate = (expirationDate: Date) => {
        /**
         * Severity :
         * - Vert: La date est dans plus de deux semaines
         * - Orange: La date est dans moins de deux semaines
         * - Rouge: La date est dépassée
         */
        const severity = (() => {
            const now = new Date();
            const twoWeeksFromNow = new Date();
            twoWeeksFromNow.setDate(now.getDate() + 14);

            if (expirationDate > twoWeeksFromNow)
                return "green";
            else if (expirationDate > now)
                return "orange";
            else
                return "red";
        })();

        return (
            <div className="flex flex-col gap-1">
                <span>{parseDateToDisplay(expirationDate)}</span>
                <span className={`text-${severity}-500`}>{formatDistanceToNow(expirationDate)}</span>
            </div>
        )
    }

    return (
        <FillRemainingHeight>
            <DataTable
                value={units}
                size="small"
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit disponible"
            >
                <Column
                    header="Résumé"
                    body={(unit: StockUnit) => (
                        <div className="flex flex-col gap-1 text-sm">
                            {unit.createdAt && <span>{`Créé le ${parseDateToDisplay(unit.createdAt)}`}</span>}
                            {unit.updatedAt && <span>{`Mis à jour le ${parseDateToDisplay(unit.updatedAt)}`}</span>}
                        </div>
                    )}
                />
                <Column
                    header="Expiration"
                    field="expirationDate"
                    body={(unit: StockUnit) => (
                        unit.expirationDate
                            ? expirationDateBodyTemplate(unit.expirationDate)
                            : "-"
                    )}
                />
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
