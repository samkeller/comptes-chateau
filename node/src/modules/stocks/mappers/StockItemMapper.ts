import type { StockItemDto } from "@chocosous/shared";
import { StockItem } from "../entities/StockItem";

export function toStockItemDto(item: StockItem): StockItemDto {

    const units = item.units || []; // Safe car typeorm peut retourner undefined

    const nextExpirationDate = units
        .map(u => u.expirationDate)
        .filter((d): d is string => d != null)  // Filtrage explicite
        .sort()[0];  // Déjà une string ISO, prêt à utiliser

    return {
        id: item.id,
        label: item.label,
        barcode: item.barcode,
        defaultUnit: item.defaultUnit,
        imageUrl: item.imageUrl ?? null,
        stockUnitsCount: item.units?.length ?? 0,
        nextStockUnitExpiration: nextExpirationDate,
        createdAt: item.createdAt.toISOString(),
    };
}
