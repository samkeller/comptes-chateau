import type { StockLocationDto } from "@chocosous/shared";
import { StockLocation } from "../entities/StockLocation";

/** Convertit une entité StockLocation en DTO exposé par l'API. */
export function toStockLocationDto(location: StockLocation): StockLocationDto {
    return {
        id: location.id,
        label: location.label,
        createdAt: location.createdAt.toISOString(),
    };
}
