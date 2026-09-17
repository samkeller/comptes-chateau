import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import TakeStockUnitButton from "../../atoms/TakeStockUnitButton";
import DeleteStockUnitButton from "../../atoms/DeleteStockUnitButton";
import DuplicateStockUnitButton from "../../atoms/DuplicateStockUnitButton";

interface StockUnitCardProps {
    stockItemId: number;
    stockItemLabel: string;
    stockUnit: CreateStockUnitDto;
    stockLocations: StockLocation[];
    onUpdate: (updated: CreateStockUnitDto) => void;
    onDuplicate: (newUnit: CreateStockUnitDto) => void;
    onDelete: () => void;
}

/**
 * Carte tactile pour une unité de stock : pas de regroupement ni d'édition en grille, peu adaptés au mobile.
 */
export default function StockUnitCard({
    stockItemId,
    stockItemLabel,
    stockUnit,
    stockLocations,
    onUpdate,
    onDuplicate,
    onDelete,
}: StockUnitCardProps) {
    return (
        <div className="flex flex-col gap-3 rounded border-2 border-surface p-3">
            <div className="flex items-center gap-2">
                <InputNumber
                    inputClassName="flex-none! w-3/6!"
                    value={stockUnit.quantity}
                    onValueChange={(event) => onUpdate({ ...stockUnit, quantity: event.value ?? 0 })}
                    showButtons
                />
                <Dropdown
                    className="flex-1"
                    value={stockUnit.unit}
                    options={[...STOCK_UNIT_UNITS]}
                    onChange={(event) => onUpdate({ ...stockUnit, unit: event.value })}
                />
            </div>

            <Dropdown
                value={stockUnit.locationId}
                options={stockLocations}
                optionLabel="label"
                optionValue="id"
                placeholder="Emplacement"
                onChange={(event) => onUpdate({ ...stockUnit, locationId: event.value })}
            />

            <Calendar
                value={stockUnit.expirationDate ?? null}
                onChange={(event) => onUpdate({ ...stockUnit, expirationDate: event.value ?? undefined })}
                placeholder="Date d'expiration"
                showIcon
            />

            <div className="flex justify-end gap-1">
                {stockUnit.id ? (
                    <>
                        <DuplicateStockUnitButton
                            stockItemId={stockItemId}
                            stockUnit={stockUnit}
                            afterDuplicateUnit={onDuplicate}
                        />
                        <DeleteStockUnitButton
                            unitId={stockUnit.id}
                            unitLabel={stockItemLabel}
                            afterDeleteUnit={onDelete}
                        />
                        <TakeStockUnitButton
                            unitId={stockUnit.id}
                            unitLabel={stockItemLabel}
                            afterTakeUnit={onDelete}
                        />
                    </>
                ) : (
                    <Button label="Ajouter" icon="pi pi-plus" onClick={() => onUpdate(stockUnit)} />
                )}
            </div>
        </div>
    );
}
