import { CreateStockUnitDto } from "../../../../services/stocks/dto/CreateStockUnitDto";
import { DataTable } from "primereact/datatable";
import { Column, ColumnEvent } from "primereact/column";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockUnitEditableListExpansionTemplate from "./StockUnitEditableListExpansionTemplate";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { dateEditor, dropdownEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import StockUnitsService from "@/services/stocks/StockUnitsService";

const stockLocationService = new StockLocationService();
const stockUnitsService = new StockUnitsService();

export interface StockUnitGroup {
    key: string;
    stockUnits: CreateStockUnitDto[];
    quantity: number;
    unit: string;
    expirationDate?: Date;
    locationId: number;
}

interface StockUnitEditableListProps {
    stockItemId?: number;
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

export default function StockUnitEditableList({
    stockItemId,
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
     * Recharge les stockUnits depuis la DB.
     *
     * Le tableau local n'est donc jamais considéré comme source de vérité
     * après une mutation persistée.
     */
    const reloadStockUnits = async () => {
        if (!stockItemId) {
            return;
        }

        const units = await stockUnitsService.getStockUnitsByItemId(stockItemId);

        onChange(
            units.map((unit) => ({
                id: unit.id,
                clientId: crypto.randomUUID(),
                locationId: unit.locationId,
                quantity: unit.quantity,
                unit: unit.unit,
                expirationDate: unit.expirationDate ?? undefined,
            }))
        );
    };

    const addStockUnit = async () => {
        if (!stockItemId) {
            return;
        }

        const temporaryClientId = crypto.randomUUID();

        const newUnit: CreateStockUnitDto = {
            id: undefined,
            clientId: temporaryClientId,
            locationId: 0,
            quantity: 1,
            unit: "",
            expirationDate: undefined,
        };

        onChange([...stockUnits, newUnit]);
    };

    const duplicateStockUnit = async (clientId: string) => {
        if (!stockItemId) {
            return;
        }

        const stockUnit = stockUnits.find(
            (unit) => unit.clientId === clientId
        );

        if (!stockUnit) {
            return;
        }

        /**
         * La duplication est une vraie création DB.
         * On ne donne donc jamais l'id de la ligne originale au backend.
         */
        const createdUnit = await stockUnitsService.create(
            stockItemId,
            stockUnit
        );

        /**
         * On recharge plutôt que de bricoler le tableau local.
         * Cela garantit que l'ID DB retourné et les données persistées
         * deviennent immédiatement la source de vérité.
         */
        await reloadStockUnits();

        return createdUnit;
    };

    const deleteStockUnit = (clientId: string) => {
        const stockUnit = stockUnits.find(
            (unit) => unit.clientId === clientId
        );

        if (!stockUnit) {
            return;
        }

        confirmDialog({
            message: "Voulez-vous vraiment supprimer cette stockUnit ?",
            header: "Supprimer la stockUnit",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Supprimer",
            rejectLabel: "Annuler",
            acceptClassName: "p-button-danger",

            accept: async () => {
                /**
                 * Une nouvelle ligne n'existe pas encore en DB :
                 * il suffit donc de la retirer localement.
                 */
                if (stockUnit.id === undefined) {
                    onChange(
                        stockUnits.filter(
                            (unit) => unit.clientId !== clientId
                        )
                    );
                    return;
                }

                await stockUnitsService.delete(stockUnit.id);
                await reloadStockUnits();
            },
        });
    };

    const updateStockUnit = async (
        clientId: string,
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

        /**
         * Une ligne sans ID DB est une création.
         */
        if (currentStockUnit.id === undefined) {
            await stockUnitsService.create(
                stockItemId,
                updatedStockUnit
            );
        } else {
            await stockUnitsService.update(
                currentStockUnit.id,
                stockItemId,
                updatedStockUnit
            );
        }

        await reloadStockUnits();
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

        const updatedUnits = group.stockUnits.map((stockUnit) => ({
            ...stockUnit,
            [event.field]: event.newValue,
        }));

        for (const stockUnit of updatedUnits) {
            if (stockUnit.id === undefined) {
                await stockUnitsService.create(
                    stockItemId,
                    stockUnit
                );
            } else {
                await stockUnitsService.update(
                    stockUnit.id,
                    stockItemId,
                    stockUnit
                );
            }
        }

        await reloadStockUnits();
    };

    const groupActionsTemplate = (group: StockUnitGroup) => {
        const firstEntry = group.stockUnits[0];

        if (!firstEntry) {
            return null;
        }

        return (
            <div className="flex items-center gap-1">
                <Button
                    icon="pi pi-copy"
                    text
                    rounded
                    severity="secondary"
                    tooltip="Dupliquer"
                    disabled={!stockItemId}
                    onClick={() =>
                        duplicateStockUnit(firstEntry.clientId)
                    }
                />

                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    tooltip="Supprimer"
                    onClick={() =>
                        deleteStockUnit(firstEntry.clientId)
                    }
                />
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <ConfirmDialog />

            <div className="flex justify-end">
                <Button
                    label="Ajouter une stockUnit"
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
                        stockUnitGroup={group}
                        stockLocations={stockLocations}
                        updateStockUnit={updateStockUnit}
                        duplicateStockUnit={duplicateStockUnit}
                        deleteStockUnit={deleteStockUnit}
                    />
                )}
                editMode="cell"
                emptyMessage="Rien dans le stock :("
                size="small"
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
                    body={(group) => group.stockUnits[0].unit}
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
                    body={(group) => {
                        const locationLabel =
                            stockLocations.find(
                                (location) =>
                                    location.id ===
                                    group.stockUnits[0].locationId
                            )?.label;

                        return (
                            locationLabel ??
                            group.stockUnits[0].locationId
                        );
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