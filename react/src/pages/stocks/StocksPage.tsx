import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { ProgressSpinner } from "primereact/progressspinner";
import type { StockDashboardOverviewDto, StockExpiryState, StockItemWithLotsDto } from "@chocosous/shared";
import InputSearch from "@/components/atoms/primereact/InputSearch";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockLocationService from "@/services/stocks/StockLocationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { PageTemplate } from "../PageTemplate";
import StockOverviewBar from "./molecules/StockOverviewBar";
import StockEntryDialog, { type StockEntryDialogRequest } from "./organisms/StockEntryDialog";
import StockItemsTable from "./organisms/StockItemsTable";
import StockLocationsDialog from "./organisms/StockLocationsDialog";
import StockMovementsDialog from "./organisms/StockMovementsDialog";
import { Card } from "primereact/card";

const itemsService = new StockItemsService();
const locationService = new StockLocationService();
const dashboardService = new StockDashboardService();
const CONFIRM_GROUP = "stocks-page";
const SEARCH_DEBOUNCE_MS = 250;

function readLocationFilter(searchParams: URLSearchParams): number | null {
    const value = Number(searchParams.get("locationId"));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function readLastLocationId(): number | null {
    try { return new LocalStorageUtils().getLastStockLocationId(); } catch { return null; }
}

function rememberLocationId(locationId: number): void {
    try { new LocalStorageUtils().setLastStockLocationId(locationId); } catch { /* Stockage local facultatif. */ }
}

/**
 * Écran unique des stocks : consulter, filtrer, ajouter (manuel ou scan), cocher et corriger directement dans le tableau.
 * `?action=scan` ou `?action=add` ouvre directement la saisie (raccourcis / anciennes routes).
 */
export default function StocksPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [locations, setLocations] = useState<StockLocation[] | null>(null);
    const [overview, setOverview] = useState<StockDashboardOverviewDto | null>(null);
    const [items, setItems] = useState<StockItemWithLotsDto[] | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [locationId, setLocationId] = useState<number | null>(() => readLocationFilter(searchParams));
    const [expiryState, setExpiryState] = useState<StockExpiryState | null>(null);
    const [includeEmpty, setIncludeEmpty] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [entryRequest, setEntryRequest] = useState<StockEntryDialogRequest | null>(() => {
        const action = searchParams.get("action");
        return action === "scan" || action === "add" ? { scan: action === "scan" } : null;
    });
    const [lastLocationId, setLastLocationId] = useState<number | null>(readLastLocationId);
    const [locationsDialogVisible, setLocationsDialogVisible] = useState(false);
    const [locationHistoryDialogVisible, setLocationHistoryDialogVisible] = useState(false);

    const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

    useEffect(() => {
        // L'action n'est jouée qu'une fois : elle ne doit pas se rouvrir au rechargement.
        if (searchParams.has("action")) setSearchParams({}, { replace: true });
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        let active = true;
        Promise.all([locationService.listLocations(), dashboardService.getOverview()])
            .then(([loadedLocations, loadedOverview]) => {
                if (!active) return;
                setLocations(loadedLocations);
                setOverview(loadedOverview);
            })
            .catch(() => undefined);
        return () => { active = false; };
    }, [refreshKey]);

    useEffect(() => {
        if (locations && locationId !== null && !locations.some((location) => location.id === locationId)) {
            setLocationId(null);
        }
    }, [locations, locationId]);

    useEffect(() => {
        let active = true;
        itemsService.search({ search: debouncedSearch, locationId, expiryState, includeEmpty })
            .then((loaded) => { if (active) setItems(loaded); })
            .catch(() => { if (active) setItems((current) => current ?? []); });
        return () => { active = false; };
    }, [debouncedSearch, locationId, expiryState, includeEmpty, refreshKey]);

    const locationList = locations ?? [];
    const defaultLocationId = locationId
        ?? (locationList.some((location) => location.id === lastLocationId) ? lastLocationId : locationList[0]?.id ?? null);

    const closeEntryDialog = useCallback(() => setEntryRequest(null), []);
    const onEntrySaved = useCallback((_item: StockItemWithLotsDto, usedLocationId: number | null) => {
        if (usedLocationId !== null) {
            rememberLocationId(usedLocationId);
            setLastLocationId(usedLocationId);
        }
        refresh();
    }, [refresh]);

    const hasFilters = debouncedSearch.trim() !== "" || locationId !== null || expiryState !== null;

    return (
        <PageTemplate pageTitle="Stocks">
            <ConfirmDialog />
            <ConfirmDialog group={CONFIRM_GROUP} />
            {entryRequest && locations && (
                <StockEntryDialog request={entryRequest} locations={locations} defaultLocationId={defaultLocationId}
                    onClose={closeEntryDialog} onSaved={onEntrySaved} />
            )}
            {locationsDialogVisible && (
                <StockLocationsDialog locations={locationList} confirmGroup={CONFIRM_GROUP}
                    onClose={() => setLocationsDialogVisible(false)} onChanged={refresh} />
            )}
            {locationHistoryDialogVisible && (
                <StockMovementsDialog refreshKey={refreshKey} onClose={() => setLocationHistoryDialogVisible(false)} />
            )}
            <div className="flex flex-col gap-4 pb-20 md:pb-0">
                <Card
                    title={
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="m-0 text-xl">Stocks</h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    icon="pi pi-plus"
                                    label="Ajouter"
                                    onClick={() => setEntryRequest({})}
                                />
                                <Button
                                    icon="pi pi-barcode"
                                    rounded outlined
                                    tooltip="Scanner"
                                    tooltipOptions={{ position: "left" }}
                                    onClick={() => setEntryRequest({ scan: true })}
                                />
                                <Button
                                    icon="pi pi-history"
                                    rounded text
                                    tooltip="Historique"
                                    tooltipOptions={{ position: "left" }}
                                    onClick={() => setLocationHistoryDialogVisible(true)}
                                />
                            </div>
                        </div>
                    }
                >
                    <div className="flex w-full flex-col gap-3">
                        <StockOverviewBar overview={overview} expiryFilter={expiryState} onExpiryFilterChange={setExpiryState} />
                        <div className="flex flex-wrap items-center gap-2">
                            <InputSearch placeholder="Rechercher (nom, marque, code-barres)" value={search} className="w-full md:w-80"
                                onChange={(event) => setSearch(event.target.value)} aria-label="Rechercher un produit" />
                            <div className="flex items-center gap-1">
                                <Dropdown value={locationId} options={locationList} optionValue="id" showClear
                                    optionLabel="label" placeholder="Tous les lieux" aria-label="Filtrer par lieu"
                                    itemTemplate={(location: StockLocation) => `${location.label} (${location.stockUnitCount})`}
                                    onChange={(event) => setLocationId((event.value as number | null) ?? null)} />
                                <Button icon="pi pi-cog" text rounded severity="secondary" aria-label="Gérer les lieux de stockage"
                                    tooltip="Gérer les lieux" tooltipOptions={{ position: "top" }}
                                    onClick={() => setLocationsDialogVisible(true)} />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <InputSwitch checked={includeEmpty} onChange={(event) => setIncludeEmpty(event.value === true)} />
                                Afficher les épuisés
                            </label>
                        </div>

                        {items === null ? (
                            <div className="flex justify-center p-8"><ProgressSpinner /></div>
                        ) : locations?.length === 0 && overview?.stockUnitCount === 0 ? (
                            <div className="flex flex-col items-start gap-2 p-4">
                                <p className="m-0">Commence par créer un lieu de stockage (frigo, cellier…).</p>
                                <Button icon="pi pi-map-marker" label="Créer un lieu" onClick={() => setLocationsDialogVisible(true)} />
                            </div>
                        ) : (
                            <StockItemsTable items={items} locations={locationList}
                                emptyMessage={
                                    hasFilters
                                        ? "Aucun produit ne correspond à ces filtres."
                                        : "Aucun produit en stock. Ajoute-en avec « Ajouter » ou « Scanner »."
                                }
                                onEditItem={(item: StockItemWithLotsDto) => setEntryRequest({ itemId: item.id })}
                                onAddToItem={(item: StockItemWithLotsDto) => setEntryRequest({ itemId: item.id, addLot: true })}
                                onChanged={refresh} />
                        )}
                    </div>
                </Card>
            </div>
        </PageTemplate>
    );
}
