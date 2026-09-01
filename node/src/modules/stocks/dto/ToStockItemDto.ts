import { StockItemDto } from "@chocosous/shared";
import { StockItem } from "../entities/StockItem";
import { toStockUnitDto } from "./ToStockUnitDto";

export function toStockItemDto(item: StockItem): StockItemDto {
    return {
        id: item.id,
        label: item.label,
        currentQuantity: 0, // TODO
        expirationDate: item.expirationDate ? item.expirationDate.toISOString() : null,
        defaultUnit: item.defaultUnit,
        location: item.location ?? null,
        locationId: item.locationId,
        units: item.units ? item.units.map(toStockUnitDto) : [],
        barcode: item.barcode,
        imageUrl: item.imageUrl ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    };
}
