import { Column, ColumnEditorOptions } from "primereact/column";
import { StockUnitGroup } from "./StockUnitEditableList";
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
import DeleteStockUnitButton from "../../atoms/DeleteStockUnitButton";
import DuplicateStockUnitButton from "../../atoms/DuplicateStockUnitButton";
import { Uuid } from "@chocosous/shared";

interface StockUnitEditableListExpansionTemplateProps {
    stockItemId: number;
    stockUnitGroup: StockUnitGroup;
    stockItemLabel: string;
    stockLocations: StockLocation[];
    updateStockUnit: (
        clientId: Uuid,
        newData: CreateStockUnitDto
    ) => Promise<void>;
    afterDuplicateStockUnit: (newUnit: CreateStockUnitDto) => void;
    afterDeleteStockUnit: (clientId: Uuid) => void;
}

export default function StockUnitEditableListExpansionTemplate({
    stockItemId,
    stockUnitGroup,
    stockItemLabel,
    stockLocations,
    updateStockUnit,
    afterDuplicateStockUnit,
    afterDeleteStockUnit,
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
                    header="Stock"
                    body={(entry) => entry.quantity}
                    editor={(options: ColumnEditorOptions) => numberEditor(options, {
                        showButtons: true
                    })}
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
                            <DuplicateStockUnitButton
                                stockItemId={stockItemId}
                                stockUnit={entry}
                                afterDuplicateUnit={afterDuplicateStockUnit}
                            />
                            {
                                entry.id && <>
                                    <DeleteStockUnitButton
                                        unitId={entry.id}
                                        unitLabel={stockItemLabel + " - " + entry.quantity + " " + entry.unit}
                                        afterDeleteUnit={() => afterDeleteStockUnit(entry.clientId)}
                                    />
                                    <TakeStockUnitButton
                                        unitId={entry.id}
                                        unitLabel={stockItemLabel + " - " + entry.quantity + " " + entry.unit}
                                        afterTakeUnit={() => afterDeleteStockUnit(entry.clientId)}
                                    />
                                </>
                            }
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
}