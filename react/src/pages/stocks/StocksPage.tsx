import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { format, parseISO } from "date-fns";
import { PageTemplate } from "../PageTemplate";
import StockService from "@/services/stocks/StockService";
import StockLocation from "@/interfaces/stocks/StockLocation";
import StockItem from "@/interfaces/stocks/StockItem";
import { useGlobalToast } from "@/context/GlobalToastContext";
import StockLocationDialog from "./StockLocationDialog";
import StockItemDialog from "./StockItemDialog";
import StockMovementDialog from "./StockMovementDialog";
import StockHistoryDialog from "./StockHistoryDialog";
import { SaveStockItemDto } from "@/services/stocks/dto/SaveStockItemDto";
import { RecordStockMovementDto } from "@/services/stocks/dto/RecordStockMovementDto";

const stockService = new StockService();
const LOCATION_DELETE_GROUP = "stock-location-delete";
const ITEM_DELETE_GROUP = "stock-item-delete";

function formatQuantity(quantity: number): string {
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(quantity);
}

export default function StocksPage() {
    const showToast = useGlobalToast();

    const [loadingLocations, setLoadingLocations] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [items, setItems] = useState<StockItem[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
    const [isLocationDialogVisible, setIsLocationDialogVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [isItemDialogVisible, setIsItemDialogVisible] = useState(false);
    const [movementItem, setMovementItem] = useState<StockItem | null>(null);
    const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

    useEffect(() => {
        void loadLocations();
    }, []);

    useEffect(() => {
        if (selectedLocationId === null) {
            setItems([]);
            return;
        }

        void loadItems(selectedLocationId);
    }, [selectedLocationId]);

    const selectedLocation = useMemo(
        () => locations.find((location) => location.id === selectedLocationId) ?? null,
        [locations, selectedLocationId]
    );

    async function loadLocations(nextSelectedLocationId?: number | null): Promise<void> {
        setLoadingLocations(true);
        setErrorMessage(null);

        try {
            const fetchedLocations = await stockService.listLocations();
            setLocations(fetchedLocations);

            const resolvedLocationId =
                nextSelectedLocationId
                ?? (selectedLocationId && fetchedLocations.some((location) => location.id === selectedLocationId) ? selectedLocationId : null)
                ?? fetchedLocations[0]?.id
                ?? null;

            setSelectedLocationId(resolvedLocationId);
        } catch {
            setErrorMessage("Impossible de charger les lieux de stockage.");
        } finally {
            setLoadingLocations(false);
        }
    }

    async function loadItems(locationId: number): Promise<void> {
        setLoadingItems(true);
        setErrorMessage(null);

        try {
            setItems(await stockService.listItems(locationId));
        } catch {
            setErrorMessage("Impossible de charger les produits en stock.");
        } finally {
            setLoadingItems(false);
        }
    }

    async function handleLocationSubmit(payload: { label: string }): Promise<void> {
        if (editingLocation) {
            await stockService.updateLocation(editingLocation.id, payload);
            showToast({ severity: "success", summary: "Lieu mis à jour" });
            await loadLocations(editingLocation.id);
        } else {
            const createdLocation = await stockService.createLocation(payload);
            showToast({ severity: "success", summary: "Lieu créé" });
            await loadLocations(createdLocation.id);
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

        if (payload.locationId !== selectedLocationId) {
            await loadLocations(payload.locationId);
        } else if (selectedLocationId) {
            await loadItems(selectedLocationId);
        }

        setIsItemDialogVisible(false);
        setEditingItem(null);
    }

    async function handleMovementSubmit(payload: RecordStockMovementDto): Promise<void> {
        if (!movementItem || selectedLocationId === null) {
            return;
        }

        await stockService.recordMovement(movementItem.id, payload);
        showToast({ severity: "success", summary: "Mouvement enregistré" });
        await loadItems(selectedLocationId);
        setMovementItem(null);
    }

    async function applyQuickMovement(item: StockItem, type: "IN" | "OUT"): Promise<void> {
        try {
            await stockService.recordMovement(item.id, {
                type,
                quantity: 1,
                occurredAt: new Date(),
                source: "manual",
            });

            showToast({
                severity: "success",
                summary: type === "IN" ? "Quantité augmentée" : "Quantité diminuée",
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
                        return loadLocations(null);
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
                    });
            },
        });
    }

    return (
        <PageTemplate pageTitle="Stocks">
            <ConfirmDialog group={LOCATION_DELETE_GROUP} />
            <ConfirmDialog group={ITEM_DELETE_GROUP} />

            <StockLocationDialog
                visible={isLocationDialogVisible}
                location={editingLocation}
                onHide={() => {
                    setIsLocationDialogVisible(false);
                    setEditingLocation(null);
                }}
                onSubmit={handleLocationSubmit}
            />

            <StockItemDialog
                visible={isItemDialogVisible}
                item={editingItem}
                locations={locations}
                selectedLocationId={selectedLocationId}
                onHide={() => {
                    setIsItemDialogVisible(false);
                    setEditingItem(null);
                }}
                onSubmit={handleItemSubmit}
            />

            <StockMovementDialog
                visible={Boolean(movementItem)}
                item={movementItem}
                onHide={() => setMovementItem(null)}
                onSubmit={handleMovementSubmit}
            />

            <StockHistoryDialog
                visible={Boolean(historyItem)}
                item={historyItem}
                onHide={() => setHistoryItem(null)}
            />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="m-0 text-2xl font-semibold">Chocostocks</h2>
                        <p className="m-0 text-surface-500">Suivi rapide des produits, lieux et mouvements de stock.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button label="Ajouter un lieu" icon="pi pi-map-marker" onClick={() => setIsLocationDialogVisible(true)} />
                        <Button
                            label="Ajouter un produit"
                            icon="pi pi-plus"
                            onClick={() => setIsItemDialogVisible(true)}
                            disabled={locations.length === 0}
                        />
                    </div>
                </div>

                {errorMessage && (
                    <Card>
                        <div className="text-red-500">{errorMessage}</div>
                    </Card>
                )}

                <Card title="Lieux de stockage">
                    {loadingLocations ? (
                        <div className="flex justify-center p-8">
                            <ProgressSpinner />
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex flex-col gap-3 text-surface-500">
                            <span>Aucun lieu configuré.</span>
                            <div>
                                <Button label="Créer le premier lieu" onClick={() => setIsLocationDialogVisible(true)} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {locations.map((location) => (
                                    <button
                                        key={location.id}
                                        type="button"
                                        className={`min-w-44 rounded-xl border px-4 py-3 text-left transition ${location.id === selectedLocationId ? "border-primary bg-primary-50" : "border-surface-300 bg-white"}`}
                                        onClick={() => setSelectedLocationId(location.id)}
                                    >
                                        <div className="font-semibold">{location.label}</div>
                                        <div className="text-sm text-surface-500">
                                            {location.id === selectedLocationId ? "Lieu actif" : "Appuyer pour afficher"}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {selectedLocation && (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        label="Renommer"
                                        icon="pi pi-pencil"
                                        outlined
                                        size="small"
                                        onClick={() => {
                                            setEditingLocation(selectedLocation);
                                            setIsLocationDialogVisible(true);
                                        }}
                                    />
                                    <Button
                                        label="Supprimer"
                                        icon="pi pi-trash"
                                        outlined
                                        severity="danger"
                                        size="small"
                                        onClick={() => requestDeleteLocation(selectedLocation)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <Card title={selectedLocation ? `Produits — ${selectedLocation.label}` : "Produits"}>
                    {selectedLocationId === null ? (
                        <div className="text-surface-500">Créez d'abord un lieu pour ajouter des produits.</div>
                    ) : loadingItems ? (
                        <div className="flex justify-center p-8">
                            <ProgressSpinner />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col gap-3 text-surface-500">
                            <span>Aucun produit dans ce lieu.</span>
                            <div>
                                <Button label="Ajouter un produit" icon="pi pi-plus" onClick={() => setIsItemDialogVisible(true)} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {items.map((item) => (
                                <div key={item.id} className="rounded-xl border border-surface-200 p-4 shadow-sm">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-lg font-semibold">{item.label}</div>
                                                <div className="text-sm text-surface-500">
                                                    {formatQuantity(item.currentQuantity)} {item.unit}{item.currentQuantity > 1 ? "s" : ""}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button icon="pi pi-history" text rounded aria-label="Historique" onClick={() => setHistoryItem(item)} />
                                                <Button
                                                    icon="pi pi-pencil"
                                                    text
                                                    rounded
                                                    aria-label="Modifier"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsItemDialogVisible(true);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 text-sm text-surface-500">
                                            {item.barcode && <span>Code-barres : {item.barcode}</span>}
                                            {item.expirationDate && <span>Péremption : {format(parseISO(item.expirationDate), "dd/MM/yyyy")}</span>}
                                            {item.imageUrl && <span className="truncate">Image : {item.imageUrl}</span>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                            <Button label="-1" severity="secondary" outlined onClick={() => void applyQuickMovement(item, "OUT")} />
                                            <Button label="+1" onClick={() => void applyQuickMovement(item, "IN")} />
                                            <Button label="Ajuster" text onClick={() => setMovementItem(item)} />
                                            <Button label="Supprimer" text severity="danger" onClick={() => requestDeleteItem(item)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </PageTemplate>
    );
}
