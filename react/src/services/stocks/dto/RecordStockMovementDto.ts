import { StockMovementType } from "@/interfaces/stocks/StockMovement";

export interface RecordStockMovementDto {
    type: StockMovementType;
    quantity: number;
    occurredAt?: Date;
    source?: string | null;
}
