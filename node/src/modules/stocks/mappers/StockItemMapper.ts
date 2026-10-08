import type { StockItemDto, StockItemWithLotsDto, StockLotDto } from "@chocosous/shared";
import { normalizeStockUnit } from "@chocosous/shared";
import { StockItem } from "../entities/StockItem";

/**
 * Convertit un produit en DTO.
 * @param lots Lots en stock du produit (déjà filtrés) ; servent au décompte et à la prochaine échéance.
 */
export function toStockItemDto(item: StockItem, lots: StockLotDto[]): StockItemDto {
    const nextExpirationDate = lots
        .map((lot) => lot.expirationDate)
        .filter((date): date is string => date !== null)
        .sort()[0];

    return {
        id: item.id,
        label: item.label,
        barcode: item.barcode,
        brand: item.brand ?? null,
        defaultUnit: normalizeStockUnit(item.defaultUnit),
        imageUrl: item.imageUrl ?? null,
        stockUnitsCount: lots.reduce((count, lot) => count + lot.unitIds.length, 0),
        nextStockUnitExpiration: nextExpirationDate ?? null,
        createdAt: item.createdAt.toISOString(),
    };
}

export function toStockItemWithLotsDto(item: StockItem, lots: StockLotDto[]): StockItemWithLotsDto {
    return { ...toStockItemDto(item, lots), lots };
}
