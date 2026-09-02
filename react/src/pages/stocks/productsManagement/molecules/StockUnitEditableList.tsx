import { CreateStockUnitDto } from "../../../../services/stocks/dto/CreateStockUnitDto";
import { DataTable } from "primereact/datatable";
import { Column, ColumnEvent } from "primereact/column";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockUnitEditableListExpansionTemplate from "./StockUnitEditableListExpansionTemplate";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { dateEditor, dropdownEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import { STOCK_UNIT_UNITS, StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import TakeStockUnitButton from "../../atoms/TakeStockUnitButton";
import DeleteStockUnitButton from "../../atoms/DeleteStockUnitButton";
import DuplicateStockUnitButton from "../../atoms/DuplicateStockUnitButton";
import StockUnit from "@/interfaces/stocks/StockUnit";
import { showGlobalToast } from "@/services/GlobalToast";
import { Uuid } from "@chocosous/shared";

const stockLocationService = new StockLocationService();
const stockUnitsService = new StockUnitsService();

export interface StockUnitGroup {
    key: string;
    stockUnits: CreateStockUnitDto[];
    quantity: number;
    unit: StockUnitUnits;
    expirationDate?: Date;
    locationId: number;
}

interface StockUnitEditableListProps {
    stockItemId: number;
    stockItemLabel: string;
    stockItemUnit: StockUnitUnits;
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

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

    const stockUnitGroups = useMemo<StockUnitGroup[]>(() => {
        const groups = new Map<string, StockUnitGroup>();

        stockUnits.forEach((stockUnit) => {
            const key = JSON.stringify({
                locationId: stockUnit.locationId,
                quantity: stockUnit.quantity,
                unit: stockUnit.unit,
                expirationDate: stockUnit.expirationDate?.getTime() ?? null,
            });

            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.stockUnits.push(stockUnit);
            } else {
                groups.set(key, {
                    key,
                    stockUnits: [stockUnit],
                    quantity: stockUnit.quantity,
                    unit: stockUnit.unit,
                    expirationDate: stockUnit.expirationDate,
                    locationId: stockUnit.locationId,
                });
            }
        });

        return Array.from(groups.values());
    }, [stockUnits]);

    /**
     * Retournes un stockUnit vide.
     * - ClientId unique
     * - LocationId construit à partir du tableau de stockLocations (selec)
     * - unit qui vient de stockUnit
     * @returns 
     */
    const EMPTY_STOCK_UNIT = (): CreateStockUnitDto => {
        return {
            clientId: crypto.randomUUID(),
            locationId: stockLocations[0].id,
            quantity: 1,
            unit: stockItemUnit,
        };
    };

    const addStockUnit = async () => {
        if (!stockItemId) {
            return;
        }

        onChange([...stockUnits, EMPTY_STOCK_UNIT()]);
    };

    /**
     * Retirer une stockUnit des tableaux.
     * Optimistic rendering
     */
    const deleteStockUnitOptimistic = async (clientId: Uuid) => {
        // 1. Vérifie qu'elle existe
        const stockUnit = stockUnits.find(
            (unit) => unit.clientId === clientId
        );

        if (!stockUnit) {
            return;
        }

        // 2. Si existe -> rm (optimistic rendering)
        onChange(
            stockUnits.filter(
                (unit) => unit.clientId !== clientId
            )
        );
    };

    const updateStockUnit = async (
        clientId: Uuid,
        updatedStockUnit: CreateStockUnitDto
    ) => {
        if (!stockItemId) {
            return;
        }

        const currentStockUnit = stockUnits.find(
            (unit) => unit.clientId === clientId
        );

        if (!currentStockUnit) {
            return;
        }

        let savedUnit: StockUnit;

        // Si pas d'ID -> Création
        if (currentStockUnit.id === undefined) {
            savedUnit = await stockUnitsService.create(
                stockItemId,
                updatedStockUnit
            );
        }
        // Si un ID -> Mis à jour
        else {
            savedUnit = await stockUnitsService.update(
                currentStockUnit.id,
                stockItemId,
                updatedStockUnit
            );
        }

        const savedDto: CreateStockUnitDto = {
            id: savedUnit.id,
            clientId: currentStockUnit.clientId ?? crypto.randomUUID(),
            locationId: savedUnit.locationId,
            quantity: savedUnit.quantity,
            unit: savedUnit.unit,
            expirationDate: savedUnit.expirationDate ?? undefined,
        };

        onChange(
            stockUnits.map((unit) =>
                unit.clientId === clientId ? savedDto : unit
            )
        );
    };

    /**
     * Modification d'un groupe :
     * chaque stockUnit du groupe est mise à jour individuellement en DB.
     */
    const onGroupCellEditComplete = async (event: ColumnEvent) => {
        if (!stockItemId) {
            return;
        }

        const group = event.rowData as StockUnitGroup;

        const updatedUnits: CreateStockUnitDto[] = group.stockUnits.map((stockUnit) => ({
            ...stockUnit,
            [event.field]: event.newValue,
        }));

        const savedDtos: CreateStockUnitDto[] = await Promise.all(
            updatedUnits.map(async (stockUnit) => {
                let savedUnit: StockUnit;

                if (stockUnit.id === undefined) {
                    savedUnit = await stockUnitsService.create(
                        stockItemId,
                        stockUnit
                    );
                } else {
                    savedUnit = await stockUnitsService.update(
                        stockUnit.id,
                        stockItemId,
                        stockUnit
                    );
                }

                return {
                    id: savedUnit.id,
                    clientId: stockUnit.clientId ?? crypto.randomUUID(), // On ne génère un clientId qu'en modification
                    locationId: savedUnit.locationId,
                    quantity: savedUnit.quantity,
                    unit: savedUnit.unit,
                    expirationDate: savedUnit.expirationDate ?? undefined,
                };
            })
        );

        /**
         * Map chaque DTO en utilisant son clientId comme clé.
         */
        const dtoMap = new Map(savedDtos.map((dto) => [dto.clientId, dto]));

        onChange(
            stockUnits.map((unit) => dtoMap.get(unit.clientId) ?? unit)
        );

    };

    const groupActionsTemplate = (group: StockUnitGroup) => {
        const firstEntry = group.stockUnits[0];

        if (!firstEntry) {
            return null;
        }

        return (
            <div className="flex items-center gap-1">
                {group.stockUnits.length === 1 && (
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
                    group.stockUnits.length === 1 && <>
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
                    disabled={!stockItemId}
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
                        group.stockUnits.length > 1
                    }
                    style={{
                        width: "3rem",
                    }}
                />

                <Column
                    field="quantity"
                    header="Quantité"
                    body={(group: StockUnitGroup) => {
                        const firstStockUnit = group.stockUnits[0];

                        if (group.stockUnits.length === 1) {
                            return firstStockUnit.quantity;
                        }

                        return (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                    {group.stockUnits.length} ×
                                </span>

                                <span>
                                    {firstStockUnit.quantity}
                                </span>
                            </div>
                        );
                    }}
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