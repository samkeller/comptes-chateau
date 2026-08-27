import { StockLocation } from "../entities/StockLocation";

export interface StockLocationDto {
    id: number;
    label: string;
    createdAt: string;
    updatedAt: string;
}

export function toStockLocationDto(location: StockLocation): StockLocationDto {
    return {
        id: location.id,
        label: location.label,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
    };
}
