import type { StockMovementDto } from "@chocosous/shared";
import { StockMovement } from "../entities/StockMovement";

/** Convertit une entité StockMovement en DTO exposé par l'API. */
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
