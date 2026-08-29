import { StockMovement } from "../entities/StockMovement";
import type { StockMovementType } from "@chocosous/shared";

export interface StockMovementDto {
    id: number;
    itemId: number;
    type: StockMovementType;
    quantity: number;
    occurredAt: string;
    source: string;
    createdAt: string;
}

export function toStockMovementDto(movement: StockMovement): StockMovementDto {
    return {
        id: movement.id,
        itemId: movement.itemId,
        type: movement.type,
        quantity: movement.quantity,
        occurredAt: movement.occurredAt.toISOString(),
        source: movement.source,
        createdAt: movement.createdAt.toISOString(),
    };
}
