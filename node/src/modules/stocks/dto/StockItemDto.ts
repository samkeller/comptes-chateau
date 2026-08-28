import { StockItem } from "../entities/StockItem";

export interface StockItemDto {
    id: number;
    label: string;
    barcode: string | null;
    defaultUnit: string;
    imageUrl: string | null;

    stockUnitsCount: number

    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

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
