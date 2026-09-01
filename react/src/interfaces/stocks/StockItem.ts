import { parseApiDateTime } from "@/utils/DatesUtils";
import type { StockUnitUnits } from "./StockUnit";

export default class StockItem {
    id: number = 0;
    label: string = "";
    barcode: string | null = null;
    defaultUnit: StockUnitUnits = "g";
    imageUrl: string | null = null;

    stockUnitsCount: number = 0;
    stockUnitsIds: number[] = [];

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;

    constructor(partial: Partial<StockItem>) {
        Object.assign(this, partial);

        if (partial.createdAt) this.createdAt = parseApiDateTime(partial.createdAt) ?? undefined;
        if (partial.updatedAt) this.updatedAt = parseApiDateTime(partial.updatedAt) ?? undefined;
        if (partial.deletedAt) this.deletedAt = parseApiDateTime(partial.deletedAt) ?? null;
    }
}
