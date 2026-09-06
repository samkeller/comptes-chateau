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
