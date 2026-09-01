import type { StockItemDto } from "@chocosous/shared";
import { toStockLocationDto } from "./StockLocationDto";
import { StockItem } from "../entities/StockItem";

/** Convertit une entité StockItem en DTO exposé par l'API. */
export function toStockItemDto(item: StockItem): StockItemDto {
    return {
        id: item.id,
        label: item.label,
        barcode: item.barcode,
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        locationId: item.locationId,
        location: toStockLocationDto(item.location),
        expirationDate: item.expirationDate ?? null,
        imageUrl: item.imageUrl ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    };
}
