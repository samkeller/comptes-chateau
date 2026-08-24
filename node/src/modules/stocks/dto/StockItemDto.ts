import { StockLocationDto, toStockLocationDto } from "./StockLocationDto";
import { StockItem } from "../entities/StockItem";

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
