import { Column, ColumnEditorOptions } from "primereact/column";
import { StockUnitGroup } from "./StockUnitEditableList";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { dateEditor, dropdownEditor, numberEditor, textEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import { parseDateToDisplay } from "@/utils/DatesUtils";

interface StockUnitEditableListExpansionTemplateProps {
    stockUnitGroup: StockUnitGroup;
    stockUnitGroups: StockUnitGroup[];
    stockLocations: StockLocation[];
    updateStockUnit: (index: number, newData: CreateStockUnitDto) => void;
    duplicateStockUnit: (index: number) => void;
    deleteStockUnit: (index: number) => void;
}
/**
* Contenu affiché lorsqu'un groupe est déplié.
* On affiche alors les stock units individuelles qui composent le groupe.
*/
export default function StockUnitEditableListExpansionTemplate({
    stockUnitGroup,
    stockUnitGroups,
    stockLocations,
    updateStockUnit,
    duplicateStockUnit,
    deleteStockUnit
}: StockUnitEditableListExpansionTemplateProps) {

    /**
     * Valide l'édition d'une ligne individuelle.
     */
    const onRowEditComplete = (event: any) => {
        const {
            index,
            newData,
        }: {
            index: number;
            newData: CreateStockUnitDto;
        } = event;

        const group = stockUnitGroups.find((group) =>
            group.stockUnits.some((entry) => entry.index === index)
        );

        if (!group) {
            return;
        }

        const entry = group.stockUnits.find(
            (stockUnitEntry) => stockUnitEntry.index === index
        );

        if (!entry) {
            return;
        }

        updateStockUnit(entry.index, newData);
    };


    return (
        <div className="p-3">
            <DataTable
                value={stockUnitGroup.stockUnits}
                editMode="row"
                dataKey="index"
                onRowEditComplete={onRowEditComplete}
                size="small"
            >
                <Column
                    field="stockUnit.quantity"
                    header="Quantité"
                    body={(entry) => entry.stockUnit.quantity}
                    editor={numberEditor}
                />

                <Column
                    field="stockUnit.unit"
                    header="Unité"
                    body={(entry) => entry.stockUnit.unit}
                    editor={(options: ColumnEditorOptions) => dropdownEditor(options, [...STOCK_UNIT_UNITS])}
                />
                <Column
                    field="stockUnit.expirationDate"
                    header="Expiration"
                    body={(entry) =>
                        entry.stockUnit.expirationDate
                            ? parseDateToDisplay(entry.stockUnit.expirationDate)
                            : "-"
                    }
                    editor={dateEditor}
                />
                <Column
                    field="stockUnit.locationId"
                    header="Emplacement"
                    body={(entry) => {
                        const label = stockLocations.find((location) => location.id === entry.stockUnit.locationId)?.label;
                        return label ?? entry.stockUnit.locationId;
                    }}
                    editor={(options: ColumnEditorOptions) => dropdownEditor(options, stockLocations)}
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
                    body={(entry) => (
                        <div className="flex items-center gap-1">
                            <Button
                                icon="pi pi-copy"
                                text
                                rounded
                                severity="secondary"
                                tooltip="Dupliquer"
                                onClick={() =>
                                    duplicateStockUnit(entry.index)
                                }
                            />

                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                tooltip="Supprimer"
                                onClick={() =>
                                    deleteStockUnit(entry.index)
                                }
                            />
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
};  