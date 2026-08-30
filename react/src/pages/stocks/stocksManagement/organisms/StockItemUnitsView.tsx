import { useState, useEffect } from "react";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { showGlobalToast } from "@/services/GlobalToast";
import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";
import { Button } from "primereact/button";

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

    /**
     * Groupe ensemble les StockUnit qui ont la même date d'expiration
     * Ici, tous les items ont le même label, etc
     * @returns Un objet où chaque clé est une date d'expiration et la valeur est un tableau de StockUnit ayant cette date d'expiration
     */
    const groupedUnits = units.reduce((acc: { [key: string]: StockUnit[] }, unit) => {
        const expirationDate = unit.expirationDate ? new Date(unit.expirationDate).toISOString().split('T')[0] : "Aucune date d'expiration";
        if (!acc[expirationDate]) {
            acc[expirationDate] = [];
        }
        acc[expirationDate].push(unit);
        return acc;
    }, {});

    return (
        <div>

            {
                groupedUnits && Object.keys(groupedUnits).map((expirationDate) => {
                    const count = groupedUnits[expirationDate].length;
                    return (
                        <div
                            key={expirationDate}
                            className="flex justify-between items-center gap-4"
                        >
                            <div className="flex flex-col">

                                <h3>{expirationDate}</h3>
                                <span>
                                    {count === 1 ? "1 unité" : `${count} unités`}
                                </span>
                            </div>
                            <Button label="Prendre" icon="pi pi-check" size="small" onClick={() => onTake(groupedUnits[expirationDate][0])} />

                        </div>
                    );
                })}
            {/* <DataTable
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
                    )}
                />
            </DataTable> */}
        </div>
    );
}
