import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { ProgressSpinner } from "primereact/progressspinner";
import type { StockDashboardOverviewDto, StockExpiryState, StockItemWithLotsDto, StockLotDto } from "@chocosous/shared";
import InputSearch from "@/components/atoms/primereact/InputSearch";
import { useGlobalToast } from "@/context/GlobalToastContext";
import { useScreen } from "@/hooks/useScreen";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import StockEntryService from "@/services/stocks/StockEntryService";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { PageTemplate } from "../PageTemplate";
import StockEntryDialog, { type StockEntryDialogRequest } from "./entry/StockEntryDialog";
import { duplicateLotEntry } from "./entry/stockEntryDraft";
import StockItemCard from "./list/StockItemCard";
import StockLocationsDialog from "./locations/StockLocationsDialog";
import StockMovementsSidebar from "./StockMovementsSidebar";
import StockOverviewBar from "./StockOverviewBar";
import { Card } from "primereact/card";

const itemsService = new StockItemsService();
const entryService = new StockEntryService();
const unitsService = new StockUnitsService();
const locationService = new StockLocationService();
const dashboardService = new StockDashboardService();
const CONFIRM_GROUP = "stocks-page";
const SEARCH_DEBOUNCE_MS = 250;

function readLastLocationId(): number | null {
    try { return new LocalStorageUtils().getLastStockLocationId(); } catch { return null; }
}

function rememberLocationId(locationId: number): void {
    try { new LocalStorageUtils().setLastStockLocationId(locationId); } catch { /* Stockage local facultatif. */ }
}

/**
 * Écran unique des stocks : consulter, filtrer, ajouter (manuel ou scan), cocher et corriger.
 * `?action=scan` ou `?action=add` ouvre directement la saisie (raccourcis / anciennes routes).
 */
export default function StocksPage() {
    const showToast = useGlobalToast();
    const { isDesktop } = useScreen();
    const [searchParams, setSearchParams] = useSearchParams();
    const [locations, setLocations] = useState<StockLocation[] | null>(null);
    const [overview, setOverview] = useState<StockDashboardOverviewDto | null>(null);
    const [items, setItems] = useState<StockItemWithLotsDto[] | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [locationId, setLocationId] = useState<number | null>(null);
    const [expiryState, setExpiryState] = useState<StockExpiryState | null>(null);
    const [includeEmpty, setIncludeEmpty] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [busyItemId, setBusyItemId] = useState<number | null>(null);
    const [entryRequest, setEntryRequest] = useState<StockEntryDialogRequest | null>(() => {
        const action = searchParams.get("action");
        return action === "scan" || action === "add" ? { scan: action === "scan" } : null;
    });
    const [lastLocationId, setLastLocationId] = useState<number | null>(readLastLocationId);
    const [locationsDialogVisible, setLocationsDialogVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);

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
        let active = true;
        itemsService.search({ search: debouncedSearch, locationId, expiryState, includeEmpty })
            .then((loaded) => { if (active) setItems(loaded); })
            .catch(() => { if (active) setItems((current) => current ?? []); });
        return () => { active = false; };
    }, [debouncedSearch, locationId, expiryState, includeEmpty, refreshKey]);

    const locationList = locations ?? [];
    const defaultLocationId = locationId
        ?? (locationList.some((location) => location.id === lastLocationId) ? lastLocationId : locationList[0]?.id ?? null);

    const runOnItem = async (item: StockItemWithLotsDto, action: () => Promise<void>, success: string): Promise<void> => {
        setBusyItemId(item.id);
        try {
            await action();
            showToast({ severity: "success", summary: success });
            refresh();
        } catch {
            // Erreur affichée par l'intercepteur.
        } finally {
            setBusyItemId(null);
        }
    };

    const take = (item: StockItemWithLotsDto, lot: StockLotDto): void => {
        void runOnItem(item, () => unitsService.take(lot.unitIds[0]), `${item.label} : 1 exemplaire pris`);
    };
    const duplicate = (item: StockItemWithLotsDto, lot: StockLotDto): void => {
        void runOnItem(item, async () => { await entryService.save(duplicateLotEntry(item, lot)); }, `${item.label} : 1 exemplaire ajouté`);
    };
    const remove = (item: StockItemWithLotsDto, lot: StockLotDto): void => {
        confirmDialog({
            group: CONFIRM_GROUP,
            header: "Supprimer un exemplaire",
            message: `Supprimer un exemplaire de « ${item.label} » saisi par erreur ? Pour un produit consommé, utilise plutôt « Prendre ».`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => void runOnItem(item, () => unitsService.delete(lot.unitIds[lot.unitIds.length - 1]), "Exemplaire supprimé"),
        });
    };

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
            <ConfirmDialog group={CONFIRM_GROUP} />
            {entryRequest && locations && (
                <StockEntryDialog request={entryRequest} locations={locations} defaultLocationId={defaultLocationId}
                    onClose={closeEntryDialog} onSaved={onEntrySaved} />
            )}
            {locationsDialogVisible && (
                <StockLocationsDialog locations={locationList} confirmGroup={CONFIRM_GROUP}
                    onClose={() => setLocationsDialogVisible(false)} onChanged={refresh} />
            )}
            <StockMovementsSidebar visible={historyVisible} onHide={() => setHistoryVisible(false)} />
            <Card>
                <div className="flex w-full flex-col gap-3 pb-20 md:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button icon="pi pi-plus" label="Ajouter" onClick={() => setEntryRequest({})} />
                        <Button icon="pi pi-barcode" label="Scanner" outlined onClick={() => setEntryRequest({ scan: true })} />
                        <Button icon="pi pi-history" outlined severity="secondary" aria-label="Historique des mouvements"
                            {...(isDesktop ? { label: "Historique" } : { tooltip: "Historique" })}
                            onClick={() => setHistoryVisible(true)} />
                    </div>

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
                    ) : items.length === 0 ? (
                        <p className="p-4 text-gray-500">
                            {hasFilters ? "Aucun produit ne correspond à ces filtres." : "Aucun produit en stock. Ajoute-en avec « Ajouter » ou « Scanner »."}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                            {items.map((item) => (
                                <StockItemCard key={item.id} item={item} busy={busyItemId === item.id}
                                    onEdit={() => setEntryRequest({ itemId: item.id })}
                                    onAdd={() => setEntryRequest({ itemId: item.id, addLot: true })}
                                    onTake={(lot) => take(item, lot)}
                                    onDuplicate={(lot) => duplicate(item, lot)}
                                    onDelete={(lot) => remove(item, lot)} />
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </PageTemplate>
    );
}
