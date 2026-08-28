import { StockItem } from "../entities/StockItem";

export interface StockItemDto {
    id: number;
    label: string;
    barcode: string | null;
    defaultUnit: string;
    imageUrl: string | null;

    stockUnitsId: number[]

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
        stockUnitsId: item.units.map(unit => unit.id),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
    };
}
