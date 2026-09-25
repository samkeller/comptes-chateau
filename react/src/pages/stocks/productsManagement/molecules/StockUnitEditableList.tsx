import { CreateStockUnitDto } from "../../../../services/stocks/dto/CreateStockUnitDto";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import StockUnitEditableListExpansionTemplate from "./StockUnitEditableListExpansionTemplate";
import { dateEditor, dropdownEditor, numberEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import { STOCK_UNIT_UNITS, StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import TakeStockUnitButton from "../../atoms/TakeStockUnitButton";
import DeleteStockUnitButton from "../../atoms/DeleteStockUnitButton";
import DuplicateStockUnitButton from "../../atoms/DuplicateStockUnitButton";
import StockLocation from "@/interfaces/stocks/StockLocation";
import StockLocationService from "@/services/stocks/StockLocationService";
import { useStockUnitsEditor, StockUnitGroup } from "../hooks/useStockUnitsEditor";

const stockLocationService = new StockLocationService();

interface StockUnitEditableListProps {
    stockItemId: number;
    stockItemLabel: string;
    stockItemUnit: StockUnitUnits;
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

/**
 * Affichage desktop : DataTable avec regroupement des unités identiques et édition en cellule.
 */
export default function StockUnitEditableList({
    stockItemId,
    stockItemLabel,
    stockItemUnit,
    stockUnits,
    onChange,
}: StockUnitEditableListProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);

    useEffect(() => {
        stockLocationService.listLocations().then(setStockLocations);
    }, []);

    const {
        stockUnitGroups,
        isMultipleUnits,
        addStockUnit,
        updateStockUnit,
        deleteStockUnitOptimistic,
        onGroupCellEditComplete,
    } = useStockUnitsEditor({
        stockItemId,
        stockItemUnit,
        stockUnits,
        stockLocations,
        onChange,
    });

    const groupActionsTemplate = (group: StockUnitGroup) => {
        const firstEntry = group.stockUnits[0];

        if (!firstEntry) {
            return null;
        }

        return (
            <div className="flex items-center gap-1">
                {!isMultipleUnits(group) && (
                    <DuplicateStockUnitButton
                        stockItemId={stockItemId}
                        stockUnit={firstEntry}
                        afterDuplicateUnit={(newUnit) => {
                            onChange([...stockUnits, newUnit]);
                        }}
                    />
                )}

                {
                    firstEntry.id &&
                    !isMultipleUnits(group) && <>
                        <DeleteStockUnitButton
                            unitId={firstEntry.id}
                            unitLabel={stockItemLabel}
                            afterDeleteUnit={() => deleteStockUnitOptimistic(firstEntry.clientId)}
                        />
                        <TakeStockUnitButton
                            unitId={firstEntry.id}
                            unitLabel={stockItemLabel}
                            afterTakeUnit={() => deleteStockUnitOptimistic(firstEntry.clientId)}
                        />
                    </>
                }
                {
                    !firstEntry.id && (
                        // Boutton sauvegarder quand on vient de le créer.
                        <Button
                            label="Ajouter"
                            icon="pi pi-plus"
                            onClick={() => updateStockUnit(firstEntry.clientId, firstEntry)}
                        />
                    )
                }
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <ConfirmDialog />

            <div className="flex justify-end">
                <Button
                    label="Ajouter du stock"
                    icon="pi pi-plus"
                    disabled={!stockItemId || stockLocations.length === 0}
                    onClick={addStockUnit}
                />
            </div>

            <DataTable
                value={stockUnitGroups}
                dataKey="key"
                expandedRows={expandedRows}
                onRowToggle={(event) => {
                    setExpandedRows(
                        event.data as Record<string, boolean>
                    );
                }}
                rowExpansionTemplate={(group) => (
                    <StockUnitEditableListExpansionTemplate
                        stockItemId={stockItemId}
                        stockItemLabel={stockItemLabel}
                        stockUnitGroup={group}
                        stockLocations={stockLocations}
                        updateStockUnit={updateStockUnit}
                        afterDuplicateStockUnit={(newUnit) => {
                            onChange([...stockUnits, newUnit]);
                        }}
                        afterDeleteStockUnit={deleteStockUnitOptimistic}
                    />
                )}
                editMode="cell"
                emptyMessage="Rien dans le stock :("
                size="small"
                loading={stockLocations.length === 0} // Nécessaire pour la col "Emplacement".
            >
                <Column
                    expander={(group: StockUnitGroup) =>
                        isMultipleUnits(group)
                    }
                    style={{
                        width: "3rem",
                    }}
                />

                <Column
                    field="quantity"
                    header="Stock"
                    body={(group: StockUnitGroup) => (
                        <span className="font-semibold">
                            {
                                isMultipleUnits(group)
                                    ? `${group.stockUnits.length} x ${group.stockUnits[0].quantity} ${group.stockUnits[0].unit}`
                                    : `${group.stockUnits[0].quantity} ${group.stockUnits[0].unit}`
                            }
                        </span>
                    )}
                    className="cursor-pointer"
                    editor={(opts) => numberEditor(opts, {suffix: ` ${opts.rowData.stockUnits[0].unit}`})}
                    onCellEditComplete={onGroupCellEditComplete}
                />

                <Column
                    field="unit"
                    header="Unité"
                    body={(group: StockUnitGroup) => group.stockUnits[0].unit}
                    className="cursor-pointer"
                    editor={(opts) =>
                        dropdownEditor(
                            opts,
                            [...STOCK_UNIT_UNITS]
                        )
                    }
                    onCellEditComplete={onGroupCellEditComplete}
                />

                <Column
                    field="expirationDate"
                    header="Expiration"
                    body={(group) => {
                        const expirationDate =
                            group.stockUnits[0].expirationDate;

                        return expirationDate
                            ? expirationDate.toLocaleDateString("fr-FR")
                            : "-";
                    }}
                    className="cursor-pointer"
                    editor={dateEditor}
                    onCellEditComplete={onGroupCellEditComplete}
                />

                <Column
                    field="locationId"
                    header="Emplacement"
                    body={(group: StockUnitGroup) => {
                        const locationLabel = stockLocations.find(
                            (location) => location.id === group.stockUnits[0].locationId
                        )?.label;
                        return locationLabel;
                    }}
                    className="cursor-pointer"
                    editor={(opts) =>
                        dropdownEditor(
                            opts,
                            stockLocations
                        )
                    }
                    onCellEditComplete={onGroupCellEditComplete}
                />

                <Column
                    header="Actions"
                    body={groupActionsTemplate}
                />
            </DataTable>
        </div>
    );
}