import { CreateStockUnitDto } from "./CreateStockUnitDto";
import { StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import type { CreateStockItemDto as SharedCreateStockItemDto } from "@chocosous/shared";

export interface CreateStockItemDto {
    id?: number;
    label: string;
    barcode?: string;
    defaultUnit: StockUnitUnits;
    imageUrl?: string;
    units: CreateStockUnitDto[];
}

/**
 * Payload envoyé à l'API stockItem : les stockUnits sont persistées séparément via /stocks/units.
 */
export type SaveStockItemPayload = SharedCreateStockItemDto;
