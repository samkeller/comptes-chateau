import type { StockMovementType } from "./RecordStockMovementDto";

/** Lieu de stockage tel que renvoyé par l'API. */
export interface StockLocationDto {
    id: number;
    label: string;
    createdAt: string;
    updatedAt: string;
}

/** Produit en stock tel que renvoyé par l'API. */
export interface StockItemDto {
    id: number;
    label: string;
    barcode: string | null;
    currentQuantity: number;
    unit: string;
    locationId: number;
    location: StockLocationDto;
    expirationDate: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Mouvement de stock tel que renvoyé par l'API. */
export interface StockMovementDto {
    id: number;
    itemId: number;
    type: StockMovementType;
    quantity: number;
    occurredAt: string;
    source: string;
    createdAt: string;
}
