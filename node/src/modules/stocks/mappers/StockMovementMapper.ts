import type { StockMovementDto } from "@chocosous/shared";
import { StockMovement } from "../entities/StockMovement";

/** Convertit une entité StockMovement en DTO exposé par l'API. */
export function toStockMovementDto(movement: StockMovement): StockMovementDto {
    return {
        id: movement.id,
        itemLabel: movement.itemLabel,
        locationId: movement.locationId,
        locationLabel: movement.locationLabel,
        unit: movement.unit,
        itemId: movement.itemId,
        unitId: movement.unitId,
        type: movement.type,
        quantity: movement.quantity,
        createdAt: movement.createdAt.toISOString(),
    };
}
