import type { StockMovementType } from "@chocosous/shared";

export default class StockMovement {
    id: number = 0;
    itemId: number = 0;
    type: StockMovementType = "IN";
    quantity: number = 0;
    occurredAt: string = "";
    source: string = "manual";
    createdAt: string = "";

    constructor(partial: Partial<StockMovement>) {
        Object.assign(this, partial);
    }
}
