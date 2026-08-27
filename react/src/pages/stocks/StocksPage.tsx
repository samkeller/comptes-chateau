import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { generatePath, useNavigate, useParams } from "react-router-dom";
import { PageTemplate } from "../PageTemplate";
import { routePaths } from "@/routes/routePaths";
import StockService from "@/services/stocks/StockService";
import StockLocation from "@/interfaces/stocks/StockLocation";
import StockItem from "@/interfaces/stocks/StockItem";
import { useGlobalToast } from "@/context/GlobalToastContext";
import StockLocationDialog from "./StockLocationDialog";
import StockItemDialog from "./StockItemDialog";
import StockLocationsPanel from "./organisms/StockLocationsPanel";
import StockLocationItemsView from "./organisms/StockLocationItemsView";
import { SaveStockItemDto } from "@/services/stocks/dto/SaveStockItemDto";

const stockService = new StockService();
const LOCATION_DELETE_GROUP = "stock-location-delete";
const ITEM_DELETE_GROUP = "stock-item-delete";

export default function StocksPage() {
    const showToast = useGlobalToast();
    const navigate = useNavigate();
    const { locationId: locationIdParam } = useParams<{ locationId: string }>();
    const selectedLocationId = locationIdParam ? Number(locationIdParam) : null;

    const [loadingLocations, setLoadingLocations] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [items, setItems] = useState<StockItem[]>([]);

    const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
    const [isLocationDialogVisible, setIsLocationDialogVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [isItemDialogVisible, setIsItemDialogVisible] = useState(false);

    const selectedLocation = useMemo(
        () => locations.find((location) => location.id === selectedLocationId) ?? null,
        [locations, selectedLocationId]
    );

    const loadLocations = useCallback(async (): Promise<void> => {
        setLoadingLocations(true);
        setErrorMessage(null);

        try {
            setLocations(await stockService.listLocations());
        } catch {
            setErrorMessage("Impossible de charger les lieux de stockage.");
        } finally {
            setLoadingLocations(false);
        }
    }, []);

    const loadItems = useCallback(async (locationId: number): Promise<void> => {
        setLoadingItems(true);
        setErrorMessage(null);

        try {
            setItems(await stockService.listItems(locationId));
        } catch {
            setErrorMessage("Impossible de charger les produits en stock.");
        } finally {
            setLoadingItems(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadLocations();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadLocations]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (selectedLocationId === null) {
                setItems([]);
            } else {
                void loadItems(selectedLocationId);
            }
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadItems, selectedLocationId]);

    // Garde l'URL cohérente avec les lieux disponibles : sélectionne le premier lieu par défaut,
    // ou redirige si le lieu demandé n'existe plus (ex: suppression).
    useEffect(() => {
        if (loadingLocations) {
            return;
        }

        if (selectedLocationId !== null && locations.some((location) => location.id === selectedLocationId)) {
            return;
        }

        if (selectedLocationId !== null) {
            navigate(routePaths.stocks, { replace: true });
        }
    }, [loadingLocations, locations, selectedLocationId, navigate]);

    async function handleLocationSubmit(payload: { label: string }): Promise<void> {
        if (editingLocation) {
            await stockService.updateLocation(editingLocation.id, payload);
            showToast({ severity: "success", summary: "Lieu mis à jour" });
            await loadLocations();
        } else {
            const createdLocation = await stockService.createLocation(payload);
            showToast({ severity: "success", summary: "Lieu créé" });
            await loadLocations();
            navigate(generatePath(routePaths.stocksLocation, { locationId: String(createdLocation.id) }));
        }

        setIsLocationDialogVisible(false);
        setEditingLocation(null);
    }

    async function handleItemSubmit(payload: SaveStockItemDto): Promise<void> {
        if (editingItem) {
            await stockService.updateItem(editingItem.id, payload);
            showToast({ severity: "success", summary: "Produit mis à jour" });
        } else {
            await stockService.createItem(payload);
            showToast({ severity: "success", summary: "Produit créé" });
        }

        if (selectedLocationId !== null) {
            await loadItems(selectedLocationId);
        }

        setIsItemDialogVisible(false);
        setEditingItem(null);
    }

    async function handleQuantityChange(item: StockItem, newQuantity: number): Promise<void> {
        const delta = newQuantity - item.currentQuantity;
        if (delta === 0) {
            return;
        }

        try {
            await stockService.recordMovement(item.id, {
                type: delta > 0 ? "IN" : "OUT",
                quantity: Math.abs(delta),
                occurredAt: new Date(),
                source: "manual",
            });

            if (selectedLocationId !== null) {
                await loadItems(selectedLocationId);
            }
        } catch {
            showToast({
                severity: "error",
                summary: "Mouvement refusé",
                detail: "Vérifiez la quantité disponible pour ce produit.",
            });
        }
    }

    function requestDeleteLocation(location: StockLocation): void {
        confirmDialog({
            group: LOCATION_DELETE_GROUP,
            header: "Supprimer le lieu",
            message: `Supprimer le lieu "${location.label}" ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                stockService.deleteLocation(location.id)
                    .then(() => {
                        showToast({ severity: "success", summary: "Lieu supprimé" });
                        return loadLocations();
                    })
                    .catch(() => {
                        showToast({
                            severity: "error",
                            summary: "Suppression impossible",
                            detail: "Déplacez ou supprimez d'abord les produits rattachés à ce lieu.",
                        });
                    });
            },
        });
    }

    function requestDeleteItem(item: StockItem): void {
        confirmDialog({
            group: ITEM_DELETE_GROUP,
            header: "Supprimer le produit",
            message: `Supprimer "${item.label}" des stocks actifs ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                stockService.deleteItem(item.id)
                    .then(() => {
                        showToast({ severity: "success", summary: "Produit supprimé" });
                        if (selectedLocationId !== null) {
                            return loadItems(selectedLocationId);
                        }
                    })
                    .catch(() => {
                        showToast({
                            severity: "error",
                            summary: "Suppression impossible",
                            detail: "Le produit n'a pas pu être supprimé.",
                        });
                    });
            },
        });
    }

    return (
        <PageTemplate pageTitle="Stocks">
            <ConfirmDialog group={LOCATION_DELETE_GROUP} />
            <ConfirmDialog group={ITEM_DELETE_GROUP} />

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

            {isItemDialogVisible && (
                <StockItemDialog
                    key={`${editingItem?.id ?? "new-item"}-${selectedLocationId ?? "no-location"}`}
                    visible
                    item={editingItem}
                    locations={locations}
                    selectedLocationId={selectedLocationId}
                    onHide={() => {
                        setIsItemDialogVisible(false);
                        setEditingItem(null);
                    }}
                    onSubmit={handleItemSubmit}
                    onQuantityChange={handleQuantityChange}
                />
            )}

            <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
                {errorMessage && (
                    <Card>
                        <div className="text-red-500">{errorMessage}</div>
                    </Card>
                )}

                <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-6">
                    <StockLocationsPanel
                        className="lg:h-full lg:min-h-0 lg:w-72 lg:shrink-0"
                        locations={locations}
                        selectedLocation={selectedLocation}
                        loading={loadingLocations}
                        onSelect={(location) => {
                            if (location.id === selectedLocationId)
                                navigate(routePaths.stocks, { replace: true });
                            else
                                navigate(generatePath(routePaths.stocksLocation, { locationId: String(location.id) }))
                        }}
                        onAddLocation={() => setIsLocationDialogVisible(true)}
                        onEditLocation={(location) => {
                            setEditingLocation(location);
                            setIsLocationDialogVisible(true);
                        }}
                        onDeleteLocation={requestDeleteLocation}
                    />

                    <Card
                        title={selectedLocation
                            ? `Produits — ${selectedLocation.label}`
                            : "Produits"}
                        className="lg:h-full lg:min-h-0 lg:min-w-0 lg:flex-1"
                        pt={{ body: { className: "h-full" }, content: { className: "h-full flex flex-col gap-4" } }}
                    >
                        {selectedLocation && (
                            <div className="flex justify-end">
                                <Button label="Ajouter un produit" icon="pi pi-plus" size="small" onClick={() => setIsItemDialogVisible(true)} />
                            </div>
                        )}

                        {!selectedLocation ? (
                            <div className="text-surface-500">Créez d'abord un lieu pour ajouter des produits.</div>
                        ) : (
                            <StockLocationItemsView
                                items={items}
                                loading={loadingItems}
                                onEdit={(item) => {
                                    setEditingItem(item);
                                    setIsItemDialogVisible(true);
                                }}
                                onDelete={requestDeleteItem}
                                onQuantityChange={handleQuantityChange}
                            />
                        )}
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}

