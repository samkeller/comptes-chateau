import type { StockItemDto } from "@chocosous/shared";
import { StockItem } from "../entities/StockItem";

export function toStockItemDto(item: StockItem): StockItemDto {
    return {
        id: item.id,
        label: item.label,
        barcode: item.barcode,
        defaultUnit: item.defaultUnit,
        imageUrl: item.imageUrl ?? null,
        stockUnitsCount: item.units ? item.units.length : 0,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
    };
}
