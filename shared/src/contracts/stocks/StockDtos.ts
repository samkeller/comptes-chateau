import type { StockExpiryState } from "./StockExpiry";
import type { StockMovementType } from "./StockMovementTypes";

/** Lieu de stockage tel que renvoyé par l'API. */
export interface StockLocationDto {
    id: number;
    label: string;
    createdAt: string;
    stockUnitCount: number;
}

/** Produit du catalogue tel que renvoyé par l'API. Un produit n'est jamais supprimé, même épuisé. */
export interface StockItemDto {
    id: number;
    label: string;
    barcode: string | null;
    brand: string | null;
    defaultUnit: string;
    imageUrl: string | null;
    stockUnitsCount: number;
    nextStockUnitExpiration: string | null;
    createdAt: string;
}

/**
 * Lot : exemplaires identiques (même lieu, quantité, unité et date) d'un produit.
 * Agrégé côté serveur ; `unitIds` permet de cocher/supprimer un exemplaire du lot.
 */
export interface StockLotDto {
    locationId: number;
    locationLabel: string;
    quantity: number;
    unit: string;
    expirationDate: string | null;
    expiryState: StockExpiryState;
    /** Exemplaires du lot, du plus ancien au plus récent. */
    unitIds: number[];
}

/** Produit et ses lots en stock (filtrés par lieu le cas échéant). */
export interface StockItemWithLotsDto extends StockItemDto {
    lots: StockLotDto[];
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
    createdAt: string;
}

/** Synthèse des exemplaires actuellement présents, sans additionner des unités de mesure différentes. */
export interface StockDashboardOverviewDto {
    inStockItemCount: number;
    stockUnitCount: number;
    datedUnitCount: number;
    /** Exemplaires dont la date est strictement passée. */
    expiredUnitCount: number;
    /** Exemplaires non périmés expirant d'ici 30 jours inclus. */
    expiringSoonUnitCount: number;
}
