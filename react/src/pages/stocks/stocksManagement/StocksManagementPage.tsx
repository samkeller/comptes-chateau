import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { routePaths } from "@/routes/routePaths";
import { useGlobalToast } from "@/context/GlobalToastContext";
import StockLocation from "@/interfaces/stocks/StockLocation";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockItemsService from "@/services/stocks/StockItemsService";
import { StockIntakeDto } from "@/services/stocks/dto/StockIntakeDto";
import StockLocationDialog from "./StockLocationDialog";
import StockIntakeDialog from "./StockIntakeDialog";
import StockLocationsPanel from "./organisms/StockLocationsPanel";
import StockUnitDatatable from "./organisms/StockUnitDatatable";
import StockItem from "@/interfaces/stocks/StockItem";

const stockItemsService = new StockItemsService();
const stockLocationService = new StockLocationService();
const LOCATION_DELETE_GROUP = "stock-location-delete";
const STOCK_TAKE_GROUP = "stock-take";

export default function StocksManagementPage() {
    const showToast = useGlobalToast();
    const navigate = useNavigate();
    const { locationId: locationIdParam } = useParams<{ locationId: string }>();
    const selectedLocationId = locationIdParam ? Number(locationIdParam) : null;

    const [loadingLocations, setLoadingLocations] = useState(true);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [items, setItems] = useState<StockItem[]>([]);
    const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
    const [isLocationDialogVisible, setIsLocationDialogVisible] = useState(false);
    const [isIntakeDialogVisible, setIsIntakeDialogVisible] = useState(false);

    const selectedLocation = useMemo(
        () => locations.find((location) => location.id === selectedLocationId) ?? null,
        [locations, selectedLocationId]
    );

    useEffect( ()=> {
        loadInitialData();
    }, [])
    
    
    useEffect(() => {
        loadData()
    }, [selectedLocationId]);

    const loadInitialData = async (): Promise<void> => {
        await Promise.all([
            loadLocations(),
        ]);
    };

    const loadData = async (): Promise<void> => {
        await Promise.all([
            loadUnits(),
        ]);
    };


    const loadLocations = useCallback(async (): Promise<void> => {
        setLoadingLocations(true);
        try {
            setLocations(await stockLocationService.listLocations());
        } catch {
            showToast({ severity: "error", summary: "Impossible de charger les lieux de stockage." });
        } finally {
            setLoadingLocations(false);
        }
    }, [showToast]);

    const loadUnits = useCallback(async (locationId?: number): Promise<void> => {
        setLoadingUnits(true);
        try {
            setItems(await stockItemsService.getAllStockItems(locationId ?? undefined));
        } catch {
            showToast({ severity: "error", summary: "Impossible de charger les produits disponibles." });
        } finally {
            setLoadingUnits(false);
        }
    }, [showToast]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadLocations();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadLocations]);

    useEffect(() => {
        if (loadingLocations) {
            return;
        }

        if (selectedLocationId !== null && locations.some((location) => location.id === selectedLocationId)) {
            return;
        }

        if (selectedLocationId !== null) {
            navigate(routePaths.stocksManagement, { replace: true });
        }
    }, [loadingLocations, locations, selectedLocationId, navigate]);

    async function refreshStock(): Promise<void> {
        await Promise.all([
            loadLocations(),
        ]);
    }

    async function handleLocationSubmit(payload: { label: string }): Promise<void> {
        if (editingLocation) {
            await stockLocationService.updateLocation(editingLocation.id, payload);
            showToast({ severity: "success", summary: "Lieu mis a jour" });
        } else {
            const createdLocation = await stockLocationService.createLocation(payload);
            showToast({ severity: "success", summary: "Lieu cree" });
            navigate(generatePath(routePaths.stocksManagementLocation, { locationId: String(createdLocation.id) }));
        }

        setIsLocationDialogVisible(false);
        setEditingLocation(null);
        await refreshStock();
    }

    /**
     * @deprecated TODO
     * @param payload 
     */
    async function handleIntakeSubmit(payload: StockIntakeDto): Promise<void> {
        // await stockItemsService.intake(payload);
        // showToast({ severity: "success", summary: "Produit ajoute au stock" });
        // setIsIntakeDialogVisible(false);
        // await loadUnits(selectedLocationId ?? undefined);
    }

    /**
     * @deprecated TODO
     * @param payload 
     */
    function requestTakeUnit(unit: StockUnit): void {
        // confirmDialog({
        //     group: STOCK_TAKE_GROUP,
        //     header: "Prendre ce produit",
        //     message: `Marquer "${unit.item.label}" comme pris ?`,
        //     icon: "pi pi-check-circle",
        //     acceptLabel: "Prendre",
        //     rejectLabel: "Annuler",
        //     accept: () => {
        //         stockItemsService.takeUnit(unit.id, { occurredAt: new Date(), source: "manual" })
        //             .then(() => {
        //                 showToast({ severity: "success", summary: "Produit pris" });
        //                 return loadUnits(selectedLocationId ?? undefined);
        //             })
        //             .catch(() => {
        //                 showToast({ severity: "error", summary: "Action impossible" });
        //             });
        //     },
        // });
    }

    function requestDeleteLocation(location: StockLocation): void {
        confirmDialog({
            group: LOCATION_DELETE_GROUP,
            header: "Supprimer le lieu",
            message: `Supprimer le lieu "${location.label}" ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                stockLocationService.deleteLocation(location.id)
                    .then(() => {
                        showToast({ severity: "success", summary: "Lieu supprime" });
                        return refreshStock();
                    })
                    .catch(() => {
                        showToast({
                            severity: "error",
                            summary: "Suppression impossible",
                            detail: "Retirez d'abord les produits disponibles dans ce lieu.",
                        });
                    });
            },
        });
    }

    return (
        <>
            <ConfirmDialog group={LOCATION_DELETE_GROUP} />
            <ConfirmDialog group={STOCK_TAKE_GROUP} />

            {isLocationDialogVisible && (
                <StockLocationDialog
                    key={editingLocation?.id ?? "new-location"}
                    visible
                    location={editingLocation}
                    onHide={() => {
                        setIsLocationDialogVisible(false);
                        setEditingLocation(null);
                    }}
                    onSubmit={handleLocationSubmit}
                />
            )}

            {isIntakeDialogVisible && selectedLocationId !== null && (
                <StockIntakeDialog
                    visible
                    locationId={selectedLocationId}
                    onHide={() => setIsIntakeDialogVisible(false)}
                    onSubmit={handleIntakeSubmit}
                />
            )}

            <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
                <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-6">
                    <StockLocationsPanel
                        className="lg:h-full lg:min-h-0 lg:w-72 lg:shrink-0"
                        locations={locations}
                        selectedLocation={selectedLocation}
                        loading={loadingLocations}
                        onSelect={(location) => {
                            if (location.id === selectedLocationId) {
                                navigate(routePaths.stocksManagement, { replace: true });
                            } else {
                                navigate(generatePath(routePaths.stocksManagementLocation, { locationId: String(location.id) }));
                            }
                        }}
                        onAddLocation={() => setIsLocationDialogVisible(true)}
                        onEditLocation={(location) => {
                            setEditingLocation(location);
                            setIsLocationDialogVisible(true);
                        }}
                        onDeleteLocation={requestDeleteLocation}
                    />

                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex justify-between items-center gap-4 lg:w-full">
                            <h2 className="m-0 text-lg font-semibold">
                                {selectedLocation ? `Produits - ${selectedLocation.label}` : "Produits disponibles"}
                            </h2>
                            {selectedLocation && (
                                <Button label="Ajouter au stock" icon="pi pi-plus" size="small" onClick={() => setIsIntakeDialogVisible(true)} />
                            )}
                        </div>
                        <StockUnitDatatable
                            units={items}
                            loading={loadingUnits}
                            onTake={requestTakeUnit}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
