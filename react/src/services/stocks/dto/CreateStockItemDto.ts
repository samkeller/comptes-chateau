import { CreateStockUnitDto } from "./CreateStockUnitDto";
import { StockUnitUnits } from "@/interfaces/stocks/StockUnit";

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
export type SaveStockItemPayload = Omit<CreateStockItemDto, "units">;
