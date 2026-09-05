import { useState, useEffect } from "react";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { showGlobalToast } from "@/services/GlobalToast";
import TakeStockUnitButton from "../../atoms/TakeStockUnitButton";

interface StockItemUnitsViewProps {
    stockItemId: number;
    afterRemoveStockUnitOptimistic?(unitId: number, locationId: number): void;
}

const stockUnitsService = new StockUnitsService()

export default function StockItemUnitsView({ stockItemId, afterRemoveStockUnitOptimistic }: StockItemUnitsViewProps) {
    const [units, setUnits] = useState<StockUnit[]>([]);

    useEffect(() => {
        loadStockUnits(stockItemId);
    }, [stockItemId]);

    const loadStockUnits = async (itemId: number) => {
        stockUnitsService.getStockUnitsByItemId(itemId)
            .then((units) => {
                setUnits(units);
            })
            .catch(() => {
                showGlobalToast({
                    severity: "error",
                    summary: "Erreur",
                    detail: "Impossible de charger les unités du stock",
                })
            });
    }

    /**
     * Supprime de manière optimiste une unité de stock de la liste locale et notifie le parent si nécessaire.
     * @param unitId 
     */
    const removeStockUnitOptimistic = (unitId: number, locationId: number) => {
        setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== unitId));
        afterRemoveStockUnitOptimistic?.(unitId, locationId);
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
                    const firstUnit = groupedUnits[expirationDate][0];
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
                            
                            <TakeStockUnitButton
                                unitId={firstUnit.id}
                                unitLabel={firstUnit.item.label}
                                afterTakeUnit={() => removeStockUnitOptimistic(firstUnit.id, firstUnit.locationId)}
                            />
                        </div>
                    );
                })}
        </div>
    );
}
