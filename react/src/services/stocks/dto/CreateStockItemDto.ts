import { CreateStockUnitDto } from "./CreateStockUnitDto";

export interface CreateStockItemDto {
    id?: number;
    label: string;
    barcode?: string;
    defaultUnit: string;
    imageUrl?: string;
    units: CreateStockUnitDto[];
}
