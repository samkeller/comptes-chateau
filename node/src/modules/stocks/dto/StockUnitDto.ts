import { StockItemDto, toStockItemDto } from "./StockItemDto";
import { StockLocationDto, toStockLocationDto } from "./StockLocationDto";
import { StockUnit } from "../entities/StockUnit";

export interface StockUnitDto {
    id: number;
    itemId: number;
    item: StockItemDto;
    locationId: number;
    location: StockLocationDto;
    quantity: number;
    unit: string;
    expirationDate: string | null;
    createdAt: string;
    updatedAt: string;
}

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
