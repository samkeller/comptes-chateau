import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import type { StockDashboardOverviewDto, StockItemWithLotsDto } from "@chocosous/shared";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import StockLocationService from "@/services/stocks/StockLocationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { PageTemplate } from "../PageTemplate";
import StockEntryDialog, { type StockEntryDialogRequest } from "./organisms/StockEntryDialog";
import StockItemsTable from "./organisms/StockItemsTable";
import StockLocationsDialog from "./organisms/StockLocationsDialog";
import StockMovementsDialog from "./organisms/StockMovementsDialog";
import { Card } from "primereact/card";

const locationService = new StockLocationService();
const dashboardService = new StockDashboardService();
const CONFIRM_GROUP = "stocks-page";

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

    const locationList = locations ?? [];
    const defaultLocationId = locationList.some((location) => location.id === lastLocationId)
        ? lastLocationId
        : locationList[0]?.id ?? null;

    const closeEntryDialog = useCallback(() => setEntryRequest(null), []);
    const onEntrySaved = useCallback((_item: StockItemWithLotsDto, usedLocationId: number | null) => {
        if (usedLocationId !== null) {
            rememberLocationId(usedLocationId);
            setLastLocationId(usedLocationId);
        }
        refresh();
    }, [refresh]);

    return (
        <PageTemplate pageTitle="Stocks">
            <ConfirmDialog />
            <ConfirmDialog group={CONFIRM_GROUP} />
            {entryRequest && locations && (
                <StockEntryDialog request={entryRequest} locations={locations}
                    defaultLocationId={entryRequest.defaultLocationId ?? defaultLocationId}
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
                        {locations === null || overview === null ? (
                            <div className="flex justify-center p-8"><ProgressSpinner /></div>
                        ) : locations?.length === 0 && overview?.stockUnitCount === 0 ? (
                            <div className="flex flex-col items-start gap-2 p-4">
                                <p className="m-0">Commence par créer un lieu de stockage (frigo, cellier…).</p>
                                <Button icon="pi pi-map-marker" label="Créer un lieu" onClick={() => setLocationsDialogVisible(true)} />
                            </div>
                        ) : (
                            <StockItemsTable locations={locations} overview={overview}
                                initialLocationId={readLocationFilter(searchParams)} refreshKey={refreshKey}
                                onEditItem={(item: StockItemWithLotsDto) => setEntryRequest({ itemId: item.id })}
                                onAddToItem={(item: StockItemWithLotsDto, selectedLocationId: number | null) =>
                                    setEntryRequest({ itemId: item.id, addLot: true, defaultLocationId: selectedLocationId })}
                                onManageLocations={() => setLocationsDialogVisible(true)}
                                onChanged={refresh} />
                        )}
                    </div>
                </Card>
            </div>
        </PageTemplate>
    );
}
