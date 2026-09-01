import type { StockUnitDto } from "@chocosous/shared";
import { toStockItemDto } from "./StockItemMapper";
import { toStockLocationDto } from "./StockLocationMapper";
import { StockUnit } from "../entities/StockUnit";

export function toStockUnitDto(unit: StockUnit): StockUnitDto {
    return {
        id: unit.id,
        itemId: unit.itemId,
        item: toStockItemDto(unit.item),
        locationId: unit.locationId,
        location: toStockLocationDto(unit.location),
        quantity: unit.quantity,
        unit: unit.unit,
        expirationDate: unit.expirationDate ?? null,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
    };
}
