import { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import type { StockDashboardOverviewDto, StockItemWithLotsDto } from "@chocosous/shared";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import StockLocationService from "@/services/stocks/StockLocationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { PageTemplate } from "../PageTemplate";
import StockEntryDialog from "./organisms/StockEntryDialog";
import StockItemsTable from "./organisms/StockItemsTable";
import StockLocationsDialog from "./organisms/StockLocationsDialog";
import StockMovementsDialog from "./organisms/StockMovementsDialog";
import { Card } from "primereact/card";

const locationService = new StockLocationService();
const dashboardService = new StockDashboardService();
const localStorageUtils = new LocalStorageUtils();
const CONFIRM_GROUP = "stocks-page";

export default function StocksPage() {
    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [overview, setOverview] = useState<StockDashboardOverviewDto | null>(null);

    const [refreshKey, setRefreshKey] = useState(0);
    const [entryItemId, setEntryItemId] = useState<number | undefined>();
    const [addLot, setAddLot] = useState(false);
    const [entryLocationId, setEntryLocationId] = useState<number | null>(null);
    const [currentLocationId, setCurrentLocationId] = useState<number | null>(localStorageUtils.getLastStockLocationId());

    // Dialogs
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [locationsDialogVisible, setLocationsDialogVisible] = useState(false);
    const [locationHistoryDialogVisible, setLocationHistoryDialogVisible] = useState(false);

    const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

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
        if (currentLocationId !== null) {
            localStorageUtils.setLastStockLocationId(currentLocationId);
        }
    }, [currentLocationId]);


    const closeEntryDialog = useCallback(() => setShowEntryDialog(false), []);

    /**
     * Ouvre la boîte de dialogue d'entrée de stock.
     * @param itemId Identifiant du produit à modifier ; absent pour une nouvelle saisie.
     * @param addNewLot Indique s'il faut ajouter un nouveau lot au produit.
     * @param locationId Identifiant de l'emplacement par défaut pour le lot.
     */
    const openEntryDialog = (itemId?: number, addNewLot = false, locationId: number | null = null): void => {
        setEntryItemId(itemId);
        setAddLot(addNewLot);
        setEntryLocationId(locationId);
        setShowEntryDialog(true);
    };
    const onEntrySaved = useCallback((_item: StockItemWithLotsDto, usedLocationId: number | null) => {
        if (usedLocationId !== null) {
            setCurrentLocationId(usedLocationId);
        }
        refresh();
    }, [refresh]);

    return (
        <PageTemplate pageTitle="Stocks">
            <ConfirmDialog />
            <ConfirmDialog
                group={CONFIRM_GROUP}
            />
            {showEntryDialog && locations && (
                <StockEntryDialog
                    locations={locations}
                    itemId={entryItemId}
                    addLot={addLot}
                    defaultLocationId={entryLocationId ?? currentLocationId}
                    onClose={closeEntryDialog}
                    onSaved={onEntrySaved} />
            )}
            {locationsDialogVisible && (
                <StockLocationsDialog
                    locations={locations}
                    confirmGroup={CONFIRM_GROUP}
                    onClose={() => setLocationsDialogVisible(false)}
                    onChanged={refresh}
                />
            )}
            {locationHistoryDialogVisible && (
                <StockMovementsDialog refreshKey={refreshKey} onClose={() => setLocationHistoryDialogVisible(false)} />
            )}
            <div className="flex flex-col gap-4 pb-20 md:pb-0">
                <Card
                    title={
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="m-0 text-xl font-semibold">Stocks</h2>
                            <nav aria-label="Actions des stocks" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                <Button
                                    icon="pi pi-plus"
                                    label="Ajouter"
                                    className="col-span-2 sm:order-last"
                                    onClick={() => openEntryDialog()}
                                />
                                <Button
                                    icon="pi pi-history"
                                    tooltip="Historique"
                                    outlined
                                    rounded text
                                    severity="secondary"
                                    onClick={() => setLocationHistoryDialogVisible(true)}
                                />
                                <Button
                                    icon="pi pi-map-marker"
                                    label="Lieux"
                                    outlined severity="secondary"
                                    onClick={() => setLocationsDialogVisible(true)}
                                />
                            </nav>
                        </div>
                    }
                >
                    <div className="flex w-full flex-col gap-3">
                        <StockItemsTable
                            locations={locations}
                            overview={overview}
                            filterLocationId={entryLocationId ?? currentLocationId}
                            refreshKey={refreshKey}
                            onEditItem={(item: StockItemWithLotsDto) => openEntryDialog(item.id)}
                            onAddToItem={(item: StockItemWithLotsDto, selectedLocationId: number | null) =>
                                openEntryDialog(item.id, true, selectedLocationId)}
                            onChanged={refresh} />
                    </div>
                </Card>
            </div>
        </PageTemplate>
    );
}
