import { StockMovement } from "../entities/StockMovement";

export interface StockMovementDto {
    id: number;
    itemId: number;
    unitId: number | null;
    fromLocationId: number | null;
    toLocationId: number | null;
    type: StockMovement["type"];
    quantity: number;
    occurredAt: string;
    source: string;
    createdAt: string;
}

export function toStockMovementDto(movement: StockMovement): StockMovementDto {
    return {
        id: movement.id,
        itemId: movement.itemId,
        unitId: movement.unitId,
        fromLocationId: movement.fromLocationId,
        toLocationId: movement.toLocationId,
        type: movement.type,
        quantity: movement.quantity,
        occurredAt: movement.occurredAt.toISOString(),
        source: movement.source,
        createdAt: movement.createdAt.toISOString(),
    };
}
