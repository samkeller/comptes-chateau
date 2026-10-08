import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column, type ColumnEvent, type ColumnFilterElementTemplateOptions } from "primereact/column";
import { DataTable, type DataTableFilterMeta } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode, type SortOrder } from "primereact/api";
import { InputSwitch } from "primereact/inputswitch";
import { ProgressSpinner } from "primereact/progressspinner";
import { STOCK_UNIT_UNITS, type StockDashboardOverviewDto, type StockExpiryState, type StockItemWithLotsDto, type StockLotDto } from "@chocosous/shared";
import { dropdownEditor, numberEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import InputSearch from "@/components/atoms/primereact/InputSearch";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import { showGlobalToast } from "@/services/GlobalToast";
import StockEntryService from "@/services/stocks/StockEntryService";
import StockItemsService from "@/services/stocks/StockItemsService";
import type { DataTableLazyState } from "@/services/tableQuery/DataTableQueryCodec";
import { parseApiDate } from "@/utils/DatesUtils";
import { duplicateLotEntry, editLotEntry, type StockLotInlineChanges } from "@/utils/stocks/stockEntryDraft";
import DeleteStockUnitButton from "../atoms/DeleteStockUnitButton";
import StockExpiryDateTag from "../atoms/StockExpiryDateTag";
import TakeStockUnitButton from "../atoms/TakeStockUnitButton";
import StockOverviewBar from "../molecules/StockOverviewBar";

const entryService = new StockEntryService();
const itemsService = new StockItemsService();

const EXPIRY_FILTER_OPTIONS: { label: string; value: StockExpiryState }[] = [
    { label: "Périmé", value: "expired" },
    { label: "Bientôt périmé", value: "soon" },
    { label: "À consommer", value: "ok" },
    { label: "Sans date", value: "none" },
];

/** Une ligne par lot ; un produit épuisé garde une ligne (sans lot) pour rester visible. */
interface StockLotRow {
    key: string;
    itemId: number;
    label: string;
    item: StockItemWithLotsDto;
    lot: StockLotDto | null;
    copies: number | null;
    quantity: number | null;
    unit: string | null;
    locationId: number | null;
    expirationDate: Date | null;
    expiryState: StockExpiryState | null;
}

type EditableField = "copies" | "quantity" | "unit" | "locationId" | "expirationDate";

function toRows(items: StockItemWithLotsDto[]): StockLotRow[] {
    return items.flatMap((item): StockLotRow[] => item.lots.length === 0
        ? [{ key: `item-${item.id}`, itemId: item.id, label: item.label, item, lot: null, copies: null, quantity: null, unit: null, locationId: null, expirationDate: null, expiryState: null }]
        : item.lots.map((lot) => ({
            key: `lot-${lot.unitIds[0]}`,
            itemId: item.id,
            label: item.label,
            item,
            lot,
            copies: lot.unitIds.length,
            quantity: lot.quantity,
            unit: lot.unit,
            locationId: lot.locationId,
            expirationDate: parseApiDate(lot.expirationDate),
            expiryState: lot.expiryState,
        })));
}

function createInitialFilters(locationId: number | null): DataTableFilterMeta {
    return {
        global: { value: "", matchMode: FilterMatchMode.CONTAINS },
        locationId: { value: locationId, matchMode: FilterMatchMode.EQUALS },
        expiryState: { value: null, matchMode: FilterMatchMode.EQUALS },
    };
}

function getFilterValue<T>(filters: DataTableFilterMeta, field: string): T | null {
    const filter = filters[field];
    return filter && "value" in filter ? filter.value as T | null : null;
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
    locations: StockLocation[] | null;
    overview: StockDashboardOverviewDto | null;
    initialLocationId: number | null;
    refreshKey: number;
    onEditItem: (item: StockItemWithLotsDto) => void;
    onAddToItem: (item: StockItemWithLotsDto, locationId: number | null) => void;
    onManageLocations: () => void;
    /** Appelé après toute modification du stock (édition en cellule, prise, ajout, suppression). */
    onChanged: () => void;
}

/**
 * Tableau des stocks : un groupe par produit, une ligne par lot.
 * Exemplaires, contenu, unité, lieu et péremption se corrigent directement dans la cellule.
 */
export default function StockItemsTable({ locations, overview, initialLocationId, refreshKey, onEditItem, onAddToItem, onManageLocations, onChanged }: StockItemsTableProps) {
    const [items, setItems] = useState<StockItemWithLotsDto[] | null>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>(() => createInitialFilters(initialLocationId));
    const [sortField, setSortField] = useState<string | undefined>();
    const [sortOrder, setSortOrder] = useState<SortOrder>(1);
    const [includeEmpty, setIncludeEmpty] = useState(false);
    const [loading, setLoading] = useState(true);
    const rows = toRows(items ?? []);
    const [saving, setSaving] = useState(false);
    const selectedLocationId = getFilterValue<number>(filters, "locationId");
    const expiryFilter = getFilterValue<StockExpiryState>(filters, "expiryState");
    const search = getFilterValue<string>(filters, "global") ?? "";
    const hasFilters = search.trim() !== "" || selectedLocationId !== null || expiryFilter !== null || includeEmpty;
    const lazyState: DataTableLazyState = {
        first: 0,
        rows: 50,
        page: 1,
        sortField,
        sortOrder,
        filters,
    };

    useEffect(() => {
        if (locations && selectedLocationId !== null && !locations.some((location) => location.id === selectedLocationId)) {
            setFilters((current) => ({
                ...current,
                locationId: { value: null, matchMode: FilterMatchMode.EQUALS },
            }));
        }
    }, [locations, selectedLocationId]);

    useEffect(() => {
        let active = true;
        const timeout = window.setTimeout(() => {
            setLoading(true);
            itemsService.search(lazyState, includeEmpty)
                .then((loaded) => { if (active) setItems(loaded); })
                .catch(() => { if (active) setItems((current) => current ?? []); })
                .finally(() => { if (active) setLoading(false); });
        }, 250);
        return () => {
            active = false;
            window.clearTimeout(timeout);
        };
    }, [filters, includeEmpty, refreshKey, sortField, sortOrder]);

    const setFilter = (field: string, value: unknown, matchMode = FilterMatchMode.EQUALS): void => {
        setFilters((current) => ({ ...current, [field]: { value, matchMode } }));
    };

    const saveCell = async (event: ColumnEvent): Promise<void> => {
        const row = event.rowData as StockLotRow;
        const field = event.field as EditableField;
        if (!row.lot || sameValue(event.value, event.newValue)) return;
        const changes = toInlineChanges(field, event.newValue);
        if (!changes) {
            showGlobalToast({ severity: "warn", summary: "Valeur refusée", detail: "La quantité et le nombre d'exemplaires doivent être positifs." });
            return;
        }
        setSaving(true);
        try {
            await entryService.save(editLotEntry(row.item, row.lot, changes));
        } finally {
            setSaving(false);
            onChanged();
        }
    };

    const duplicate = async (row: StockLotRow): Promise<void> => {
        if (!row.lot) return;
        setSaving(true);
        try {
            await entryService.save(duplicateLotEntry(row.item, row.lot));
            showGlobalToast({ severity: "success", summary: `${row.item.label} : 1 exemplaire ajouté` });
        } finally {
            setSaving(false);
            onChanged();
        }
    };

    const groupHeader = (row: StockLotRow) => (
        <div className="flex items-center gap-3">
            {row.item.imageUrl && (
                <img src={row.item.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy"
                    className="h-8 w-8 shrink-0 rounded object-contain" />
            )}
            <div className="min-w-0 flex-1">
                <span className="text-sm text-gray-500">
                    {row.item.brand && <>{row.item.brand} · </>}
                    {row.item.stockUnitsCount > 0 ? `${row.item.stockUnitsCount} en stock` : "Épuisé"}
                </span>
            </div>
            <Button icon="pi pi-plus" rounded text aria-label={`Ajouter du stock : ${row.item.label}`}
                tooltip="Ajouter" tooltipOptions={{ position: "top" }} onClick={() => onAddToItem(row.item, selectedLocationId)} />
            <Button icon="pi pi-pencil" rounded text severity="secondary" aria-label={`Modifier ${row.item.label}`}
                tooltip="Modifier le produit" tooltipOptions={{ position: "top" }} onClick={() => onEditItem(row.item)} />
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            <StockOverviewBar overview={overview} expiryFilter={expiryFilter}
                onExpiryFilterChange={(state) => setFilter("expiryState", state)} />
            <Button icon="pi pi-cog" text rounded severity="secondary" aria-label="Gérer les lieux de stockage"
                tooltip="Gérer les lieux" tooltipOptions={{ position: "top" }} onClick={onManageLocations} />
            {items === null && loading ? (
                <div className="flex justify-center p-8"><ProgressSpinner /></div>
            ) : (
                <DataTable
                    value={rows}
                    dataKey="key"
                    editMode="cell"
                    size="small"
                    lazy
                    loading={saving || loading}
                    header={(
                        <div className="flex justify-end">
                            <label className="flex items-center gap-2">
                                <InputSwitch checked={includeEmpty} onChange={(event) => setIncludeEmpty(event.value === true)} />
                                Afficher les épuisés
                            </label>
                            <InputSearch placeholder="Rechercher (nom, marque, code-barres)" value={search}
                                className="w-full md:w-80"
                                onChange={(event) => setFilter("global", event.target.value, FilterMatchMode.CONTAINS)}
                                aria-label="Rechercher un produit" />
                        </div>
                    )}

                    // Sort
                    globalFilterFields={["label", "item.brand", "item.barcode"]}
                    onSort={(event) => {
                        setSortField(event.sortField || undefined);
                        setSortOrder(event.sortOrder as SortOrder);
                    }}
                    sortMode="single"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    removableSort

                    // Filtres
                    filterDisplay="row"
                    filters={filters}
                    onFilter={(event) => setFilters(event.filters)}

                    // Group
                    rowGroupMode="subheader"
                    groupRowsBy="itemId"
                    rowGroupHeaderTemplate={groupHeader}

                    breakpoint="768px"
                    emptyMessage={hasFilters
                        ? "Aucun produit ne correspond à ces filtres."
                        : "Aucun produit en stock. Ajoute-en avec « Ajouter » ou « Scanner »."}
                >
                    <Column
                        field="label"
                        header="Produit"
                        sortable
                        body={(row: StockLotRow) => !row.lot || row.lot.unitIds[0] === row.item.lots[0]?.unitIds[0]
                            ? <span className="font-semibold">{row.item.label}</span>
                            : null} />
                    <Column
                        field="copies"
                        header="Exemplaires"
                        style={{ width: "8rem" }}
                        className="cursor-pointer"
                        body={(row: StockLotRow) => row.lot ? `${row.lot.unitIds.length} ×` : <span className="text-gray-500">—</span>}
                        editor={(options) => (options.rowData as StockLotRow).lot
                            ? numberEditor(options, { min: 1, max: 1000, inputClassName: "w-20" })
                            : <span className="text-gray-500">—</span>}
                        onCellEditComplete={(event) => void saveCell(event)}
                    />
                    <Column
                        field="quantity"
                        header="Contenu"
                        style={{ width: "10rem" }}
                        className="cursor-pointer" // Modifiable via editor
                        body={(row: StockLotRow) => row.lot
                            ? `${row.lot.quantity} ${row.lot.unit}`
                            : <span className="text-gray-500">—</span>}
                        editor={(options) => {
                            const row = options.rowData as StockLotRow;
                            return row.lot
                                ? numberEditor(options, { min: 0, maxFractionDigits: 3, suffix: ` ${row.lot.unit}`, inputClassName: "w-24" })
                                : <span className="text-gray-500">—</span>;
                        }}
                        onCellEditComplete={(event) => void saveCell(event)}
                    />
                    <Column
                        field="locationId"
                        header="Lieu"
                        filter
                        showFilterMenu={false}
                        className="cursor-pointer"
                        body={(row: StockLotRow) => row.lot ? row.lot.locationLabel : <span className="text-gray-500">—</span>}
                        filterElement={(options: ColumnFilterElementTemplateOptions) => (
                            <Dropdown value={options.value ?? null} options={locations ?? []}
                                optionLabel="label" optionValue="id" placeholder="Tous les lieux"
                                onChange={(event) => options.filterApplyCallback(event.value ?? null)} />
                        )}
                        editor={(options) => (options.rowData as StockLotRow).lot
                            ? dropdownEditor(options, locations ?? [])
                            : <span className="text-gray-500">—</span>}
                        onCellEditComplete={(event) => void saveCell(event)} />
                    <Column
                        field="expirationDate"
                        filterField="expiryState"
                        header="Péremption"
                        style={{ width: "11rem" }}
                        filter
                        showFilterMenu={false}
                        className="cursor-pointer"
                        body={(row: StockLotRow) => row.lot
                            ? <StockExpiryDateTag lot={row.lot} />
                            : <span className="text-gray-500">—</span>
                        }
                        filterElement={(options: ColumnFilterElementTemplateOptions) => (
                            <Dropdown value={options.value ?? null} options={EXPIRY_FILTER_OPTIONS}
                                optionLabel="label" optionValue="value" placeholder="Tous les états"
                                onChange={(event) => options.filterApplyCallback(event.value ?? null)} />
                        )}
                        editor={(options) => (options.rowData as StockLotRow).lot
                            ? (
                                <Calendar
                                    value={options.value as Date | null}
                                    dateFormat="dd/mm/yy"
                                    showButtonBar
                                    placeholder="Sans date"
                                    inputClassName="w-28" onChange={(event) => options.editorCallback?.(event.value instanceof Date ? event.value : null)} />
                            )
                            : <span className="text-gray-500">—</span>
                        }
                        onCellEditComplete={(event) => void saveCell(event)}
                    />
                    <Column
                        header=""
                        style={{ width: "9rem" }}
                        body={(row: StockLotRow) => row.lot
                            ? (
                                <div className="flex justify-end">
                                    <TakeStockUnitButton unitId={row.lot.unitIds[0]} unitLabel={row.item.label} afterTakeUnit={onChanged} />
                                    <Button icon="pi pi-clone" rounded text
                                        aria-label={`Ajouter un exemplaire identique : ${row.item.label}`}
                                        tooltip="Ajouter un exemplaire identique" tooltipOptions={{ position: "top" }}
                                        onClick={() => void duplicate(row)} />
                                    <DeleteStockUnitButton itemLabel={row.item.label} unitId={row.lot.unitIds[row.lot.unitIds.length - 1]}
                                        afterDeleteUnit={onChanged} />
                                </div>
                            )
                            : null
                        } />
                </DataTable>
            )}
        </div>
    );
}
