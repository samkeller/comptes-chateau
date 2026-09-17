import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import { StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import StockLocation from "@/interfaces/stocks/StockLocation";
import StockLocationService from "@/services/stocks/StockLocationService";
import { useStockUnitsEditor } from "../hooks/useStockUnitsEditor";
import StockUnitCard from "../molecules/StockUnitCard";

const stockLocationService = new StockLocationService();

interface StockUnitEditableListMobileProps {
    stockItemId: number;
    stockItemLabel: string;
    stockItemUnit: StockUnitUnits;
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

/**
 * Version mobile de la liste des unités de stock : une carte par unité, sans regroupement ni grille éditable.
 */
export default function StockUnitEditableListMobile({
    stockItemId,
    stockItemLabel,
    stockItemUnit,
    stockUnits,
    onChange,
}: StockUnitEditableListMobileProps) {
    const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);

    useEffect(() => {
        stockLocationService.listLocations().then(setStockLocations);
    }, []);

    const { addStockUnit, updateStockUnit, deleteStockUnitOptimistic } = useStockUnitsEditor({
        stockItemId,
        stockItemUnit,
        stockUnits,
        stockLocations,
        onChange,
    });

    return (
        <div className="flex flex-col gap-3">
            <ConfirmDialog />

            <Button
                label="Ajouter du stock"
                icon="pi pi-plus"
                disabled={!stockItemId || stockLocations.length === 0}
                onClick={addStockUnit}
            />

            {stockUnits.length === 0 && (
                <span className="text-sm text-surface-500">Rien dans le stock :(</span>
            )}

            {stockUnits.map((stockUnit) => (
                <StockUnitCard
                    key={stockUnit.clientId}
                    stockItemId={stockItemId}
                    stockItemLabel={stockItemLabel}
                    stockUnit={stockUnit}
                    stockLocations={stockLocations}
                    onUpdate={(updated) => updateStockUnit(stockUnit.clientId, updated)}
                    onDuplicate={(newUnit) => onChange([...stockUnits, newUnit])}
                    onDelete={() => deleteStockUnitOptimistic(stockUnit.clientId)}
                />
            ))}
        </div>
    );
}
