import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column, type ColumnEditorOptions, type ColumnEvent } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { STOCK_UNIT_UNITS, type StockItemWithLotsDto, type StockLotDto } from "@chocosous/shared";
import { dropdownEditor, numberEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import { showGlobalToast } from "@/services/GlobalToast";
import StockEntryService from "@/services/stocks/StockEntryService";
import { parseApiDate } from "@/utils/DatesUtils";
import { duplicateLotEntry, editLotEntry, type StockLotInlineChanges } from "@/utils/stocks/stockEntryDraft";
import DeleteStockUnitButton from "../atoms/DeleteStockUnitButton";
import StockExpiryDateTag from "../atoms/StockExpiryDateTag";
import TakeStockUnitButton from "../atoms/TakeStockUnitButton";

const entryService = new StockEntryService();

/** Une ligne par lot ; un produit épuisé garde une ligne (sans lot) pour rester visible. */
interface StockLotRow {
    key: string;
    itemId: number;
    item: StockItemWithLotsDto;
    lot: StockLotDto | null;
    copies: number | null;
    quantity: number | null;
    unit: string | null;
    locationId: number | null;
    expirationDate: Date | null;
}

type EditableField = "copies" | "quantity" | "unit" | "locationId" | "expirationDate";

function toRows(items: StockItemWithLotsDto[]): StockLotRow[] {
    return items.flatMap((item): StockLotRow[] => item.lots.length === 0
        ? [{ key: `item-${item.id}`, itemId: item.id, item, lot: null, copies: null, quantity: null, unit: null, locationId: null, expirationDate: null }]
        : item.lots.map((lot) => ({
            key: `lot-${lot.unitIds[0]}`,
            itemId: item.id,
            item,
            lot,
            copies: lot.unitIds.length,
            quantity: lot.quantity,
            unit: lot.unit,
            locationId: lot.locationId,
            expirationDate: parseApiDate(lot.expirationDate),
        })));
}

function sameValue(a: unknown, b: unknown): boolean {
    if (a instanceof Date || b instanceof Date) {
        return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    }
    return a === b;
}

/** Valide et convertit la valeur saisie dans une cellule ; `null` si elle est refusée. */
function toInlineChanges(field: EditableField, value: unknown): StockLotInlineChanges | null {
    switch (field) {
        case "copies":
            return typeof value === "number" && Number.isInteger(value) && value >= 1 ? { copies: value } : null;
        case "quantity":
            return typeof value === "number" && value > 0 ? { quantity: value } : null;
        case "unit":
            return typeof value === "string" && (STOCK_UNIT_UNITS as readonly string[]).includes(value)
                ? { unit: value as StockLotInlineChanges["unit"] }
                : null;
        case "locationId":
            return typeof value === "number" ? { locationId: value } : null;
        case "expirationDate":
            return value === null || value instanceof Date ? { expirationDate: value } : null;
    }
}

interface StockItemsTableProps {
    items: StockItemWithLotsDto[];
    locations: StockLocation[];
    emptyMessage: string;
    onEditItem: (item: StockItemWithLotsDto) => void;
    onAddToItem: (item: StockItemWithLotsDto) => void;
    /** Appelé après toute modification du stock (édition en cellule, prise, ajout, suppression). */
    onChanged: () => void;
}

/**
 * Tableau des stocks : un groupe par produit, une ligne par lot.
 * Exemplaires, contenu, unité, lieu et péremption se corrigent directement dans la cellule.
 */
export default function StockItemsTable({ items, locations, emptyMessage, onEditItem, onAddToItem, onChanged }: StockItemsTableProps) {
    const rows = toRows(items);

    const saveCell = async (event: ColumnEvent): Promise<void> => {
        const row = event.rowData as StockLotRow;
        const field = event.field as EditableField;
        if (!row.lot || sameValue(event.value, event.newValue)) return;
        const changes = toInlineChanges(field, event.newValue);
        if (!changes) {
            showGlobalToast({ severity: "warn", summary: "Valeur refusée", detail: "La quantité et le nombre d'exemplaires doivent être positifs." });
            return;
        }
        try {
            await entryService.save(editLotEntry(row.item, row.lot, changes));
            onChanged();
        } catch {
            // Erreur affichée par l'intercepteur ; la liste rechargée affichera la valeur en base.
            onChanged();
        }
    };

    const duplicate = async (row: StockLotRow): Promise<void> => {
        if (!row.lot) return;
        try {
            await entryService.save(duplicateLotEntry(row.item, row.lot));
            showGlobalToast({ severity: "success", summary: `${row.item.label} : 1 exemplaire ajouté` });
            onChanged();
        } catch {
            // Erreur affichée par l'intercepteur.
        }
    };

    const lotEditor = (render: (options: ColumnEditorOptions) => React.ReactNode) => (options: ColumnEditorOptions) =>
        (options.rowData as StockLotRow).lot ? render(options) : <span className="text-gray-500">—</span>;

    const lotBody = (render: (row: StockLotRow, lot: StockLotDto) => React.ReactNode) => (row: StockLotRow) =>
        row.lot ? render(row, row.lot) : <span className="text-gray-500">—</span>;

    const groupHeader = (row: StockLotRow) => (
        <div className="flex items-center gap-3">
            {row.item.imageUrl && (
                <img src={row.item.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy"
                    className="h-8 w-8 shrink-0 rounded object-contain" />
            )}
            <div className="min-w-0 flex-1">
                <span className="font-semibold">{row.item.label}</span>
                <span className="ml-2 text-sm text-gray-500">
                    {row.item.brand && <>{row.item.brand} · </>}
                    {row.item.stockUnitsCount > 0 ? `${row.item.stockUnitsCount} en stock` : "Épuisé"}
                </span>
            </div>
            <Button icon="pi pi-plus" rounded text aria-label={`Ajouter du stock : ${row.item.label}`}
                tooltip="Ajouter" tooltipOptions={{ position: "top" }} onClick={() => onAddToItem(row.item)} />
            <Button icon="pi pi-pencil" rounded text severity="secondary" aria-label={`Modifier ${row.item.label}`}
                tooltip="Modifier le produit" tooltipOptions={{ position: "top" }} onClick={() => onEditItem(row.item)} />
        </div>
    );

    return (
        <DataTable value={rows} dataKey="key" editMode="cell" size="small"
            rowGroupMode="subheader" groupRowsBy="itemId" rowGroupHeaderTemplate={groupHeader}
            responsiveLayout="stack" breakpoint="768px" emptyMessage={emptyMessage}>
            <Column field="copies" header="Exemplaires" style={{ width: "8rem" }}
                body={lotBody((_row, lot) => `${lot.unitIds.length} ×`)}
                editor={lotEditor((options) => numberEditor(options, { min: 1, max: 1000, inputClassName: "w-20" }))}
                onCellEditComplete={(event) => void saveCell(event)} />
            <Column field="quantity" header="Contenu" style={{ width: "9rem" }}
                body={lotBody((_row, lot) => lot.quantity)}
                editor={lotEditor((options) => numberEditor(options, { min: 0, maxFractionDigits: 3, inputClassName: "w-24" }))}
                onCellEditComplete={(event) => void saveCell(event)} />
            <Column field="unit" header="Unité" style={{ width: "8rem" }}
                body={lotBody((_row, lot) => lot.unit)}
                editor={lotEditor((options) => dropdownEditor(options, [...STOCK_UNIT_UNITS]))}
                onCellEditComplete={(event) => void saveCell(event)} />
            <Column field="locationId" header="Lieu"
                body={lotBody((_row, lot) => lot.locationLabel)}
                editor={lotEditor((options) => dropdownEditor(options, locations))}
                onCellEditComplete={(event) => void saveCell(event)} />
            <Column field="expirationDate" header="Péremption" style={{ width: "11rem" }}
                body={lotBody((_row, lot) => <StockExpiryDateTag lot={lot} />)}
                editor={lotEditor((options) => (
                    <Calendar value={options.value as Date | null} dateFormat="dd/mm/yy" showButtonBar placeholder="Sans date"
                        inputClassName="w-28" onChange={(event) => options.editorCallback?.(event.value instanceof Date ? event.value : null)} />
                ))}
                onCellEditComplete={(event) => void saveCell(event)} />
            <Column header="" style={{ width: "9rem" }} body={lotBody((row, lot) => (
                <div className="flex justify-end">
                    <TakeStockUnitButton unitId={lot.unitIds[0]} unitLabel={row.item.label} afterTakeUnit={onChanged} />
                    <Button icon="pi pi-clone" rounded text
                        aria-label={`Ajouter un exemplaire identique : ${row.item.label}`}
                        tooltip="Ajouter un exemplaire identique" tooltipOptions={{ position: "top" }}
                        onClick={() => void duplicate(row)} />
                    <DeleteStockUnitButton itemLabel={row.item.label} unitId={lot.unitIds[lot.unitIds.length - 1]}
                        afterDeleteUnit={onChanged} />
                </div>
            ))} />
        </DataTable>
    );
}
