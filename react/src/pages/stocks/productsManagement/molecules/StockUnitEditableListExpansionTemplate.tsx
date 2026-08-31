import { Column, ColumnEditorOptions } from "primereact/column";
import { StockUnitGroup } from "./StockUnitEditableList";
import { Button } from "primereact/button";
import {
    DataTable,
    DataTableRowEditCompleteEvent,
} from "primereact/datatable";
import {
    dateEditor,
    dropdownEditor,
    numberEditor,
} from "@/components/atoms/primereact/datatable/DatatableEditors";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import { parseDateToDisplay } from "@/utils/DatesUtils";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import TakeStockUnitButton from "../../atoms/TakeStockUnitButton";

interface StockUnitEditableListExpansionTemplateProps {
    stockUnitGroup: StockUnitGroup;
    stockItemLabel: string;
    stockLocations: StockLocation[];
    updateStockUnit: (
        clientId: string,
        newData: CreateStockUnitDto
    ) => Promise<void>;
    duplicateStockUnit: (clientId: string) => Promise<unknown>;
    deleteStockUnit: (clientId: string) => void;
}

export default function StockUnitEditableListExpansionTemplate({
    stockUnitGroup,
    stockItemLabel,
    stockLocations,
    updateStockUnit,
    duplicateStockUnit,
    deleteStockUnit,
}: StockUnitEditableListExpansionTemplateProps) {
    const onRowEditComplete = async (
        event: DataTableRowEditCompleteEvent
    ) => {
        const newData = event.newData as CreateStockUnitDto;

        await updateStockUnit(
            newData.clientId,
            newData
        );
    };

    return (
        <div className="p-3">
            <DataTable
                value={stockUnitGroup.stockUnits}
                editMode="row"
                dataKey="clientId"
                onRowEditComplete={onRowEditComplete}
                size="small"
                className="border-2 rounded border-surface p-2"
            >
                <Column
                    field="quantity"
                    header="Quantité"
                    body={(entry) => entry.quantity}
                    editor={numberEditor}
                />

                <Column
                    field="unit"
                    header="Unité"
                    body={(entry) => entry.unit}
                    editor={(options: ColumnEditorOptions) =>
                        dropdownEditor(
                            options,
                            [...STOCK_UNIT_UNITS]
                        )
                    }
                />

                <Column
                    field="expirationDate"
                    header="Expiration"
                    body={(entry) =>
                        entry.expirationDate
                            ? parseDateToDisplay(
                                entry.expirationDate
                            )
                            : "-"
                    }
                    editor={dateEditor}
                />

                <Column
                    field="locationId"
                    header="Emplacement"
                    body={(entry) => {
                        const locationLabel =
                            stockLocations.find(
                                (location) =>
                                    location.id ===
                                    entry.locationId
                            )?.label;

                        return (
                            locationLabel ??
                            entry.locationId
                        );
                    }}
                    editor={(options: ColumnEditorOptions) =>
                        dropdownEditor(
                            options,
                            stockLocations
                        )
                    }
                />

                <Column
                    rowEditor
                    headerStyle={{
                        width: "7rem",
                    }}
                    bodyStyle={{
                        textAlign: "center",
                    }}
                />

                <Column
                    header="Actions"
                    body={(entry: CreateStockUnitDto) => (
                        <div className="flex items-center gap-1">
                            <Button
                                icon="pi pi-copy"
                                text
                                rounded
                                severity="secondary"
                                tooltip="Dupliquer"
                                onClick={() =>
                                    duplicateStockUnit(
                                        entry.clientId
                                    )
                                }
                            />

                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                tooltip="Supprimer"
                                onClick={() =>
                                    deleteStockUnit(
                                        entry.clientId
                                    )
                                }
                            />
                            {
                                entry.id &&
                                <TakeStockUnitButton
                                    unitId={entry.id}
                                    unitLabel={stockItemLabel + " - " + entry.quantity + " " + entry.unit}
                                // afterTakeUnit={refresh()}
                                />
                            }
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
}