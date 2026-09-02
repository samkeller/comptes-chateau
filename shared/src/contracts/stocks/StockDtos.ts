import type { StockMovementType } from "./StockMovementTypes";

/** Lieu de stockage tel que renvoyé par l'API. */
export interface StockLocationDto {
    id: number;
    label: string;
    createdAt: string;
}

/** Produit en stock tel que renvoyé par l'API. */
export interface StockItemDto {
    id: number;
    label: string;
    barcode: string | null;
    defaultUnit: string;
    imageUrl: string | null;
    stockUnitsCount: number;
    createdAt: string;
}

/** Unité de produit en stock telle que renvoyée par l'API. */
export interface StockUnitDto {
    id: number;
    itemId: number;
    item: StockItemDto;
    locationId: number;
    location: StockLocationDto;
    quantity: number;
    unit: string;
    expirationDate: string | null;
}

/** Mouvement de stock tel que renvoyé par l'API. */
export interface StockMovementDto {
    id: number;
    itemId: number;
    itemLabel: string;
    unitId: number;
    quantity: number;
    unit: string;
    locationId: number;
    locationLabel: string;
    type: StockMovementType;
}
